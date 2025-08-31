"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AdminBatchEnrichmentRequestSchema: () => AdminBatchEnrichmentRequestSchema,
  AdminEnrichmentStatsSchema: () => AdminEnrichmentStatsSchema,
  AppRoleEnum: () => AppRoleEnum,
  AppUserSchema: () => AppUserSchema,
  BatchCreateRequestSchema: () => BatchCreateRequestSchema,
  BatchSchema: () => BatchSchema,
  BatchStatusEnum: () => BatchStatusEnum,
  CEFRLevelEnum: () => CEFRLevelEnum,
  CVDegreeSchema: () => CVDegreeSchema,
  CVDocumentSchema: () => CVDocumentSchema,
  CVEmbeddingSchema: () => CVEmbeddingSchema,
  CVEnrichmentSchema: () => CVEnrichmentSchema,
  CVExperienceSchema: () => CVExperienceSchema,
  CVLanguageSchema: () => CVLanguageSchema,
  CVParseStatusEnum: () => CVParseStatusEnum,
  CVSkillSchema: () => CVSkillSchema,
  CVUploadRequestSchema: () => CVUploadRequestSchema,
  CandidateProfileSchema: () => CandidateProfileSchema,
  CompanySchema: () => CompanySchema,
  ConfidenceScoreSchema: () => ConfidenceScoreSchema,
  ConfidenceScoresSchema: () => ConfidenceScoresSchema,
  ContractTypeEnum: () => ContractTypeEnum,
  DegreeClassificationSchema: () => DegreeClassificationSchema,
  DegreeRequirementSchema: () => DegreeRequirementSchema,
  EnrichedLanguageSchema: () => EnrichedLanguageSchema,
  EnrichedSkillSchema: () => EnrichedSkillSchema,
  EnrichmentHistoryItemSchema: () => EnrichmentHistoryItemSchema,
  EnrichmentHistoryResponseSchema: () => EnrichmentHistoryResponseSchema,
  EnrichmentRequestSchema: () => EnrichmentRequestSchema,
  EnrichmentResponseSchema: () => EnrichmentResponseSchema,
  ErrorResponseSchema: () => ErrorResponseSchema,
  IngestOffersRequestSchema: () => IngestOffersRequestSchema,
  LanguageDetectionSchema: () => LanguageDetectionSchema,
  LanguageRequirementSchema: () => LanguageRequirementSchema,
  LocationSchema: () => LocationSchema,
  LoginSchema: () => LoginSchema,
  MatchRequestSchema: () => MatchRequestSchema,
  MatchResultSchema: () => MatchResultSchema,
  OfferEmbeddingSchema: () => OfferEmbeddingSchema,
  OfferEnrichmentSchema: () => OfferEnrichmentSchema,
  OfferSchema: () => OfferSchema,
  OfferSourceEnum: () => OfferSourceEnum,
  OfferStatusEnum: () => OfferStatusEnum,
  PaginationSchema: () => PaginationSchema,
  PasswordResetRequestSchema: () => PasswordResetRequestSchema,
  PasswordResetSchema: () => PasswordResetSchema,
  RegistrationSchema: () => RegistrationSchema,
  SSEEventSchema: () => SSEEventSchema,
  SSEEventTypeEnum: () => SSEEventTypeEnum,
  SearchOffersRequestSchema: () => SearchOffersRequestSchema,
  SeniorityLevelEnum: () => SeniorityLevelEnum,
  SessionSchema: () => SessionSchema,
  SkillCategoryEnum: () => SkillCategoryEnum,
  SkillExtractionSchema: () => SkillExtractionSchema,
  SkillSchema: () => SkillSchema,
  SortOrderEnum: () => SortOrderEnum,
  SuccessResponseSchema: () => SuccessResponseSchema,
  WorkModeEnum: () => WorkModeEnum
});
module.exports = __toCommonJS(index_exports);

// src/offers.ts
var import_zod = require("zod");
var ContractTypeEnum = import_zod.z.enum(["CDI", "CDD", "INTERIM", "APP", "PRO", "STAGE"]);
var WorkModeEnum = import_zod.z.enum(["onsite", "remote", "hybrid", "unknown"]);
var SeniorityLevelEnum = import_zod.z.enum(["intern", "junior", "mid", "senior", "lead", "manager"]);
var OfferStatusEnum = import_zod.z.enum(["active", "expired", "suspended"]);
var CEFRLevelEnum = import_zod.z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
var OfferSourceEnum = import_zod.z.enum(["lba", "france_travail"]);
var LanguageRequirementSchema = import_zod.z.object({
  code: import_zod.z.string().length(2),
  level: CEFRLevelEnum,
  required: import_zod.z.boolean().default(false)
});
var SkillSchema = import_zod.z.object({
  name: import_zod.z.string(),
  confidence: import_zod.z.number().min(0).max(1),
  required: import_zod.z.boolean(),
  years: import_zod.z.number().optional()
});
var OfferSchema = import_zod.z.object({
  id: import_zod.z.string().uuid(),
  canonical_fingerprint: import_zod.z.string(),
  title: import_zod.z.string(),
  description: import_zod.z.string().optional(),
  company_id: import_zod.z.string().uuid().optional(),
  location_id: import_zod.z.string().uuid().optional(),
  status: OfferStatusEnum,
  alternance: import_zod.z.boolean().default(false),
  contract_type_code: ContractTypeEnum.optional(),
  work_mode_code: WorkModeEnum.optional(),
  seniority_level: SeniorityLevelEnum.optional(),
  salary_min: import_zod.z.number().optional(),
  salary_max: import_zod.z.number().optional(),
  salary_period: import_zod.z.enum(["hour", "day", "month", "year"]).optional(),
  rome_codes: import_zod.z.array(import_zod.z.string()).default([]),
  naf_code: import_zod.z.string().optional(),
  skills_required: import_zod.z.array(SkillSchema).default([]),
  skills_preferred: import_zod.z.array(SkillSchema).default([]),
  languages: import_zod.z.array(LanguageRequirementSchema).default([]),
  degree_min_eqf: import_zod.z.number().min(1).max(8).optional(),
  contract_start_date: import_zod.z.string().optional(),
  expiration_at: import_zod.z.string().optional(),
  created_at: import_zod.z.string(),
  updated_at: import_zod.z.string()
});
var ConfidenceScoreSchema = import_zod.z.object({
  skills: import_zod.z.number().min(0).max(1),
  seniority: import_zod.z.number().min(0).max(1),
  languages: import_zod.z.number().min(0).max(1),
  degrees: import_zod.z.number().min(0).max(1),
  global: import_zod.z.number().min(0).max(1)
});
var SkillCategoryEnum = import_zod.z.enum(["technical", "business", "soft", "language", "certification"]);
var EnrichedSkillSchema = import_zod.z.object({
  name: import_zod.z.string().min(1),
  normalized_name: import_zod.z.string().min(1),
  // lowercase, no accents
  category: SkillCategoryEnum,
  confidence: import_zod.z.number().min(0).max(1),
  required: import_zod.z.boolean().default(false),
  years_required: import_zod.z.number().optional(),
  source: import_zod.z.enum(["extracted", "existing", "inferred"]).default("extracted")
});
var EnrichedLanguageSchema = import_zod.z.object({
  code: import_zod.z.string().length(2),
  // ISO 639-1 (fr, en, de, etc.)
  name: import_zod.z.string(),
  // français, english, deutsch
  level: CEFRLevelEnum,
  confidence: import_zod.z.number().min(0).max(1),
  required: import_zod.z.boolean().default(false),
  context: import_zod.z.enum(["professional", "client", "technical", "general"]).optional()
});
var DegreeClassificationSchema = import_zod.z.object({
  level_eqf: import_zod.z.number().min(1).max(8),
  // European Qualifications Framework
  degree_type: import_zod.z.string().optional(),
  // "Master", "Licence", "BTS", etc.
  field_of_study: import_zod.z.string().optional(),
  // "Informatique", "Commerce", etc.
  confidence: import_zod.z.number().min(0).max(1),
  source_text: import_zod.z.string().optional()
  // original text matched
});
var OfferEnrichmentSchema = import_zod.z.object({
  id: import_zod.z.string().uuid().optional(),
  // Primary key
  offer_id: import_zod.z.string().uuid(),
  // Processing status and metadata
  enrichment_status: import_zod.z.enum(["pending", "processing", "completed", "failed", "low_confidence"]).default("pending"),
  enrichment_version: import_zod.z.string().default("1.0"),
  // For schema evolution
  model_used: import_zod.z.string().default("gpt-4o-mini"),
  // AI model version
  // Core AI extractions
  skills_required: import_zod.z.array(EnrichedSkillSchema).default([]),
  skills_preferred: import_zod.z.array(EnrichedSkillSchema).default([]),
  seniority_level: SeniorityLevelEnum.optional(),
  languages_detected: import_zod.z.array(EnrichedLanguageSchema).default([]),
  degree_requirements: import_zod.z.array(DegreeClassificationSchema).default([]),
  // Confidence scoring (≥0.80 required for validation)
  confidence_scores: ConfidenceScoreSchema.optional(),
  // Additional context and metadata
  rome_codes_suggested: import_zod.z.array(import_zod.z.string()).default([]),
  // AI-suggested ROME codes
  job_category_detected: import_zod.z.string().optional(),
  // Broad category detection
  company_size_indicators: import_zod.z.array(import_zod.z.string()).default([]),
  // "startup", "multinational", etc.
  // Processing info and error handling
  tokens_used: import_zod.z.number().optional(),
  // For cost tracking
  processing_time_ms: import_zod.z.number().optional(),
  // Performance monitoring
  error_message: import_zod.z.string().optional(),
  retry_count: import_zod.z.number().default(0),
  // Timestamps
  created_at: import_zod.z.string().optional(),
  processed_at: import_zod.z.string().optional(),
  updated_at: import_zod.z.string().optional()
});
var OfferEmbeddingSchema = import_zod.z.object({
  offer_id: import_zod.z.string().uuid(),
  kind: import_zod.z.enum(["semantic", "skills"]).default("semantic"),
  embedding: import_zod.z.array(import_zod.z.number()),
  text_used: import_zod.z.string(),
  text_used_hash: import_zod.z.string(),
  created_at: import_zod.z.string()
});

// src/candidates.ts
var import_zod2 = require("zod");
var CVDocumentSchema = import_zod2.z.object({
  id: import_zod2.z.string().uuid(),
  app_user_id: import_zod2.z.string().uuid(),
  file_name: import_zod2.z.string(),
  file_path: import_zod2.z.string(),
  file_size: import_zod2.z.number(),
  mime_type: import_zod2.z.string(),
  upload_at: import_zod2.z.string(),
  delete_after_date: import_zod2.z.string(),
  // RGPD: +6 months
  is_current: import_zod2.z.boolean().default(true)
});
var CVParseStatusEnum = import_zod2.z.enum(["pending", "processing", "ok", "error"]);
var CandidateProfileSchema = import_zod2.z.object({
  app_user_id: import_zod2.z.string().uuid(),
  profile_title: import_zod2.z.string(),
  profile_summary: import_zod2.z.string().optional(),
  years_experience: import_zod2.z.number().min(0).optional(),
  seniority_level: SeniorityLevelEnum.optional(),
  location_id: import_zod2.z.string().uuid().optional(),
  work_mode_preference: WorkModeEnum.optional(),
  contract_type_preference: ContractTypeEnum.optional(),
  availability: import_zod2.z.enum(["immediately", "within_month", "within_3_months", "later"]).optional(),
  availability_date: import_zod2.z.string().optional(),
  salary_expectation_min: import_zod2.z.number().optional(),
  salary_expectation_max: import_zod2.z.number().optional(),
  is_public: import_zod2.z.boolean().default(false),
  created_at: import_zod2.z.string(),
  updated_at: import_zod2.z.string()
});
var CVSkillSchema = import_zod2.z.object({
  app_user_id: import_zod2.z.string().uuid(),
  skill_name: import_zod2.z.string(),
  confidence: import_zod2.z.number().min(0).max(1),
  years_experience: import_zod2.z.number().optional(),
  level: import_zod2.z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  source: import_zod2.z.enum(["extracted", "manual"]).default("extracted")
});
var CVLanguageSchema = import_zod2.z.object({
  app_user_id: import_zod2.z.string().uuid(),
  language_code: import_zod2.z.string().length(2),
  cefr_level: import_zod2.z.number().min(1).max(6),
  // 1=A1, 6=C2
  confidence: import_zod2.z.number().min(0).max(1)
});
var CVDegreeSchema = import_zod2.z.object({
  app_user_id: import_zod2.z.string().uuid(),
  degree_name: import_zod2.z.string(),
  field_of_study: import_zod2.z.string().optional(),
  institution: import_zod2.z.string().optional(),
  eqf_level: import_zod2.z.number().min(1).max(8).optional(),
  start_year: import_zod2.z.number().optional(),
  end_year: import_zod2.z.number().optional(),
  is_completed: import_zod2.z.boolean().default(true)
});
var CVExperienceSchema = import_zod2.z.object({
  app_user_id: import_zod2.z.string().uuid(),
  job_title: import_zod2.z.string(),
  company_name: import_zod2.z.string().optional(),
  description: import_zod2.z.string().optional(),
  start_date: import_zod2.z.string().optional(),
  end_date: import_zod2.z.string().optional(),
  is_current: import_zod2.z.boolean().default(false),
  rome_codes: import_zod2.z.array(import_zod2.z.string()).optional(),
  skills_used: import_zod2.z.array(import_zod2.z.string()).optional()
});
var CVEnrichmentSchema = import_zod2.z.object({
  app_user_id: import_zod2.z.string().uuid(),
  parse_status: CVParseStatusEnum,
  profile_title_canonical: import_zod2.z.string().optional(),
  rome_codes_extracted: import_zod2.z.array(import_zod2.z.string()).optional(),
  skills_extracted: import_zod2.z.array(SkillSchema).optional(),
  languages_extracted: import_zod2.z.array(LanguageRequirementSchema).optional(),
  seniority_detected: SeniorityLevelEnum.optional(),
  years_experience_detected: import_zod2.z.number().optional(),
  confidence_scores: import_zod2.z.record(import_zod2.z.number()).optional(),
  error_message: import_zod2.z.string().optional(),
  processed_at: import_zod2.z.string().optional()
});
var CVEmbeddingSchema = import_zod2.z.object({
  app_user_id: import_zod2.z.string().uuid(),
  kind: import_zod2.z.enum(["semantic", "skills"]).default("semantic"),
  embedding: import_zod2.z.array(import_zod2.z.number()),
  text_used: import_zod2.z.string(),
  text_used_hash: import_zod2.z.string(),
  created_at: import_zod2.z.string()
});

// src/auth.ts
var import_zod3 = require("zod");
var AppRoleEnum = import_zod3.z.enum(["candidate", "recruiter", "admin"]);
var AppUserSchema = import_zod3.z.object({
  id: import_zod3.z.string().uuid(),
  email: import_zod3.z.string().email(),
  role: AppRoleEnum,
  email_verified_at: import_zod3.z.string().optional(),
  is_active: import_zod3.z.boolean().default(true),
  first_name: import_zod3.z.string().optional(),
  last_name: import_zod3.z.string().optional(),
  phone: import_zod3.z.string().optional(),
  created_at: import_zod3.z.string(),
  updated_at: import_zod3.z.string()
});
var LoginSchema = import_zod3.z.object({
  email: import_zod3.z.string().email(),
  password: import_zod3.z.string().min(8)
});
var RegistrationSchema = import_zod3.z.object({
  email: import_zod3.z.string().email(),
  password: import_zod3.z.string().min(8).regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule").regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre").regex(/[!@#$%^&*()]/, "Le mot de passe doit contenir au moins un caract\xE8re sp\xE9cial"),
  role: AppRoleEnum.default("candidate"),
  first_name: import_zod3.z.string().optional(),
  last_name: import_zod3.z.string().optional()
});
var PasswordResetRequestSchema = import_zod3.z.object({
  email: import_zod3.z.string().email()
});
var PasswordResetSchema = import_zod3.z.object({
  token: import_zod3.z.string(),
  password: import_zod3.z.string().min(8).regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule").regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre").regex(/[!@#$%^&*()]/, "Le mot de passe doit contenir au moins un caract\xE8re sp\xE9cial")
});
var SessionSchema = import_zod3.z.object({
  user: AppUserSchema,
  access_token: import_zod3.z.string(),
  refresh_token: import_zod3.z.string().optional(),
  expires_at: import_zod3.z.string()
});

// src/common.ts
var import_zod4 = require("zod");
var PaginationSchema = import_zod4.z.object({
  page: import_zod4.z.number().min(1).default(1),
  limit: import_zod4.z.number().min(1).max(100).default(20),
  total: import_zod4.z.number().optional(),
  totalPages: import_zod4.z.number().optional()
});
var SortOrderEnum = import_zod4.z.enum(["asc", "desc"]);
var LocationSchema = import_zod4.z.object({
  id: import_zod4.z.string().uuid(),
  city: import_zod4.z.string(),
  postal_code: import_zod4.z.string().optional(),
  department_code: import_zod4.z.string().optional(),
  department_name: import_zod4.z.string().optional(),
  region_code: import_zod4.z.string().optional(),
  region_name: import_zod4.z.string().optional(),
  country_code: import_zod4.z.string().default("FR"),
  latitude: import_zod4.z.number().optional(),
  longitude: import_zod4.z.number().optional()
});
var CompanySchema = import_zod4.z.object({
  id: import_zod4.z.string().uuid(),
  name: import_zod4.z.string(),
  siret: import_zod4.z.string().optional(),
  naf_code: import_zod4.z.string().optional(),
  size: import_zod4.z.enum(["1-9", "10-49", "50-249", "250-999", "1000+"]).optional(),
  description: import_zod4.z.string().optional(),
  website: import_zod4.z.string().url().optional(),
  created_at: import_zod4.z.string(),
  updated_at: import_zod4.z.string()
});
var ErrorResponseSchema = import_zod4.z.object({
  error: import_zod4.z.string(),
  message: import_zod4.z.string(),
  code: import_zod4.z.string().optional(),
  details: import_zod4.z.record(import_zod4.z.any()).optional()
});
var SuccessResponseSchema = import_zod4.z.object({
  success: import_zod4.z.boolean(),
  message: import_zod4.z.string().optional(),
  data: import_zod4.z.any().optional()
});
var BatchStatusEnum = import_zod4.z.enum(["pending", "running", "completed", "failed", "cancelled"]);
var BatchSchema = import_zod4.z.object({
  id: import_zod4.z.string().uuid(),
  name: import_zod4.z.string(),
  type: import_zod4.z.enum(["offers_ingest", "cv_parsing", "embeddings_update"]),
  status: BatchStatusEnum,
  filters: import_zod4.z.record(import_zod4.z.any()).optional(),
  total_items: import_zod4.z.number().optional(),
  processed_items: import_zod4.z.number().default(0),
  failed_items: import_zod4.z.number().default(0),
  estimated_cost: import_zod4.z.number().optional(),
  estimated_duration_seconds: import_zod4.z.number().optional(),
  started_at: import_zod4.z.string().optional(),
  completed_at: import_zod4.z.string().optional(),
  error_message: import_zod4.z.string().optional(),
  created_by: import_zod4.z.string().uuid(),
  created_at: import_zod4.z.string()
});

// src/api.ts
var import_zod5 = require("zod");
var SearchOffersRequestSchema = import_zod5.z.object({
  query: import_zod5.z.string().optional(),
  rome_codes: import_zod5.z.array(import_zod5.z.string()).optional(),
  location: import_zod5.z.string().optional(),
  radius_km: import_zod5.z.number().min(1).max(500).optional(),
  contract_types: import_zod5.z.array(ContractTypeEnum).optional(),
  work_modes: import_zod5.z.array(WorkModeEnum).optional(),
  salary_min: import_zod5.z.number().optional(),
  alternance: import_zod5.z.boolean().optional(),
  sort_by: import_zod5.z.enum(["relevance", "date", "salary"]).default("relevance"),
  sort_order: SortOrderEnum.default("desc"),
  page: import_zod5.z.number().min(1).default(1),
  limit: import_zod5.z.number().min(1).max(100).default(20)
});
var IngestOffersRequestSchema = import_zod5.z.object({
  source: OfferSourceEnum,
  filters: import_zod5.z.record(import_zod5.z.any()).optional(),
  limit: import_zod5.z.number().min(1).max(1e3).optional(),
  dry_run: import_zod5.z.boolean().default(false)
});
var CVUploadRequestSchema = import_zod5.z.object({
  file_name: import_zod5.z.string(),
  mime_type: import_zod5.z.enum(["application/pdf"]),
  file_size: import_zod5.z.number().max(10 * 1024 * 1024)
  // 10MB max
});
var MatchRequestSchema = import_zod5.z.object({
  app_user_id: import_zod5.z.string().uuid(),
  limit: import_zod5.z.number().min(1).max(100).default(20),
  min_score: import_zod5.z.number().min(0).max(1).default(0.5),
  include_explanations: import_zod5.z.boolean().default(true)
});
var MatchResultSchema = import_zod5.z.object({
  offer_id: import_zod5.z.string().uuid(),
  score: import_zod5.z.number().min(0).max(1),
  score_components: import_zod5.z.object({
    semantic_similarity: import_zod5.z.number(),
    skills_overlap: import_zod5.z.number(),
    location_match: import_zod5.z.number()
  }).optional(),
  explanations: import_zod5.z.object({
    matched_skills: import_zod5.z.array(import_zod5.z.string()),
    missing_skills: import_zod5.z.array(import_zod5.z.string()),
    gating_reasons: import_zod5.z.array(import_zod5.z.string()),
    distance_km: import_zod5.z.number().optional()
  }).optional()
});
var BatchCreateRequestSchema = import_zod5.z.object({
  name: import_zod5.z.string(),
  type: import_zod5.z.enum(["offers_ingest", "cv_parsing", "embeddings_update"]),
  filters: import_zod5.z.record(import_zod5.z.any()).optional(),
  options: import_zod5.z.object({
    concurrency: import_zod5.z.number().min(1).max(10).default(3),
    retry_count: import_zod5.z.number().min(0).max(5).default(2),
    dry_run: import_zod5.z.boolean().default(false)
  }).optional()
});
var SSEEventTypeEnum = import_zod5.z.enum([
  "batch_started",
  "batch_progress",
  "batch_item_processed",
  "batch_item_failed",
  "batch_completed",
  "batch_failed",
  "batch_cancelled"
]);
var SSEEventSchema = import_zod5.z.object({
  type: SSEEventTypeEnum,
  data: import_zod5.z.any(),
  timestamp: import_zod5.z.string()
});
var SkillExtractionSchema = import_zod5.z.object({
  name: import_zod5.z.string(),
  normalized_name: import_zod5.z.string(),
  category: import_zod5.z.enum(["technical", "soft", "domain", "tool", "language"]),
  confidence: import_zod5.z.number().min(0).max(1),
  required: import_zod5.z.boolean()
});
var LanguageDetectionSchema = import_zod5.z.object({
  code: import_zod5.z.string().length(2),
  name: import_zod5.z.string(),
  level: import_zod5.z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "native"]).optional(),
  confidence: import_zod5.z.number().min(0).max(1),
  required: import_zod5.z.boolean()
});
var DegreeRequirementSchema = import_zod5.z.object({
  level_eqf: import_zod5.z.number().min(1).max(8),
  degree_type: import_zod5.z.string(),
  confidence: import_zod5.z.number().min(0).max(1)
});
var ConfidenceScoresSchema = import_zod5.z.object({
  skills: import_zod5.z.number().min(0).max(1),
  seniority: import_zod5.z.number().min(0).max(1),
  languages: import_zod5.z.number().min(0).max(1),
  degrees: import_zod5.z.number().min(0).max(1),
  global: import_zod5.z.number().min(0).max(1)
});
var EnrichmentRequestSchema = import_zod5.z.object({
  offer_ids: import_zod5.z.array(import_zod5.z.string().uuid()).min(1).max(100),
  confidence_threshold: import_zod5.z.number().min(0).max(1).default(0.8),
  force_reprocess: import_zod5.z.boolean().default(false),
  include_low_confidence: import_zod5.z.boolean().default(false)
});
var EnrichmentResponseSchema = import_zod5.z.object({
  success: import_zod5.z.boolean(),
  processed_count: import_zod5.z.number(),
  enrichments: import_zod5.z.array(import_zod5.z.object({
    id: import_zod5.z.string().uuid(),
    offer_id: import_zod5.z.string().uuid(),
    skills_required: import_zod5.z.array(SkillExtractionSchema),
    skills_preferred: import_zod5.z.array(SkillExtractionSchema),
    seniority_level: import_zod5.z.enum(["intern", "junior", "mid", "senior", "lead", "manager"]).optional(),
    languages_detected: import_zod5.z.array(LanguageDetectionSchema),
    degree_requirements: import_zod5.z.array(DegreeRequirementSchema),
    confidence_scores: ConfidenceScoresSchema,
    enrichment_status: import_zod5.z.enum(["completed", "low_confidence", "failed"]),
    processed_at: import_zod5.z.string()
  })),
  errors: import_zod5.z.array(import_zod5.z.object({
    offer_id: import_zod5.z.string().uuid(),
    error: import_zod5.z.string(),
    retryable: import_zod5.z.boolean()
  })),
  cost_estimate: import_zod5.z.object({
    tokens_used: import_zod5.z.number(),
    estimated_cost_usd: import_zod5.z.number()
  }),
  processing_stats: import_zod5.z.object({
    total_time_ms: import_zod5.z.number(),
    avg_confidence: import_zod5.z.number(),
    success_rate: import_zod5.z.number()
  })
});
var AdminEnrichmentStatsSchema = import_zod5.z.object({
  overview: import_zod5.z.object({
    total_offers: import_zod5.z.number(),
    enriched_offers: import_zod5.z.number(),
    enrichment_rate: import_zod5.z.number(),
    avg_confidence: import_zod5.z.number()
  }),
  status_breakdown: import_zod5.z.object({
    completed: import_zod5.z.number(),
    processing: import_zod5.z.number(),
    failed: import_zod5.z.number(),
    low_confidence: import_zod5.z.number()
  }),
  cost_tracking: import_zod5.z.object({
    total_tokens_used: import_zod5.z.number(),
    total_cost_usd: import_zod5.z.number(),
    avg_cost_per_offer: import_zod5.z.number(),
    monthly_budget_used: import_zod5.z.number()
  }),
  performance_metrics: import_zod5.z.object({
    avg_processing_time_ms: import_zod5.z.number(),
    success_rate_24h: import_zod5.z.number(),
    latest_batch_id: import_zod5.z.string().optional(),
    active_batches: import_zod5.z.number()
  }),
  skill_categories: import_zod5.z.array(import_zod5.z.object({
    category: import_zod5.z.string(),
    count: import_zod5.z.number(),
    confidence_avg: import_zod5.z.number()
  }))
});
var EnrichmentHistoryItemSchema = import_zod5.z.object({
  id: import_zod5.z.string().uuid(),
  batch_id: import_zod5.z.string().uuid().optional(),
  offer_id: import_zod5.z.string().uuid(),
  offer_title: import_zod5.z.string(),
  enrichment_status: import_zod5.z.enum(["completed", "processing", "failed", "low_confidence"]),
  confidence_scores: ConfidenceScoresSchema.optional(),
  skills_count: import_zod5.z.number(),
  tokens_used: import_zod5.z.number(),
  processing_time_ms: import_zod5.z.number(),
  error_message: import_zod5.z.string().optional(),
  processed_at: import_zod5.z.string(),
  created_at: import_zod5.z.string()
});
var EnrichmentHistoryResponseSchema = import_zod5.z.object({
  success: import_zod5.z.boolean(),
  history: import_zod5.z.array(EnrichmentHistoryItemSchema),
  pagination: import_zod5.z.object({
    total: import_zod5.z.number(),
    page: import_zod5.z.number(),
    limit: import_zod5.z.number(),
    total_pages: import_zod5.z.number()
  })
});
var AdminBatchEnrichmentRequestSchema = import_zod5.z.object({
  filters: import_zod5.z.object({
    rome_codes: import_zod5.z.array(import_zod5.z.string()).optional(),
    source: import_zod5.z.enum(["LBA", "FT"]).optional(),
    created_after: import_zod5.z.string().optional(),
    not_enriched_only: import_zod5.z.boolean().default(true)
  }).optional(),
  batch_size: import_zod5.z.number().min(1).max(500).default(100),
  confidence_threshold: import_zod5.z.number().min(0).max(1).default(0.8),
  priority: import_zod5.z.enum(["low", "normal", "high"]).default("normal")
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdminBatchEnrichmentRequestSchema,
  AdminEnrichmentStatsSchema,
  AppRoleEnum,
  AppUserSchema,
  BatchCreateRequestSchema,
  BatchSchema,
  BatchStatusEnum,
  CEFRLevelEnum,
  CVDegreeSchema,
  CVDocumentSchema,
  CVEmbeddingSchema,
  CVEnrichmentSchema,
  CVExperienceSchema,
  CVLanguageSchema,
  CVParseStatusEnum,
  CVSkillSchema,
  CVUploadRequestSchema,
  CandidateProfileSchema,
  CompanySchema,
  ConfidenceScoreSchema,
  ConfidenceScoresSchema,
  ContractTypeEnum,
  DegreeClassificationSchema,
  DegreeRequirementSchema,
  EnrichedLanguageSchema,
  EnrichedSkillSchema,
  EnrichmentHistoryItemSchema,
  EnrichmentHistoryResponseSchema,
  EnrichmentRequestSchema,
  EnrichmentResponseSchema,
  ErrorResponseSchema,
  IngestOffersRequestSchema,
  LanguageDetectionSchema,
  LanguageRequirementSchema,
  LocationSchema,
  LoginSchema,
  MatchRequestSchema,
  MatchResultSchema,
  OfferEmbeddingSchema,
  OfferEnrichmentSchema,
  OfferSchema,
  OfferSourceEnum,
  OfferStatusEnum,
  PaginationSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  RegistrationSchema,
  SSEEventSchema,
  SSEEventTypeEnum,
  SearchOffersRequestSchema,
  SeniorityLevelEnum,
  SessionSchema,
  SkillCategoryEnum,
  SkillExtractionSchema,
  SkillSchema,
  SortOrderEnum,
  SuccessResponseSchema,
  WorkModeEnum
});
