/**
 * Pipeline de canonicalisation spécifique aux offres France Travail
 * Transforme offers_raw (FT) -> offers avec données enrichies
 */

import { createSupabaseService } from '@/lib/supabase/service'
import { generateOfferFingerprint } from '@cledger5/utils'
import { z } from 'zod'

// Schema pour les données France Travail brutes
const FTOfferSchema = z.object({
  id: z.string(),
  intitule: z.string(),
  description: z.string().optional(),
  entreprise: z.object({
    nom: z.string().optional(),
    naf: z.object({
      code: z.string().optional(),
      libelle: z.string().optional(),
    }).optional(),
  }).optional(),
  lieuTravail: z.object({
    commune: z.string().optional(),
    codePostal: z.string().optional(),
    coordonnees: z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).optional(),
  }).optional(),
  typeContrat: z.string().optional(), // CDI, CDD, MIS, etc.
  natureContrat: z.string().optional(),
  experienceExigee: z.string().optional(), // D (débutant), S (expérimenté), E (expert)
  salaire: z.object({
    libelle: z.string().optional(),
    commentaire: z.string().optional(),
    complement1: z.string().optional(),
    complement2: z.string().optional(),
  }).optional(),
  dureeTravailLibelle: z.string().optional(),
  romeCode: z.string().optional(),
  competences: z.array(z.object({
    code: z.string().optional(),
    libelle: z.string().optional(),
    niveauExigence: z.string().optional(), // 1-3
  })).optional(),
  langues: z.array(z.object({
    libelle: z.string().optional(),
    exigence: z.string().optional(),
  })).optional(),
  formations: z.array(z.object({
    niveauLibelle: z.string().optional(),
    domaineLibelle: z.string().optional(),
  })).optional(),
  origineOffre: z.object({
    urlOrigine: z.string().optional(),
  }).optional(),
})

type FTOffer = z.infer<typeof FTOfferSchema>

export interface CanonicalOfferFT {
  source_id: string
  source_offer_id: string
  title: string
  description?: string
  company_name?: string
  company_naf_code?: string
  location_city?: string
  location_postal_code?: string
  location_coordinates?: { lat: number; lng: number }
  contract_type?: string
  contract_nature?: string
  experience_required?: string
  salary_info?: string
  work_duration?: string
  rome_code?: string
  skills?: Array<{ skill: string; level?: string }>
  languages?: Array<{ language: string; level?: string }>
  education?: Array<{ level?: string; domain?: string }>
  external_url?: string
  canonical_fingerprint: string
}

/**
 * Mappe les types de contrat FT vers le format canonique
 */
function mapContractType(ftContractType?: string): string {
  if (!ftContractType) return 'UNKNOWN'
  
  const mapping: Record<string, string> = {
    'CDI': 'CDI',
    'CDD': 'CDD', 
    'MIS': 'INTERIM',    // Mission intérimaire
    'SAI': 'CDD',        // Contrat saisonnier
    'CCE': 'INTERIM',    // Contrat de chantier
    'FPT': 'CDD',        // Fonction publique territoriale
    'REP': 'CDI',        // Remplacement
    'LIB': 'PRO',        // Profession libérale
    'FRA': 'PRO',        // Franchise
    'VAE': 'STAGE',      // Validation des acquis
    'STG': 'STAGE',      // Stage
    'APP': 'APP',        // Apprentissage
    'PRO': 'PRO',        // Contrat de professionnalisation
  }
  
  return mapping[ftContractType.toUpperCase()] || 'UNKNOWN'
}

/**
 * Mappe les niveaux d'expérience FT vers le format canonique
 */
function mapExperienceLevel(ftExperience?: string): string {
  if (!ftExperience) return 'unknown'
  
  const mapping: Record<string, string> = {
    'D': 'junior',     // Débutant accepté
    'S': 'mid',        // Souhaité (expérience)
    'E': 'senior',     // Exigé (expert)
  }
  
  return mapping[ftExperience.toUpperCase()] || 'unknown'
}

/**
 * Parse et structure les informations de salaire FT
 */
function parseSalaryInfo(salaire?: FTOffer['salaire']): string | undefined {
  if (!salaire) return undefined
  
  const parts: string[] = []
  
  if (salaire.libelle) {
    parts.push(salaire.libelle)
  }
  
  if (salaire.commentaire) {
    parts.push(salaire.commentaire)
  }
  
  if (salaire.complement1) {
    parts.push(salaire.complement1)
  }
  
  if (salaire.complement2) {
    parts.push(salaire.complement2)
  }
  
  return parts.length > 0 ? parts.join(' | ') : undefined
}

/**
 * Canonicalise une offre France Travail brute en format standardisé
 */
export async function canonicalizeOfferFT(rawOffer: any, sourceId: string): Promise<CanonicalOfferFT | null> {
  try {
    // Parse et valide les données FT
    const offer = FTOfferSchema.parse(rawOffer)
    
    // Extraction des données principales
    const title = offer.intitule?.trim()
    const company_name = offer.entreprise?.nom?.trim()
    const location_city = offer.lieuTravail?.commune?.trim()
    
    // Validation des données minimales requises
    if (!title) {
      console.warn(`Skipping FT offer ${offer.id}: missing title`)
      return null
    }
    
    // Informations géographiques enrichies
    const location_postal_code = offer.lieuTravail?.codePostal?.trim()
    const location_coordinates = offer.lieuTravail?.coordonnees && 
      offer.lieuTravail.coordonnees.latitude && 
      offer.lieuTravail.coordonnees.longitude
      ? {
          lat: offer.lieuTravail.coordonnees.latitude,
          lng: offer.lieuTravail.coordonnees.longitude
        }
      : undefined
    
    // Mapping des types de contrat et expérience
    const contract_type = mapContractType(offer.typeContrat)
    const experience_required = mapExperienceLevel(offer.experienceExigence)
    
    // Traitement des compétences
    const skills = offer.competences?.map(comp => ({
      skill: comp.libelle || '',
      level: comp.niveauExigence || undefined
    })).filter(s => s.skill.length > 0)
    
    // Traitement des langues
    const languages = offer.langues?.map(lang => ({
      language: lang.libelle || '',
      level: lang.exigence || undefined
    })).filter(l => l.language.length > 0)
    
    // Traitement des formations
    const education = offer.formations?.map(form => ({
      level: form.niveauLibelle || undefined,
      domain: form.domaineLibelle || undefined
    })).filter(e => e.level || e.domain)
    
    // Informations salariales
    const salary_info = parseSalaryInfo(offer.salaire)
    
    // Génération du fingerprint canonique
    const canonical_fingerprint = generateOfferFingerprint({
      title,
      company_name: company_name || 'Unknown',
      location_city: location_city || 'Unknown',
      contract_type,
    })
    
    const canonicalOffer: CanonicalOfferFT = {
      source_id: sourceId,
      source_offer_id: offer.id,
      title,
      description: offer.description?.trim() || title, // FT a des descriptions riches
      company_name,
      company_naf_code: offer.entreprise?.naf?.code?.trim(),
      location_city,
      location_postal_code,
      location_coordinates,
      contract_type,
      contract_nature: offer.natureContrat?.trim(),
      experience_required,
      salary_info,
      work_duration: offer.dureeTravailLibelle?.trim(),
      rome_code: offer.romeCode?.trim(),
      skills: skills && skills.length > 0 ? skills : undefined,
      languages: languages && languages.length > 0 ? languages : undefined,
      education: education && education.length > 0 ? education : undefined,
      external_url: offer.origineOffre?.urlOrigine?.trim(),
      canonical_fingerprint,
    }
    
    return canonicalOffer
    
  } catch (error) {
    console.error(`Failed to canonicalize FT offer:`, error)
    return null
  }
}

/**
 * Traite un lot d'offres FT brutes et les insère/met à jour dans la table offers
 */
export async function processBatchOffersFT(sourceId: string, limit = 100): Promise<{
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
    // Récupère les offres FT brutes non traitées
    const { data: rawOffers, error: fetchError } = await supabase
      .from('offers_raw')
      .select('id, source_id, source_offer_id, raw_data, fetched_at')
      .eq('source_id', sourceId)
      .is('processed_at', null)
      .order('fetched_at', { ascending: true })
      .limit(limit)
    
    if (fetchError) {
      throw new Error(`Failed to fetch FT raw offers: ${fetchError.message}`)
    }
    
    if (!rawOffers || rawOffers.length === 0) {
      return { processed: 0, inserted: 0, updated: 0, skipped: 0, errors: [] }
    }
    
    console.log(`Processing ${rawOffers.length} FT raw offers from ${sourceId}`)
    
    for (const rawOffer of rawOffers) {
      try {
        processed++
        
        // Canonicalise l'offre FT
        const canonicalOffer = await canonicalizeOfferFT(rawOffer.raw_data, sourceId)
        
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
          
          // Créer/récupérer la company
          let company_id: string | null = null
          if (canonicalOffer.company_name) {
            const { data: company, error: companyError } = await supabase
              .from('companies')
              .upsert({
                name: canonicalOffer.company_name,
                naf_code: canonicalOffer.company_naf_code,
              }, {
                onConflict: 'name',
                ignoreDuplicates: false,
              })
              .select('id')
              .single()
            
            if (companyError && companyError.code !== '23505') {
              errors.push(`Failed to upsert company: ${companyError.message}`)
              continue
            }
            
            company_id = company?.id || null
          }
          
          // Créer/récupérer la location avec données enrichies
          let location_id: string | null = null
          if (canonicalOffer.location_city) {
            const locationData: any = {
              city: canonicalOffer.location_city,
              country: 'FR',
            }
            
            if (canonicalOffer.location_postal_code) {
              locationData.postal_code = canonicalOffer.location_postal_code
            }
            
            if (canonicalOffer.location_coordinates) {
              locationData.coordinates = `POINT(${canonicalOffer.location_coordinates.lng} ${canonicalOffer.location_coordinates.lat})`
            }
            
            const { data: location, error: locationError } = await supabase
              .from('locations')
              .upsert(locationData, {
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
          
          // Prépare les données enrichies pour l'offre
          const offerData: any = {
            canonical_fingerprint: canonicalOffer.canonical_fingerprint,
            title: canonicalOffer.title,
            description: canonicalOffer.description,
            status: 'active',
            company_id,
            location_id,
            contract_type: canonicalOffer.contract_type !== 'UNKNOWN' ? canonicalOffer.contract_type : null,
            external_url: canonicalOffer.external_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          
          // Ajoute les données spécifiques FT
          const ft_metadata: any = {}
          
          if (canonicalOffer.contract_nature) {
            ft_metadata.contract_nature = canonicalOffer.contract_nature
          }
          
          if (canonicalOffer.experience_required && canonicalOffer.experience_required !== 'unknown') {
            ft_metadata.experience_required = canonicalOffer.experience_required
          }
          
          if (canonicalOffer.salary_info) {
            ft_metadata.salary_info = canonicalOffer.salary_info
          }
          
          if (canonicalOffer.work_duration) {
            ft_metadata.work_duration = canonicalOffer.work_duration
          }
          
          if (canonicalOffer.rome_code) {
            ft_metadata.rome_code = canonicalOffer.rome_code
          }
          
          if (canonicalOffer.skills) {
            ft_metadata.skills = canonicalOffer.skills
          }
          
          if (canonicalOffer.languages) {
            ft_metadata.languages = canonicalOffer.languages
          }
          
          if (canonicalOffer.education) {
            ft_metadata.education = canonicalOffer.education
          }
          
          if (Object.keys(ft_metadata).length > 0) {
            offerData.ft_metadata = ft_metadata
          }
          
          // Insérer l'offre canonique
          const { data: newOffer, error: offerError } = await supabase
            .from('offers')
            .insert(offerData)
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
        errors.push(`Error processing FT offer ${rawOffer.source_offer_id}: ${error}`)
        console.error(`Error processing FT offer ${rawOffer.source_offer_id}:`, error)
      }
    }
    
    console.log(`FT batch processing complete: ${processed} processed, ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${errors.length} errors`)
    
    return {
      processed,
      inserted,
      updated,
      skipped,
      errors,
    }
    
  } catch (error) {
    console.error('FT batch processing failed:', error)
    throw error
  }
}

/**
 * Traite toutes les offres FT brutes en attente
 */
export async function processAllPendingOffersFT(sourceId: string, batchSize = 50): Promise<{
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
  
  console.log(`Starting full FT canonicalization for source: ${sourceId}`)
  
  while (true) {
    const result = await processBatchOffersFT(sourceId, batchSize)
    
    if (result.processed === 0) {
      break // Aucune offre FT en attente
    }
    
    totalProcessed += result.processed
    totalInserted += result.inserted
    totalUpdated += result.updated
    totalSkipped += result.skipped
    totalErrors.push(...result.errors)
    
    console.log(`FT batch complete. Total so far: ${totalProcessed} processed, ${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} skipped`)
    
    // Petite pause pour éviter de surcharger la base
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log(`Full FT canonicalization complete: ${totalProcessed} processed, ${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} skipped, ${totalErrors.length} errors`)
  
  return {
    totalProcessed,
    totalInserted,
    totalUpdated,
    totalSkipped,
    totalErrors,
  }
}