/**
 * Pipeline de canonicalisation des offres
 * Transforme offers_raw -> offers avec déduplication
 */

import { createSupabaseService } from '@/lib/supabase/service'
import { generateOfferFingerprint } from '@cledger5/utils'
import { z } from 'zod'

// Schema pour les données LBA brutes
const LBAOfferSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.object({
    name: z.string().optional(),
    siret: z.string().optional(),
  }).optional(),
  place: z.object({
    city: z.string().optional(),
    address: z.string().optional(),
    fullAddress: z.string().optional(),
  }).optional(),
  nafs: z.array(z.object({
    code: z.string(),
    label: z.string(),
  })).optional(),
  contact: z.any().optional(),
  url: z.string().nullable().optional(),
  ideaType: z.string().optional(),
})

type LBAOffer = z.infer<typeof LBAOfferSchema>

export interface CanonicalOffer {
  source_id: string
  source_offer_id: string
  title: string
  description?: string
  company_name?: string
  company_siret?: string
  company_naf_code?: string
  location_city?: string
  location_address?: string
  contact_email?: string
  external_url?: string
  canonical_fingerprint: string
}

/**
 * Canonicalise une offre LBA brute en format standardisé
 */
export async function canonicalizeOffer(rawOffer: any, sourceId: string): Promise<CanonicalOffer | null> {
  try {
    // Parse et valide les données
    const offer = LBAOfferSchema.parse(rawOffer)
    
    // Extraction des données principales
    const title = offer.title?.trim()
    const company_name = offer.company?.name?.trim()
    const company_siret = offer.company?.siret?.trim()
    const location_city = offer.place?.city?.trim()
    const location_address = offer.place?.fullAddress?.trim() || offer.place?.address?.trim()
    
    // Validation des données minimales requises
    if (!title || !company_name) {
      console.warn(`Skipping offer ${offer.id}: missing title or company name`)
      return null
    }
    
    // NAF code (premier si disponible)
    const company_naf_code = offer.nafs?.[0]?.code
    
    // Contact email (peut être chiffré dans LBA)
    const contact_email = typeof offer.contact?.email === 'string' ? offer.contact.email : undefined
    
    // Génération du fingerprint canonique
    const canonical_fingerprint = generateOfferFingerprint({
      title,
      company_name,
      location_city,
      contract_type: 'CDI', // Default pour LBA
    })
    
    const canonicalOffer: CanonicalOffer = {
      source_id: sourceId,
      source_offer_id: offer.id,
      title,
      description: title, // Pour l'instant, utiliser le titre comme description
      company_name,
      company_siret,
      company_naf_code,
      location_city,
      location_address,
      contact_email,
      external_url: offer.url || undefined,
      canonical_fingerprint,
    }
    
    return canonicalOffer
    
  } catch (error) {
    console.error(`Failed to canonicalize offer:`, error)
    return null
  }
}

/**
 * Traite un lot d'offres brutes et les insère/met à jour dans la table offers
 */
export async function processBatchOffers(sourceId: string, limit = 100): Promise<{
  processed: number
  inserted: number
  updated: number
  skipped: number
  errors: string[]
}> {
  const supabase = createSupabaseService()
  const errors: string[] = []
  let processed = 0
  let inserted = 0
  let updated = 0
  let skipped = 0
  
  try {
    // Récupère les offres brutes non traitées
    const { data: rawOffers, error: fetchError } = await supabase
      .from('offers_raw')
      .select('id, source_id, source_offer_id, raw, fetched_at')
      .eq('source_id', sourceId)
      .is('processed_at', null)
      .order('fetched_at', { ascending: true })
      .limit(limit)
    
    if (fetchError) {
      throw new Error(`Failed to fetch raw offers: ${fetchError.message}`)
    }
    
    if (!rawOffers || rawOffers.length === 0) {
      return { processed: 0, inserted: 0, updated: 0, skipped: 0, errors: [] }
    }
    
    console.log(`Processing ${rawOffers.length} raw offers from ${sourceId}`)
    
    for (const rawOffer of rawOffers) {
      try {
        processed++
        
        // Canonicalise l'offre
        const canonicalOffer = await canonicalizeOffer(rawOffer.raw, sourceId)
        
        if (!canonicalOffer) {
          skipped++
          // Marque comme traitée même si skippée
          await supabase
            .from('offers_raw')
            .update({ processed_at: new Date().toISOString() })
            .eq('id', rawOffer.id)
          continue
        }
        
        // Vérifie si l'offre existe déjà (par fingerprint)
        const { data: existingOffer } = await supabase
          .from('offers')
          .select('id, canonical_fingerprint')
          .eq('canonical_fingerprint', canonicalOffer.canonical_fingerprint)
          .single()
        
        if (existingOffer) {
          // Offre existe déjà, vérifie si cette source existe
          const { data: existingSource } = await supabase
            .from('offer_sources')
            .select('id')
            .eq('offer_id', existingOffer.id)
            .eq('source_id', sourceId)
            .eq('source_offer_id', canonicalOffer.source_offer_id)
            .single()
          
          if (!existingSource) {
            // Ajoute cette source comme source secondaire
            const { error: sourceError } = await supabase
              .from('offer_sources')
              .insert({
                offer_id: existingOffer.id,
                source_id: sourceId,
                source_offer_id: canonicalOffer.source_offer_id,
                first_seen_at: rawOffer.fetched_at,
                last_seen_at: rawOffer.fetched_at,
                is_primary: false,
              })
            
            if (sourceError) {
              errors.push(`Failed to add secondary source: ${sourceError.message}`)
              continue
            }
            
            updated++
          }
        } else {
          // Nouvelle offre, insère tout
          
          // D'abord, créer les entités liées si nécessaire
          let company_id: string | null = null
          let location_id: string | null = null
          
          // Créer/récupérer la company
          if (canonicalOffer.company_name) {
            const { data: company, error: companyError } = await supabase
              .from('companies')
              .upsert({
                name: canonicalOffer.company_name,
                siret: canonicalOffer.company_siret,
                naf_code: canonicalOffer.company_naf_code,
              }, {
                onConflict: canonicalOffer.company_siret ? 'siret' : 'name',
                ignoreDuplicates: false,
              })
              .select('id')
              .single()
            
            if (companyError && companyError.code !== '23505') { // Ignore duplicate key errors
              errors.push(`Failed to upsert company: ${companyError.message}`)
              continue
            }
            
            company_id = company?.id || null
          }
          
          // Créer/récupérer la location
          if (canonicalOffer.location_city) {
            const { data: location, error: locationError } = await supabase
              .from('locations')
              .upsert({
                city: canonicalOffer.location_city,
                address: canonicalOffer.location_address,
                country: 'FR',
              }, {
                onConflict: 'city,country',
                ignoreDuplicates: false,
              })
              .select('id')
              .single()
            
            if (locationError && locationError.code !== '23505') {
              errors.push(`Failed to upsert location: ${locationError.message}`)
              continue
            }
            
            location_id = location?.id || null
          }
          
          // Insérer l'offre canonique
          const { data: newOffer, error: offerError } = await supabase
            .from('offers')
            .insert({
              canonical_fingerprint: canonicalOffer.canonical_fingerprint,
              title: canonicalOffer.title,
              description: canonicalOffer.description,
              status: 'active',
              company_id,
              location_id,
              contact_email: canonicalOffer.contact_email,
              external_url: canonicalOffer.external_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single()
          
          if (offerError) {
            errors.push(`Failed to insert offer: ${offerError.message}`)
            continue
          }
          
          // Insérer la source primaire
          const { error: sourceError } = await supabase
            .from('offer_sources')
            .insert({
              offer_id: newOffer.id,
              source_id: sourceId,
              source_offer_id: canonicalOffer.source_offer_id,
              first_seen_at: rawOffer.fetched_at,
              last_seen_at: rawOffer.fetched_at,
              is_primary: true,
            })
          
          if (sourceError) {
            errors.push(`Failed to insert offer source: ${sourceError.message}`)
            continue
          }
          
          inserted++
        }
        
        // Marque l'offre brute comme traitée
        await supabase
          .from('offers_raw')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', rawOffer.id)
        
      } catch (error) {
        errors.push(`Error processing offer ${rawOffer.source_offer_id}: ${error}`)
        console.error(`Error processing offer ${rawOffer.source_offer_id}:`, error)
      }
    }
    
    console.log(`Batch processing complete: ${processed} processed, ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${errors.length} errors`)
    
    return {
      processed,
      inserted,
      updated,
      skipped,
      errors,
    }
    
  } catch (error) {
    console.error('Batch processing failed:', error)
    throw error
  }
}

/**
 * Traite toutes les offres brutes en attente pour une source donnée
 */
export async function processAllPendingOffers(sourceId: string, batchSize = 50): Promise<{
  totalProcessed: number
  totalInserted: number
  totalUpdated: number
  totalSkipped: number
  totalErrors: string[]
}> {
  let totalProcessed = 0
  let totalInserted = 0
  let totalUpdated = 0
  let totalSkipped = 0
  const totalErrors: string[] = []
  
  console.log(`Starting full canonicalization for source: ${sourceId}`)
  
  while (true) {
    const result = await processBatchOffers(sourceId, batchSize)
    
    if (result.processed === 0) {
      break // Aucune offre en attente
    }
    
    totalProcessed += result.processed
    totalInserted += result.inserted
    totalUpdated += result.updated
    totalSkipped += result.skipped
    totalErrors.push(...result.errors)
    
    console.log(`Batch complete. Total so far: ${totalProcessed} processed, ${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} skipped`)
    
    // Petite pause pour éviter de surcharger la base
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log(`Full canonicalization complete: ${totalProcessed} processed, ${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} skipped, ${totalErrors.length} errors`)
  
  return {
    totalProcessed,
    totalInserted,
    totalUpdated,
    totalSkipped,
    totalErrors,
  }
}