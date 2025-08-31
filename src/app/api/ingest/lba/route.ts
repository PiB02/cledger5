import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseService } from '@/lib/supabase'
import { errorFactory, errorResponse, withErrorHandler } from '@/lib/errors'
import { LBAClient } from '@cledger5/api-clients'
import { generateOfferFingerprint } from '@cledger5/utils'
import { z } from 'zod'
import crypto from 'crypto'

// Request validation schema
const IngestRequestSchema = z.object({
  from: z.string().optional(), // Date début YYYY-MM-DD
  to: z.string().optional(), // Date fin YYYY-MM-DD
  limit: z.number().min(1).max(10000).default(1000),
  perPage: z.number().min(10).max(500).default(100),
  departments: z.array(z.string()).optional(),
  romeCodes: z.array(z.string()).default(['M1805']), // Codes ROME multiples
  dryRun: z.boolean().default(false), // Mode simulation
})

type IngestRequest = z.infer<typeof IngestRequestSchema>

// Batch status tracking
interface BatchStatus {
  batchId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startedAt: Date
  totalFetched: number
  totalProcessed: number
  totalInserted: number
  totalUpdated: number
  totalDeduplicated: number
  totalErrors: number
  errors: string[]
  currentPage: number
}

// Global batch storage (à remplacer par Supabase Realtime en production)
const batchStatuses = new Map<string, BatchStatus>()

// Fonction pour hasher le contenu raw
function hashContent(content: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex')
}

// POST - Démarrer une ingestion
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Vérifier l'authentification admin
  const adminSecret = request.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    throw errorFactory.UNAUTHORIZED('Invalid admin secret')
  }

  // Valider la requête
  const body = await request.json()
  const params = IngestRequestSchema.parse(body)

  // Vérifier la configuration
  const lbaApiKey = process.env.LBA_ACCESS_TOKEN
  if (!lbaApiKey) {
    throw errorFactory.INTERNAL_ERROR('LBA API key not configured')
  }

  // Créer un batch ID unique
  const batchId = crypto.randomUUID()
  
  // Initialiser le statut du batch
  const batchStatus: BatchStatus = {
    batchId,
    status: 'pending',
    startedAt: new Date(),
    totalFetched: 0,
    totalProcessed: 0,
    totalInserted: 0,
    totalUpdated: 0,
    totalDeduplicated: 0,
    totalErrors: 0,
    errors: [],
    currentPage: 1,
  }
  
  batchStatuses.set(batchId, batchStatus)

  // Lancer l'ingestion en arrière-plan
  processIngestion(batchId, params).catch(error => {
    console.error('Ingestion error:', error)
    const status = batchStatuses.get(batchId)
    if (status) {
      status.status = 'failed'
      status.errors.push(error.message)
    }
  })

  // Retourner immédiatement avec le batch ID
  return NextResponse.json({
    success: true,
    data: {
      batchId,
      status: 'started',
      message: 'Ingestion started in background',
      streamUrl: `/api/batch/${batchId}/stream`,
    }
  })
})

// GET - Obtenir le statut d'un batch
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batchId')

  if (!batchId) {
    // Retourner la liste des batchs
    const batches = Array.from(batchStatuses.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, 10) // Derniers 10 batchs

    return NextResponse.json({
      success: true,
      data: batches,
    })
  }

  const batchStatus = batchStatuses.get(batchId)
  if (!batchStatus) {
    throw errorFactory.NOT_FOUND('Batch not found')
  }

  return NextResponse.json({
    success: true,
    data: batchStatus,
  })
})

// Fonction principale d'ingestion
async function processIngestion(batchId: string, params: IngestRequest) {
  const status = batchStatuses.get(batchId)
  if (!status) return

  status.status = 'processing'
  
  try {
    // Initialiser le client LBA
    const lbaClient = new LBAClient({
      apiKey: process.env.LBA_ACCESS_TOKEN!,
    })

    // Initialiser Supabase
    const supabase = createSupabaseService()

    // Créer une entrée de batch dans la base
    if (!params.dryRun) {
      await supabase.from('batches').insert({
        id: batchId,
        source: 'LBA',
        status: 'processing',
        metadata: {
          params,
          started_at: status.startedAt,
        }
      })
    }

    // Parcourir les pages de résultats pour chaque code ROME
    const searchParams = {
      from: params.from,
      to: params.to,
      departments: params.departments,
      romeCodes: params.romeCodes,
      per_page: params.perPage,
    }

    for await (const offers of lbaClient.fetchAllOffers(searchParams)) {
      status.currentPage++
      status.totalFetched += offers.length

      for (const lbaOffer of offers) {
        try {
          // Mapper vers notre format canonique
          const canonicalOffer = lbaClient.mapToCanonical(lbaOffer)
          
          // Calculer le hash du contenu
          const contentHash = hashContent(lbaOffer)
          
          // Sauvegarder dans offers_raw
          if (!params.dryRun) {
            const now = new Date().toISOString()
            const { error: rawError } = await supabase
              .from('offers_raw')
              .upsert({
                id: crypto.randomUUID(),
                source_id: 'LBA',
                source_offer_id: canonicalOffer.external_id,
                fetched_at: now,
                last_seen_at: now,
                is_active: true,
                origin_url: null, // Optional field
                raw: lbaOffer,
                content_sha256: Buffer.from(contentHash, 'hex'),
              }, {
                onConflict: 'source_id,source_offer_id,fetched_at',
              })
            
            if (rawError) {
              console.error('Error saving raw offer:', rawError)
              status.errors.push(`Raw save error for ${canonicalOffer.external_id}`)
              status.totalErrors++
              continue
            }
          }
          
          // Créer ou mettre à jour la company
          let companyId = null
          if (canonicalOffer.company) {
            if (!params.dryRun) {
              const { data: company, error: companyError } = await supabase
                .from('companies')
                .upsert({
                  siret: canonicalOffer.company.siret,
                  name: canonicalOffer.company.name,
                  size_range: canonicalOffer.company.size_range,
                }, {
                  onConflict: 'siret',
                  defaultToNull: false,
                })
                .select('id')
                .single()
              
              if (companyError) {
                console.error('Error saving company:', companyError)
                // Essayer de créer sans SIRET
                const { data: companyAlt } = await supabase
                  .from('companies')
                  .insert({
                    name: canonicalOffer.company.name,
                    size_range: canonicalOffer.company.size_range,
                  })
                  .select('id')
                  .single()
                
                companyId = companyAlt?.id
              } else {
                companyId = company.id
              }
            } else {
              companyId = 'dry-run-company-id'
            }
          }
          
          // Créer ou mettre à jour la location
          let locationId = null
          if (canonicalOffer.location && canonicalOffer.location.city) {
            if (!params.dryRun) {
              // Créer le point géographique si lat/lon disponibles
              const geoPoint = canonicalOffer.location.latitude && canonicalOffer.location.longitude
                ? `POINT(${canonicalOffer.location.longitude} ${canonicalOffer.location.latitude})`
                : null

              // D'abord essayer de trouver une location existante
              const { data: existingLocation } = await supabase
                .from('locations')
                .select('id')
                .eq('city', canonicalOffer.location.city)
                .eq('postal_code', canonicalOffer.location.postal_code)
                .limit(1)
                .single()

              let location = existingLocation
              let locationError = null

              // Si pas trouvée, créer une nouvelle location
              if (!existingLocation) {
                const result = await supabase
                  .from('locations')
                  .insert({
                    city: canonicalOffer.location.city,
                    postal_code: canonicalOffer.location.postal_code,
                    department_code: canonicalOffer.location.department_code,
                    region_code: canonicalOffer.location.region_code,
                    insee_code: canonicalOffer.location.insee_code,
                    geo: geoPoint,
                  })
                  .select('id')
                  .single()
                
                location = result.data
                locationError = result.error
              }

              if (locationError) {
                console.error('Error saving location:', locationError)
                // Créer sans contrainte unique
                const { data: locationAlt } = await supabase
                  .from('locations')
                  .insert({
                    city: canonicalOffer.location.city,
                    postal_code: canonicalOffer.location.postal_code,
                    department_code: canonicalOffer.location.department_code,
                    region_code: canonicalOffer.location.region_code,
                    insee_code: canonicalOffer.location.insee_code,
                    geo: geoPoint,
                  })
                  .select('id')
                  .single()
                
                locationId = locationAlt?.id
              } else {
                locationId = location.id
              }
            } else {
              locationId = 'dry-run-location-id'
            }
          }
          
          // Générer le fingerprint pour déduplication
          const fingerprint = generateOfferFingerprint({
            title: canonicalOffer.title || '',
            companyName: canonicalOffer.company?.name || '',
            city: canonicalOffer.location?.city || '',
            contractType: canonicalOffer.contract_types?.[0] || '',
          })
          
          // Vérifier si l'offre existe déjà (déduplication)
          if (!params.dryRun) {
            const { data: existingOffer } = await supabase
              .from('offers')
              .select('id')
              .eq('canonical_fingerprint', fingerprint)
              .single()
            
            if (existingOffer) {
              // Offre dupliquée, juste mettre à jour la source
              await supabase
                .from('offer_sources')
                .upsert({
                  offer_id: existingOffer.id,
                  source_id: 'LBA',
                  source_offer_id: canonicalOffer.external_id,
                  source_url: canonicalOffer.application_url,
                }, {
                  onConflict: 'source_id,source_offer_id',
                })
              
              status.totalDeduplicated++
            } else {
              // Nouvelle offre
              const { data: newOffer, error: offerError } = await supabase
                .from('offers')
                .insert({
                  canonical_fingerprint: fingerprint,
                  title: canonicalOffer.title,
                  description: canonicalOffer.description,
                  status: 'active',
                  alternance: canonicalOffer.alternance || true,
                  contract_type: canonicalOffer.contract_types?.[0] || null,
                  salary_min: canonicalOffer.salary_min,
                  salary_max: canonicalOffer.salary_max,
                  salary_period: canonicalOffer.salary_period,
                  rome_codes: canonicalOffer.rome_codes,
                  apply_url: canonicalOffer.application_url,
                  apply_phone: canonicalOffer.application_phone,
                  company_id: companyId,
                  location_id: locationId,
                  source_primary: 'LBA',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('id')
                .single()
              
              if (offerError) {
                console.error('Error saving offer:', offerError)
                status.errors.push(`Offer save error for ${canonicalOffer.external_id}: ${offerError.message}`)
                status.totalErrors++
              } else {
                status.totalInserted++
                
                // Ajouter la source
                await supabase
                  .from('offer_sources')
                  .insert({
                    offer_id: newOffer.id,
                    source_id: 'LBA',
                    source_offer_id: canonicalOffer.external_id,
                    source_url: canonicalOffer.application_url,
                  })
                
                // Déclencher l'enrichissement IA automatique pour les nouvelles offres
                try {
                  await supabase
                    .from('offer_enrichment')
                    .insert({
                      offer_id: newOffer.id,
                      enrichment_status: 'pending',
                      created_at: new Date().toISOString()
                    })
                  console.log(`✅ Enrichment queued for offer ${newOffer.id}`)
                } catch (enrichmentError) {
                  console.error(`⚠️ Failed to queue enrichment for ${newOffer.id}:`, enrichmentError)
                  // Ne pas faire échouer l'ingestion si l'enrichissement échoue
                }
              }
            }
          } else {
            // Mode dry run
            status.totalInserted++
          }
          
          status.totalProcessed++
        } catch (error) {
          console.error('Error processing offer:', error)
          status.errors.push(`Processing error: ${error}`)
          status.totalErrors++
        }
      }

      // Limiter au nombre demandé
      if (status.totalFetched >= params.limit) {
        break
      }
    }

    // Mettre à jour le statut final
    status.status = 'completed'
    
    // Mettre à jour le batch dans la base
    if (!params.dryRun) {
      await supabase
        .from('batches')
        .update({
          status: 'completed',
          metadata: {
            params,
            started_at: status.startedAt,
            completed_at: new Date(),
            stats: {
              totalFetched: status.totalFetched,
              totalProcessed: status.totalProcessed,
              totalInserted: status.totalInserted,
              totalUpdated: status.totalUpdated,
              totalDeduplicated: status.totalDeduplicated,
              totalErrors: status.totalErrors,
            }
          }
        })
        .eq('id', batchId)
    }
  } catch (error) {
    console.error('Batch processing error:', error)
    status.status = 'failed'
    status.errors.push(error instanceof Error ? error.message : 'Unknown error')
    
    // Mettre à jour le batch dans la base
    const supabase = createSupabaseService()
    await supabase
      .from('batches')
      .update({
        status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          errors: status.errors,
        }
      })
      .eq('id', batchId)
  }
} 