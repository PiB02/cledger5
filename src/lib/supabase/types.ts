// Types de base pour cledger5
// Ces types seront enrichis au fur et à mesure du développement
// Pour les types complets générés, utiliser: npx supabase gen types typescript

export type AppRole = 'candidate' | 'recruiter' | 'admin'

export type ContractType = 'CDI' | 'CDD' | 'INTERIM' | 'APP' | 'PRO' | 'STAGE'
export type WorkMode = 'onsite' | 'remote' | 'hybrid'
export type SeniorityLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager'
export type OfferStatus = 'active' | 'expired' | 'suspended'

export interface Offer {
  id: string
  canonical_fingerprint: string
  title: string
  description?: string
  status: OfferStatus
  created_at?: string
  expiration_at?: string
  updated_at: string
  alternance: boolean
  contract_type?: string
  work_mode?: string
  contract_type_code?: ContractType
  work_mode_code?: WorkMode
  career_level?: SeniorityLevel
  rome_codes?: string[]
  company_id?: string
  location_id?: string
  source_primary: 'LBA' | 'FT'
  recruiter_id?: string
  salary_min?: number
  salary_max?: number
  salary_currency: string
  salary_period?: string
}

export interface CVProfile {
  id: string
  user_id: string
  document_id?: string
  location_id?: string
  mobility_km?: number
  work_mode_pref?: WorkMode
  seniority_years?: number
  career_level?: SeniorityLevel
  profile_title?: string
  profile_summary?: string
  profile_tags?: string[]
  is_searchable: boolean
  created_at: string
  last_updated: string
}

export interface Company {
  id: string
  siret?: string
  name: string
  brand?: string
  legal_name?: string
  website?: string
  size_range?: string
  naf_code?: string
}

export interface Location {
  id: string
  address1?: string
  address2?: string
  postal_code?: string
  city?: string
  insee_code?: string
  country_code: string
  department_code?: string
  region_code?: string
} 