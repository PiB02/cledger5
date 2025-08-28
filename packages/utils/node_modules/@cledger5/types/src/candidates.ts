import { z } from 'zod'
import { SeniorityLevelEnum, WorkModeEnum, ContractTypeEnum, SkillSchema, LanguageRequirementSchema } from './offers'

// CV document schema
export const CVDocumentSchema = z.object({
  id: z.string().uuid(),
  app_user_id: z.string().uuid(),
  file_name: z.string(),
  file_path: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  upload_at: z.string(),
  delete_after_date: z.string(), // RGPD: +6 months
  is_current: z.boolean().default(true)
})
export type CVDocument = z.infer<typeof CVDocumentSchema>

// CV parsing status
export const CVParseStatusEnum = z.enum(['pending', 'processing', 'ok', 'error'])
export type CVParseStatus = z.infer<typeof CVParseStatusEnum>

// Candidate profile schema
export const CandidateProfileSchema = z.object({
  app_user_id: z.string().uuid(),
  profile_title: z.string(),
  profile_summary: z.string().optional(),
  years_experience: z.number().min(0).optional(),
  seniority_level: SeniorityLevelEnum.optional(),
  location_id: z.string().uuid().optional(),
  work_mode_preference: WorkModeEnum.optional(),
  contract_type_preference: ContractTypeEnum.optional(),
  availability: z.enum(['immediately', 'within_month', 'within_3_months', 'later']).optional(),
  availability_date: z.string().optional(),
  salary_expectation_min: z.number().optional(),
  salary_expectation_max: z.number().optional(),
  is_public: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string()
})
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>

// CV skills
export const CVSkillSchema = z.object({
  app_user_id: z.string().uuid(),
  skill_name: z.string(),
  confidence: z.number().min(0).max(1),
  years_experience: z.number().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  source: z.enum(['extracted', 'manual']).default('extracted')
})
export type CVSkill = z.infer<typeof CVSkillSchema>

// CV languages
export const CVLanguageSchema = z.object({
  app_user_id: z.string().uuid(),
  language_code: z.string().length(2),
  cefr_level: z.number().min(1).max(6), // 1=A1, 6=C2
  confidence: z.number().min(0).max(1)
})
export type CVLanguage = z.infer<typeof CVLanguageSchema>

// CV degrees/education
export const CVDegreeSchema = z.object({
  app_user_id: z.string().uuid(),
  degree_name: z.string(),
  field_of_study: z.string().optional(),
  institution: z.string().optional(),
  eqf_level: z.number().min(1).max(8).optional(),
  start_year: z.number().optional(),
  end_year: z.number().optional(),
  is_completed: z.boolean().default(true)
})
export type CVDegree = z.infer<typeof CVDegreeSchema>

// CV experience
export const CVExperienceSchema = z.object({
  app_user_id: z.string().uuid(),
  job_title: z.string(),
  company_name: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_current: z.boolean().default(false),
  rome_codes: z.array(z.string()).optional(),
  skills_used: z.array(z.string()).optional()
})
export type CVExperience = z.infer<typeof CVExperienceSchema>

// CV enrichment from AI
export const CVEnrichmentSchema = z.object({
  app_user_id: z.string().uuid(),
  parse_status: CVParseStatusEnum,
  profile_title_canonical: z.string().optional(),
  rome_codes_extracted: z.array(z.string()).optional(),
  skills_extracted: z.array(SkillSchema).optional(),
  languages_extracted: z.array(LanguageRequirementSchema).optional(),
  seniority_detected: SeniorityLevelEnum.optional(),
  years_experience_detected: z.number().optional(),
  confidence_scores: z.record(z.number()).optional(),
  error_message: z.string().optional(),
  processed_at: z.string().optional()
})
export type CVEnrichment = z.infer<typeof CVEnrichmentSchema>

// CV embedding
export const CVEmbeddingSchema = z.object({
  app_user_id: z.string().uuid(),
  kind: z.enum(['semantic', 'skills']).default('semantic'),
  embedding: z.array(z.number()),
  text_used: z.string(),
  text_used_hash: z.string(),
  created_at: z.string()
})
export type CVEmbedding = z.infer<typeof CVEmbeddingSchema> 