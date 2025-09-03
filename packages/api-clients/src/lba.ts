import { z } from 'zod'

// Schema for LBA offer - ULTRA flexible to handle API inconsistencies
// API can return null, undefined, or missing fields for almost everything
// Only id and title are guaranteed to exist
export const LBAOfferSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  
  // Company - completely optional structure
  company: z.object({
    name: z.string().nullable().optional(), // Can be undefined!
    siret: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }).optional(),
  
  // Place - city can be null!
  place: z.object({
    city: z.string().nullable().optional(), // Can be null!
    postalCode: z.string().nullable().optional(),
    zipCode: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    inseeCode: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    distance: z.number().nullable().optional(),
    fullAddress: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
  }).optional(),
  
  // Contract
  contract: z.object({
    type: z.string().nullable().optional(), // Not always present
    duration: z.number().nullable().optional(),
    workMode: z.string().nullable().optional(),
  }).optional(),
  
  // Job object
  job: z.object({
    id: z.string().nullable().optional(),
    contractType: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    creationDate: z.string().nullable().optional(),
    jobStartDate: z.string().nullable().optional(),
    jobExpirationDate: z.string().nullable().optional(),
    romeDetails: z.any().optional(),
  }).optional(),
  
  // Salary
  salary: z.object({
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
    period: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }).optional(),
  
  // Arrays - can be null!
  rome_codes: z.array(z.string()).nullable().optional(),
  naf_code: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  nafs: z.array(z.any()).nullable().optional(), // Can be null!
  
  // Other optional fields
  degree_min: z.string().nullable().optional(),
  experience_min: z.number().nullable().optional(),
  languages: z.array(z.object({
    language: z.string(),
    level: z.string().nullable().optional(),
  })).nullable().optional(),
  
  // Apply options
  apply_url: z.string().url().nullable().optional(),
  apply_phone: z.string().nullable().optional(),
  apply_email: z.string().email().nullable().optional(),
  
  // Dates
  published_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  
  // Matcha-specific fields
  ideaType: z.string().nullable().optional(),
  contact: z.any().optional(),
  target_diploma_level: z.string().nullable().optional(),
  rythmeAlternance: z.any().nullable().optional(),
  elligibleHandicap: z.boolean().nullable().optional(),
  dureeContrat: z.string().nullable().optional(),
  quantiteContrat: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  type: z.array(z.string()).nullable().optional(),
  recipient_id: z.string().nullable().optional(),
  
  // LBA Company specific
  url: z.string().nullable().optional(),
  applicationCount: z.number().nullable().optional(),
  token: z.string().nullable().optional(),
})

export type LBAOffer = z.infer<typeof LBAOfferSchema>

// Response schema selon la structure réelle de l'API (27/12/2024)
const LBAResponseSchema = z.object({
  // L'API retourne des objets avec une propriété 'results' qui contient les arrays
  peJobs: z.object({
    results: z.array(LBAOfferSchema)
  }).nullable().optional(),  // Offres Pôle Emploi
  
  partnerJobs: z.object({
    results: z.array(LBAOfferSchema)
  }).nullable().optional(),  // Offres partenaires
  
  matchas: z.object({
    results: z.array(LBAOfferSchema)
  }).nullable().optional(),  // Offres matchées
  
  lbaCompanies: z.object({
    results: z.array(z.any())
  }).nullable().optional(),  // Entreprises LBA
  
  lbbCompanies: z.object({
    results: z.array(z.any())
  }).nullable().optional(),  // Entreprises La Bonne Boîte
})

export type LBAResponse = z.infer<typeof LBAResponseSchema>

export interface LBAClientConfig {
  apiKey: string
  baseUrl?: string
  maxRetries?: number
  retryDelay?: number
}

export interface LBASearchParams {
  from?: string // Date début
  to?: string // Date fin
  page?: number
  per_page?: number
  rome?: string[] // DEPRECATED: utiliser romeCodes
  romeCodes?: string[] // Codes ROME multiples
  department?: string[]
  departments?: string[] // Alias pour department
  city?: string[]
  contract_type?: string[]
  company_size?: string[]
}

export class LBAClient {
  private apiKey: string
  private baseUrl: string
  private maxRetries: number
  private retryDelay: number

  constructor(config: LBAClientConfig) {
    this.apiKey = config.apiKey
    // URL correcte selon les tests effectués le 27/12/2024
    // L'API est hébergée sur labonnealternance.apprentissage.beta.gouv.fr, pas api.apprentissage.beta.gouv.fr
    this.baseUrl = config.baseUrl || 'https://labonnealternance.apprentissage.beta.gouv.fr/api/V1'
    this.maxRetries = config.maxRetries || 3
    this.retryDelay = config.retryDelay || 2000
  }

  private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        })

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * (attempt + 1)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        // Handle server errors with retry
        if (response.status >= 500 && attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
          continue
        }

        return response
      } catch (error) {
        lastError = error as Error
        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  async searchOffers(params: LBASearchParams = {}) {
    // Endpoint correct : /jobs
    const url = new URL(`${this.baseUrl}/jobs`)
    
    // Paramètre requis : caller
    url.searchParams.set('caller', 'cledger5')
    
    // Paramètres requis avec valeurs par défaut si non fournis
    // ROME par défaut : M1805 (Études et développement informatique)
    const romeArray = params.romeCodes || params.rome || ['M1805']
    const romeCodes = romeArray.join(',')
    url.searchParams.set('romes', romeCodes)
    
    // INSEE par défaut : Paris (75056) si pas de département/ville fourni
    const departments = params.departments || params.department
    if (departments?.length && departments[0]) {
      // Mapper département vers INSEE (pour l'instant on prend la préfecture)
      const deptToInsee: Record<string, string> = {
        '75': '75056', // Paris
        '13': '13055', // Marseille
        '69': '69123', // Lyon
        '31': '31555', // Toulouse
        '06': '06088', // Nice
        '44': '44109', // Nantes
        '67': '67482', // Strasbourg
        '34': '34172', // Montpellier
        '33': '33063', // Bordeaux
        '59': '59350', // Lille
      }
      const insee = deptToInsee[departments[0]] || '75056' // Paris par défaut
      url.searchParams.set('insee', insee)
    } else if (params.city?.length && params.city[0]) {
      // Si on a une ville, essayer de mapper vers INSEE
      // TODO: Ajouter un vrai mapping ville -> INSEE
      url.searchParams.set('insee', '75056') // Paris par défaut
    } else {
      // Pas de localisation fournie, utiliser Paris par défaut
      url.searchParams.set('insee', '75056')
    }
    
    // Add search parameters optionnels
    if (params.from) url.searchParams.set('from', params.from)
    if (params.to) url.searchParams.set('to', params.to)
    if (params.page) url.searchParams.set('page', params.page.toString())
    if (params.per_page) url.searchParams.set('per_page', params.per_page.toString())
    
    // Autres paramètres optionnels
    if (params.contract_type?.length) url.searchParams.set('contract_type', params.contract_type.join(','))
    if (params.company_size?.length) url.searchParams.set('company_size', params.company_size.join(','))

    console.log('LBA API URL:', url.toString()) // Pour debug
    
    const response = await this.fetchWithRetry(url.toString(), { method: 'GET' })
    
    if (!response.ok) {
      // Essayer de récupérer le body de l'erreur pour plus de détails
      let errorDetails = ''
      try {
        const errorBody = await response.text()
        console.error('LBA API Error Response:', errorBody)
        
        // Essayer de parser en JSON si possible
        try {
          const errorJson = JSON.parse(errorBody)
          if (errorJson.error) errorDetails = ` - ${errorJson.error}`
          if (errorJson.error_messages) errorDetails += ` - ${errorJson.error_messages.join(', ')}`
          if (errorJson.message) errorDetails = ` - ${errorJson.message}`
        } catch {
          // Si ce n'est pas du JSON, utiliser le texte brut
          if (errorBody && errorBody.length < 500) {
            errorDetails = ` - ${errorBody}`
          }
        }
      } catch (e) {
        console.error('Could not read error response body:', e)
      }
      
      throw new Error(`LBA API error: ${response.status} ${response.statusText}${errorDetails}`)
    }

    const data = await response.json()
    return LBAResponseSchema.parse(data)
  }

  async getOffer(id: string) {
    const url = `${this.baseUrl}/jobs/${id}`
    const response = await this.fetchWithRetry(url, { method: 'GET' })
    
    if (!response.ok) {
      throw new Error(`LBA API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return LBAOfferSchema.parse(data)
  }

  // Fetch all offers with pagination
  async *fetchAllOffers(params: LBASearchParams = {}) {
    let page = 1
    let hasMore = true
    const perPage = params.per_page || 500

    while (hasMore) {
      const response = await this.searchOffers({
        ...params,
        page,
        per_page: perPage,
      })

      // Combiner tous les types d'offres
      const allOffers = [
        ...(response.peJobs?.results || []),
        ...(response.partnerJobs?.results || []),
        ...(response.matchas?.results || []),
        ...(response.lbaCompanies?.results || []),
        ...(response.lbbCompanies?.results || []),
      ]

      yield allOffers

      hasMore = allOffers.length === perPage
      page++

      // Small delay between pages to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  // Map LBA offer to canonical format
  mapToCanonical(lbaOffer: LBAOffer): any {
    return {
      external_id: lbaOffer.id,
      title: lbaOffer.title,
      description: lbaOffer.description || lbaOffer.job?.description || '',
      
      // Company mapping - handle missing name
      company: lbaOffer.company?.name ? {
        name: lbaOffer.company.name,
        siret: lbaOffer.company.siret,
        size_range: lbaOffer.company.size,
      } : undefined,
      
      // Location mapping - handle missing city
      location: (lbaOffer.place?.city) ? {
        city: lbaOffer.place.city,
        postal_code: lbaOffer.place?.postalCode || lbaOffer.place?.zipCode,
        department_code: lbaOffer.place?.department,
        region_code: lbaOffer.place?.region,
        insee_code: lbaOffer.place?.inseeCode,
        latitude: lbaOffer.place?.latitude,
        longitude: lbaOffer.place?.longitude,
      } : undefined,
      
      // Contract mapping - handle both contract and job.contractType
      contract_types: lbaOffer.contract?.type 
        ? [this.mapContractType(lbaOffer.contract!.type)]
        : (lbaOffer.job?.contractType ? [this.mapContractType(lbaOffer.job.contractType)] : []),
      work_modes: lbaOffer.contract?.workMode ? [this.mapWorkMode(lbaOffer.contract!.workMode)] : [],
      contract_duration_months: lbaOffer.contract?.duration || (lbaOffer.dureeContrat ? parseInt(lbaOffer.dureeContrat) : undefined),
      
      // Salary mapping
      salary_min: lbaOffer.salary?.min,
      salary_max: lbaOffer.salary?.max,
      salary_period: lbaOffer.salary?.period,
      
      // Skills and requirements
      rome_codes: lbaOffer.rome_codes || (lbaOffer.job?.romeDetails ? [lbaOffer.job.romeDetails.rome?.code_rome].filter(Boolean) : []),
      naf_code: lbaOffer.naf_code,
      required_skills: lbaOffer.skills,
      education_level: lbaOffer.degree_min || lbaOffer.target_diploma_level,
      
      // Application
      application_url: lbaOffer.apply_url || lbaOffer.url,
      application_phone: lbaOffer.apply_phone,
      application_email: lbaOffer.apply_email,
      
      // Dates - handle different date fields
      published_at: lbaOffer.published_at || lbaOffer.job?.creationDate,
      updated_at: lbaOffer.updated_at || lbaOffer.job?.creationDate,
      expires_at: lbaOffer.expires_at || lbaOffer.job?.jobExpirationDate,
      
      // Alternance specific - check multiple sources
      alternance: lbaOffer.contract?.type 
        ? ['Apprentissage', 'Professionnalisation', 'Alternance'].includes(lbaOffer.contract!.type)
        : (lbaOffer.job?.contractType === 'Apprentissage' || lbaOffer.type?.includes('Apprentissage')),
      
      // Raw data for reference
      raw_data: lbaOffer,
    }
  }

  private mapContractType(lbaType: string): string {
    const mapping: Record<string, string> = {
      'Apprentissage': 'Apprentissage',
      'Professionnalisation': 'Professionnalisation',
      'Alternance': 'Alternance',
      'CDI': 'CDI',
      'CDD': 'CDD',
      'Stage': 'Stage',
    }
    return mapping[lbaType] || lbaType
  }

  private mapWorkMode(lbaMode: string): string {
    const mapping: Record<string, string> = {
      'presentiel': 'OnSite',
      'teletravail': 'Remote',
      'hybride': 'Hybrid',
      'sur site': 'OnSite',
      'a distance': 'Remote',
    }
    return mapping[lbaMode.toLowerCase()] || 'OnSite'
  }
} 