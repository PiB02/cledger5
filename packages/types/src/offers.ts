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

// Offer enrichment from AI
export const OfferEnrichmentSchema = z.object({
  offer_id: z.string().uuid(),
  parse_status: z.enum(['pending', 'ok', 'error']),
  title_canonical: z.string().optional(),
  rome_codes_extracted: z.array(z.string()).optional(),
  skills_extracted: z.array(SkillSchema).optional(),
  languages_extracted: z.array(LanguageRequirementSchema).optional(),
  seniority_detected: SeniorityLevelEnum.optional(),
  degree_min_detected: z.number().min(1).max(8).optional(),
  confidence_scores: z.record(z.number()).optional(),
  error_message: z.string().optional(),
  processed_at: z.string().optional()
})
export type OfferEnrichment = z.infer<typeof OfferEnrichmentSchema>

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