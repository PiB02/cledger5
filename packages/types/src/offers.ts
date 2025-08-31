import { z } from 'zod'

// Contract types according to PRD
export const ContractTypeEnum = z.enum(['CDI', 'CDD', 'INTERIM', 'APP', 'PRO', 'STAGE'])
export type ContractType = z.infer<typeof ContractTypeEnum>

// Work modes
export const WorkModeEnum = z.enum(['onsite', 'remote', 'hybrid', 'unknown'])
export type WorkMode = z.infer<typeof WorkModeEnum>

// Seniority levels
export const SeniorityLevelEnum = z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager'])
export type SeniorityLevel = z.infer<typeof SeniorityLevelEnum>

// Offer status
export const OfferStatusEnum = z.enum(['active', 'expired', 'suspended'])
export type OfferStatus = z.infer<typeof OfferStatusEnum>

// Language CEFR levels
export const CEFRLevelEnum = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
export type CEFRLevel = z.infer<typeof CEFRLevelEnum>

// Offer source
export const OfferSourceEnum = z.enum(['lba', 'france_travail'])
export type OfferSource = z.infer<typeof OfferSourceEnum>

// Language requirement
export const LanguageRequirementSchema = z.object({
  code: z.string().length(2),
  level: CEFRLevelEnum,
  required: z.boolean().default(false)
})
export type LanguageRequirement = z.infer<typeof LanguageRequirementSchema>

// Skill
export const SkillSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(1),
  required: z.boolean(),
  years: z.number().optional()
})
export type Skill = z.infer<typeof SkillSchema>

// Base offer schema
export const OfferSchema = z.object({
  id: z.string().uuid(),
  canonical_fingerprint: z.string(),
  title: z.string(),
  description: z.string().optional(),
  company_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  status: OfferStatusEnum,
  alternance: z.boolean().default(false),
  contract_type_code: ContractTypeEnum.optional(),
  work_mode_code: WorkModeEnum.optional(),
  seniority_level: SeniorityLevelEnum.optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  salary_period: z.enum(['hour', 'day', 'month', 'year']).optional(),
  rome_codes: z.array(z.string()).default([]),
  naf_code: z.string().optional(),
  skills_required: z.array(SkillSchema).default([]),
  skills_preferred: z.array(SkillSchema).default([]),
  languages: z.array(LanguageRequirementSchema).default([]),
  degree_min_eqf: z.number().min(1).max(8).optional(),
  contract_start_date: z.string().optional(),
  expiration_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})
export type Offer = z.infer<typeof OfferSchema>

// AI Enrichment Confidence Score
export const ConfidenceScoreSchema = z.object({
  skills: z.number().min(0).max(1),
  seniority: z.number().min(0).max(1),
  languages: z.number().min(0).max(1),
  degrees: z.number().min(0).max(1),
  global: z.number().min(0).max(1)
})
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>

// Skills categories for better classification
export const SkillCategoryEnum = z.enum(['technical', 'business', 'soft', 'language', 'certification'])
export type SkillCategory = z.infer<typeof SkillCategoryEnum>

// Enhanced skill schema with category and confidence
export const EnrichedSkillSchema = z.object({
  name: z.string().min(1),
  normalized_name: z.string().min(1), // lowercase, no accents
  category: SkillCategoryEnum,
  confidence: z.number().min(0).max(1),
  required: z.boolean().default(false),
  years_required: z.number().optional(),
  source: z.enum(['extracted', 'existing', 'inferred']).default('extracted')
})
export type EnrichedSkill = z.infer<typeof EnrichedSkillSchema>

// Enhanced language with confidence scoring
export const EnrichedLanguageSchema = z.object({
  code: z.string().length(2), // ISO 639-1 (fr, en, de, etc.)
  name: z.string(), // français, english, deutsch
  level: CEFRLevelEnum,
  confidence: z.number().min(0).max(1),
  required: z.boolean().default(false),
  context: z.enum(['professional', 'client', 'technical', 'general']).optional()
})
export type EnrichedLanguage = z.infer<typeof EnrichedLanguageSchema>

// Degree classification with EQF mapping
export const DegreeClassificationSchema = z.object({
  level_eqf: z.number().min(1).max(8), // European Qualifications Framework
  degree_type: z.string().optional(), // "Master", "Licence", "BTS", etc.
  field_of_study: z.string().optional(), // "Informatique", "Commerce", etc.
  confidence: z.number().min(0).max(1),
  source_text: z.string().optional() // original text matched
})
export type DegreeClassification = z.infer<typeof DegreeClassificationSchema>

// Offer enrichment from AI - Updated schema
export const OfferEnrichmentSchema = z.object({
  id: z.string().uuid().optional(), // Primary key
  offer_id: z.string().uuid(),
  
  // Processing status and metadata
  enrichment_status: z.enum(['pending', 'processing', 'completed', 'failed', 'low_confidence']).default('pending'),
  enrichment_version: z.string().default('1.0'), // For schema evolution
  model_used: z.string().default('gpt-4o-mini'), // AI model version
  
  // Core AI extractions
  skills_required: z.array(EnrichedSkillSchema).default([]),
  skills_preferred: z.array(EnrichedSkillSchema).default([]),
  seniority_level: SeniorityLevelEnum.optional(),
  languages_detected: z.array(EnrichedLanguageSchema).default([]),
  degree_requirements: z.array(DegreeClassificationSchema).default([]),
  
  // Confidence scoring (≥0.80 required for validation)
  confidence_scores: ConfidenceScoreSchema.optional(),
  
  // Additional context and metadata
  rome_codes_suggested: z.array(z.string()).default([]), // AI-suggested ROME codes
  job_category_detected: z.string().optional(), // Broad category detection
  company_size_indicators: z.array(z.string()).default([]), // "startup", "multinational", etc.
  
  // Processing info and error handling
  tokens_used: z.number().optional(), // For cost tracking
  processing_time_ms: z.number().optional(), // Performance monitoring
  error_message: z.string().optional(),
  retry_count: z.number().default(0),
  
  // Timestamps
  created_at: z.string().optional(),
  processed_at: z.string().optional(),
  updated_at: z.string().optional()
})
export type OfferEnrichment = z.infer<typeof OfferEnrichmentSchema>

// Note: EnrichmentRequest and EnrichmentResponse schemas are defined in api.ts to avoid duplication

// Offer embedding
export const OfferEmbeddingSchema = z.object({
  offer_id: z.string().uuid(),
  kind: z.enum(['semantic', 'skills']).default('semantic'),
  embedding: z.array(z.number()),
  text_used: z.string(),
  text_used_hash: z.string(),
  created_at: z.string()
})
export type OfferEmbedding = z.infer<typeof OfferEmbeddingSchema> 