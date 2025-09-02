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
  ANONYMOUS_CV_CONSTRAINTS: () => ANONYMOUS_CV_CONSTRAINTS,
  ANONYMOUS_SESSION_CONSTANTS: () => ANONYMOUS_SESSION_CONSTANTS,
  AdminBatchEnrichmentRequestSchema: () => AdminBatchEnrichmentRequestSchema,
  AdminEnrichmentStatsSchema: () => AdminEnrichmentStatsSchema,
  Agent: () => Agent,
  AgentCapability: () => AgentCapability,
  AgentConversation: () => AgentConversation,
  AgentResponse: () => AgentResponse,
  AnonymousCVMigrationSchema: () => AnonymousCVMigrationSchema,
  AnonymousCVProcessingRequestSchema: () => AnonymousCVProcessingRequestSchema,
  AnonymousCVProcessingStatusSchema: () => AnonymousCVProcessingStatusSchema,
  AnonymousCVResultSchema: () => AnonymousCVResultSchema,
  AnonymousCVSessionSchema: () => AnonymousCVSessionSchema,
  AnonymousCVUploadInitRequestSchema: () => AnonymousCVUploadInitRequestSchema,
  AnonymousCVUploadInitResponseSchema: () => AnonymousCVUploadInitResponseSchema,
  AnonymousSessionErrorCodes: () => AnonymousSessionErrorCodes,
  AnonymousSessionErrorSchema: () => AnonymousSessionErrorSchema,
  AnonymousSessionRateLimitSchema: () => AnonymousSessionRateLimitSchema,
  AnonymousSessionSchema: () => AnonymousSessionSchema,
  AppRoleEnum: () => AppRoleEnum,
  AppUserSchema: () => AppUserSchema,
  BatchCreateRequestSchema: () => BatchCreateRequestSchema,
  BatchSchema: () => BatchSchema,
  BatchStatusEnum: () => BatchStatusEnum,
  CEFRLevelEnum: () => CEFRLevelEnum,
  CVAIExtractionSchema: () => CVAIExtractionSchema,
  CVDegreeSchema: () => CVDegreeSchema,
  CVDocumentSchema: () => CVDocumentSchema,
  CVEmbeddingContextSchema: () => CVEmbeddingContextSchema,
  CVEmbeddingSchema: () => CVEmbeddingSchema,
  CVEnrichmentSchema: () => CVEnrichmentSchema,
  CVExperienceSchema: () => CVExperienceSchema,
  CVJobMatchSchema: () => CVJobMatchSchema,
  CVLanguageSchema: () => CVLanguageSchema,
  CVMigrationRequestSchema: () => CVMigrationRequestSchema,
  CVParseStatusEnum: () => CVParseStatusEnum,
  CVProcessStatusResponseSchema: () => CVProcessStatusResponseSchema,
  CVProcessingErrorSchema: () => CVProcessingErrorSchema,
  CVProcessingMetricSchema: () => CVProcessingMetricSchema,
  CVProcessingProgressSchema: () => CVProcessingProgressSchema,
  CVProcessingQueueSchema: () => CVProcessingQueueSchema,
  CVProcessingStageSchema: () => CVProcessingStageSchema,
  CVSkillSchema: () => CVSkillSchema,
  CVUploadInitRequestSchema: () => CVUploadInitRequestSchema,
  CVUploadInitResponseSchema: () => CVUploadInitResponseSchema,
  CVUploadRequestSchema: () => CVUploadRequestSchema,
  CVUploadSessionSchema: () => CVUploadSessionSchema,
  CVValidationResultSchema: () => CVValidationResultSchema,
  CV_CONSTRAINTS: () => CV_CONSTRAINTS,
  CV_PROCESSING_PRIORITIES: () => CV_PROCESSING_PRIORITIES,
  CV_PROCESSING_STAGES: () => CV_PROCESSING_STAGES,
  CV_UPLOAD_STATUS: () => CV_UPLOAD_STATUS,
  CV_VALIDATION_TYPES: () => CV_VALIDATION_TYPES,
  CandidateProfileSchema: () => CandidateProfileSchema,
  CapabilitiesResponse: () => CapabilitiesResponse,
  CompanySchema: () => CompanySchema,
  ConfidenceScoreSchema: () => ConfidenceScoreSchema,
  ConfidenceScoresSchema: () => ConfidenceScoresSchema,
  ContractTypeEnum: () => ContractTypeEnum,
  ConversationStatus: () => ConversationStatus,
  CreateAnonymousSessionRequestSchema: () => CreateAnonymousSessionRequestSchema,
  CreateAnonymousSessionResponseSchema: () => CreateAnonymousSessionResponseSchema,
  DegreeClassificationSchema: () => DegreeClassificationSchema,
  DegreeRequirementSchema: () => DegreeRequirementSchema,
  DelegateTaskRequest: () => DelegateTaskRequest,
  EnrichedLanguageSchema: () => EnrichedLanguageSchema,
  EnrichedSkillSchema: () => EnrichedSkillSchema,
  EnrichmentHistoryItemSchema: () => EnrichmentHistoryItemSchema,
  EnrichmentHistoryResponseSchema: () => EnrichmentHistoryResponseSchema,
  EnrichmentRequestSchema: () => EnrichmentRequestSchema,
  EnrichmentResponseSchema: () => EnrichmentResponseSchema,
  ErrorResponseSchema: () => ErrorResponseSchema,
  IngestOffersRequestSchema: () => IngestOffersRequestSchema,
  InvokeAgentRequest: () => InvokeAgentRequest,
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
  PartialCVResultsResponseSchema: () => PartialCVResultsResponseSchema,
  PasswordResetRequestSchema: () => PasswordResetRequestSchema,
  PasswordResetSchema: () => PasswordResetSchema,
  Priority: () => Priority,
  RateLimitConfigSchema: () => RateLimitConfigSchema,
  RegistrationSchema: () => RegistrationSchema,
  SSEEventSchema: () => SSEEventSchema,
  SSEEventTypeEnum: () => SSEEventTypeEnum,
  SearchOffersRequestSchema: () => SearchOffersRequestSchema,
  SecurityConfigSchema: () => SecurityConfigSchema,
  SeniorityLevelEnum: () => SeniorityLevelEnum,
  SessionCookieConfigSchema: () => SessionCookieConfigSchema,
  SessionDetectionResponseSchema: () => SessionDetectionResponseSchema,
  SessionSchema: () => SessionSchema,
  SkillCategoryEnum: () => SkillCategoryEnum,
  SkillExtractionSchema: () => SkillExtractionSchema,
  SkillSchema: () => SkillSchema,
  SortOrderEnum: () => SortOrderEnum,
  SuccessResponseSchema: () => SuccessResponseSchema,
  TaskType: () => TaskType,
  ValidateAnonymousSessionResponseSchema: () => ValidateAnonymousSessionResponseSchema,
  WorkModeEnum: () => WorkModeEnum,
  canAgentInvoke: () => canAgentInvoke,
  getAgentByCapability: () => getAgentByCapability,
  getAgentsByTaskType: () => getAgentsByTaskType
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

// src/agents.ts
var import_zod6 = require("zod");
var AgentCapability = import_zod6.z.enum([
  // Project Management
  "project_management",
  "task_delegation",
  "team_coordination",
  "decision_making",
  "conflict_resolution",
  // Backend
  "database_design",
  "api_development",
  "supabase",
  "postgresql",
  "performance_optimization",
  "data_modeling",
  // Frontend
  "react",
  "nextjs",
  "tailwind",
  "shadcn_ui",
  "user_experience",
  "responsive_design",
  // Recruitment
  "job_matching",
  "rome_codes",
  "france_travail",
  "lba_api",
  "recruitment_processes",
  "candidate_profiling",
  // AI/ML
  "openai_integration",
  "embeddings",
  "vector_search",
  "pgvector",
  "prompt_engineering",
  "ai_optimization",
  // DevOps
  "vercel_deployment",
  "ci_cd",
  "monitoring",
  "performance",
  "security",
  "infrastructure"
]);
var TaskType = import_zod6.z.enum([
  "database_issue",
  "api_bug_fix",
  "performance_optimization",
  "ui_improvement",
  "ai_integration",
  "deployment_issue",
  "security_review",
  "code_review",
  "architecture_design",
  "data_analysis",
  "user_research",
  "testing",
  "documentation",
  "troubleshooting"
]);
var ConversationStatus = import_zod6.z.enum([
  "pending",
  "in_progress",
  "completed",
  "failed",
  "escalated"
]);
var Priority = import_zod6.z.number().int().min(1).max(5);
var Agent = import_zod6.z.object({
  id: import_zod6.z.string(),
  name: import_zod6.z.string(),
  role: import_zod6.z.string(),
  capabilities: import_zod6.z.array(AgentCapability),
  system_prompt: import_zod6.z.string(),
  hierarchy_level: import_zod6.z.number().int().min(1).max(5),
  can_invoke: import_zod6.z.array(import_zod6.z.string()),
  created_at: import_zod6.z.union([import_zod6.z.string().datetime(), import_zod6.z.string()]).optional(),
  updated_at: import_zod6.z.union([import_zod6.z.string().datetime(), import_zod6.z.string()]).optional()
});
var AgentConversation = import_zod6.z.object({
  id: import_zod6.z.string().uuid(),
  from_agent: import_zod6.z.string(),
  to_agent: import_zod6.z.string(),
  task_type: TaskType,
  task_description: import_zod6.z.string(),
  request_data: import_zod6.z.record(import_zod6.z.any()),
  response_data: import_zod6.z.record(import_zod6.z.any()).optional(),
  status: ConversationStatus,
  priority: Priority,
  created_at: import_zod6.z.string().datetime(),
  started_at: import_zod6.z.string().datetime().optional(),
  completed_at: import_zod6.z.string().datetime().optional(),
  error_message: import_zod6.z.string().optional()
});
var InvokeAgentRequest = import_zod6.z.object({
  target_agent: import_zod6.z.string(),
  task_type: TaskType,
  task_description: import_zod6.z.string(),
  request_data: import_zod6.z.record(import_zod6.z.any()),
  priority: Priority.optional().default(3)
});
var DelegateTaskRequest = import_zod6.z.object({
  task_description: import_zod6.z.string(),
  context: import_zod6.z.record(import_zod6.z.any()),
  priority: Priority.optional().default(3),
  preferred_agent: import_zod6.z.string().optional()
});
var AgentResponse = import_zod6.z.object({
  success: import_zod6.z.boolean(),
  data: import_zod6.z.record(import_zod6.z.any()).optional(),
  error: import_zod6.z.string().optional(),
  agent_id: import_zod6.z.string(),
  conversation_id: import_zod6.z.string().uuid(),
  execution_time_ms: import_zod6.z.number().optional()
});
var CapabilitiesResponse = import_zod6.z.object({
  agents: import_zod6.z.array(Agent),
  total_count: import_zod6.z.number()
});
var getAgentByCapability = (agents, capability) => {
  return agents.find((agent) => agent.capabilities.includes(capability)) || null;
};
var getAgentsByTaskType = (agents, taskType) => {
  const taskCapabilityMap = {
    "database_issue": ["database_design", "supabase", "postgresql"],
    "api_bug_fix": ["api_development", "supabase"],
    "performance_optimization": ["performance_optimization", "database_design"],
    "ui_improvement": ["react", "nextjs", "user_experience"],
    "ai_integration": ["openai_integration", "embeddings", "ai_optimization"],
    "deployment_issue": ["vercel_deployment", "ci_cd", "infrastructure"],
    "security_review": ["security"],
    "code_review": ["api_development", "react"],
    "architecture_design": ["database_design", "user_experience"],
    "data_analysis": ["data_modeling", "postgresql"],
    "user_research": ["user_experience", "recruitment_processes"],
    "testing": ["api_development", "react"],
    "documentation": ["project_management"],
    "troubleshooting": ["database_design", "api_development", "supabase"]
  };
  const requiredCapabilities = taskCapabilityMap[taskType] || [];
  return agents.filter(
    (agent) => requiredCapabilities.some(
      (capability) => agent.capabilities.includes(capability)
    )
  ).sort((a, b) => b.hierarchy_level - a.hierarchy_level);
};
var canAgentInvoke = (fromAgent, toAgentId) => {
  return fromAgent.can_invoke.includes(toAgentId) || fromAgent.hierarchy_level >= 4;
};

// src/cv.ts
var import_zod7 = require("zod");
var CVUploadSessionSchema = import_zod7.z.object({
  id: import_zod7.z.string().uuid(),
  user_id: import_zod7.z.string().uuid().nullable(),
  // Made nullable for anonymous sessions
  anonymous_session_id: import_zod7.z.string().uuid().nullable(),
  // New: for anonymous sessions
  filename: import_zod7.z.string().max(500),
  file_size_bytes: import_zod7.z.number().int().min(0),
  file_hash: import_zod7.z.string().length(64),
  // SHA256 hash
  upload_status: import_zod7.z.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  storage_path: import_zod7.z.string().nullable(),
  processing_started_at: import_zod7.z.string().datetime().nullable(),
  processing_completed_at: import_zod7.z.string().datetime().nullable(),
  error_message: import_zod7.z.string().nullable(),
  metadata: import_zod7.z.record(import_zod7.z.unknown()).default({}),
  // New Phase 2 fields
  session_type: import_zod7.z.enum(["authenticated", "anonymous"]).default("authenticated"),
  partial_results_shown: import_zod7.z.boolean().default(false),
  full_access_available: import_zod7.z.boolean().default(false),
  conversion_attempted: import_zod7.z.boolean().default(false),
  converted_user_id: import_zod7.z.string().uuid().nullable(),
  created_at: import_zod7.z.string().datetime(),
  updated_at: import_zod7.z.string().datetime()
});
var CVProcessingQueueSchema = import_zod7.z.object({
  id: import_zod7.z.string().uuid(),
  upload_session_id: import_zod7.z.string().uuid(),
  queue_status: import_zod7.z.enum(["pending", "processing", "completed", "failed", "retry"]),
  priority: import_zod7.z.number().int().min(1).max(10).default(5),
  retry_count: import_zod7.z.number().int().min(0).default(0),
  max_retries: import_zod7.z.number().int().min(0).default(3),
  processing_started_at: import_zod7.z.string().datetime().nullable(),
  processing_completed_at: import_zod7.z.string().datetime().nullable(),
  worker_id: import_zod7.z.string().max(100).nullable(),
  error_message: import_zod7.z.string().nullable(),
  stage_details: import_zod7.z.record(import_zod7.z.unknown()).default({}),
  created_at: import_zod7.z.string().datetime(),
  updated_at: import_zod7.z.string().datetime()
});
var CVValidationResultSchema = import_zod7.z.object({
  id: import_zod7.z.string().uuid(),
  upload_session_id: import_zod7.z.string().uuid(),
  validation_type: import_zod7.z.enum(["format", "content", "security", "quality"]),
  validation_status: import_zod7.z.enum(["passed", "failed", "warning"]),
  validation_score: import_zod7.z.number().min(0).max(1).nullable(),
  validation_details: import_zod7.z.record(import_zod7.z.unknown()).default({}),
  validation_errors: import_zod7.z.array(import_zod7.z.string()).default([]),
  created_at: import_zod7.z.string().datetime()
});
var CVProcessingMetricSchema = import_zod7.z.object({
  id: import_zod7.z.string().uuid(),
  upload_session_id: import_zod7.z.string().uuid(),
  metric_type: import_zod7.z.enum(["processing_time", "api_cost", "extraction_accuracy", "tokens_used"]),
  metric_value: import_zod7.z.number(),
  metric_unit: import_zod7.z.enum(["seconds", "dollars", "percentage", "tokens"]).nullable(),
  processing_stage: import_zod7.z.enum(["text_extraction", "ai_parsing", "embedding_generation", "total"]).nullable(),
  metadata: import_zod7.z.record(import_zod7.z.unknown()).default({}),
  created_at: import_zod7.z.string().datetime()
});
var CVEmbeddingContextSchema = import_zod7.z.object({
  profile_title: import_zod7.z.string(),
  rome_codes: import_zod7.z.array(import_zod7.z.string()),
  location: import_zod7.z.object({
    city: import_zod7.z.string(),
    department_code: import_zod7.z.string(),
    region_code: import_zod7.z.string(),
    country: import_zod7.z.string().default("FR")
  }),
  seniority_level: import_zod7.z.enum(["intern", "junior", "mid", "senior", "lead", "manager"]),
  contract_preferences: import_zod7.z.array(import_zod7.z.enum(["CDI", "CDD", "APP", "PRO", "INTERIM", "STAGE", "FLEXIBLE"])),
  work_mode_preferences: import_zod7.z.array(import_zod7.z.enum(["onsite", "remote", "hybrid", "flexible"])),
  languages: import_zod7.z.array(import_zod7.z.object({
    code: import_zod7.z.string().length(2),
    cefr_level: import_zod7.z.number().int().min(1).max(6),
    confidence: import_zod7.z.number().min(0).max(1)
  })),
  degree_eqf_top: import_zod7.z.number().int().min(1).max(8).nullable(),
  skills_mastered: import_zod7.z.array(import_zod7.z.object({
    name: import_zod7.z.string(),
    normalized_name: import_zod7.z.string(),
    years_experience: import_zod7.z.number().min(0).nullable(),
    confidence: import_zod7.z.number().min(0).max(1)
  })),
  skills_learning: import_zod7.z.array(import_zod7.z.object({
    name: import_zod7.z.string(),
    normalized_name: import_zod7.z.string(),
    confidence: import_zod7.z.number().min(0).max(1)
  })),
  salary_expectation: import_zod7.z.object({
    min: import_zod7.z.number().int().min(0),
    max: import_zod7.z.number().int().min(0),
    period: import_zod7.z.enum(["annual", "monthly", "daily"]),
    currency: import_zod7.z.string().default("EUR")
  }).nullable(),
  availability: import_zod7.z.string().nullable()
  // Format: 'YYYY-MM' or 'ASAP'
});
var CVAIExtractionSchema = import_zod7.z.object({
  profile: import_zod7.z.object({
    title_canonical: import_zod7.z.string(),
    location_preferred: import_zod7.z.object({
      city: import_zod7.z.string(),
      department_code: import_zod7.z.string(),
      region_code: import_zod7.z.string()
    }),
    availability: import_zod7.z.string().nullable(),
    seniority_level: import_zod7.z.enum(["intern", "junior", "mid", "senior", "lead", "manager"])
  }),
  skills_mastered: import_zod7.z.array(import_zod7.z.object({
    name: import_zod7.z.string(),
    normalized_name: import_zod7.z.string(),
    years_experience: import_zod7.z.number().min(0).nullable(),
    confidence: import_zod7.z.number().min(0).max(1)
  })),
  skills_learning: import_zod7.z.array(import_zod7.z.object({
    name: import_zod7.z.string(),
    normalized_name: import_zod7.z.string(),
    confidence: import_zod7.z.number().min(0).max(1)
  })),
  experience: import_zod7.z.object({
    total_years: import_zod7.z.number().min(0),
    rome_codes_detected: import_zod7.z.array(import_zod7.z.string()),
    previous_roles: import_zod7.z.array(import_zod7.z.object({
      title: import_zod7.z.string(),
      duration_months: import_zod7.z.number().int().min(0),
      company: import_zod7.z.string(),
      responsibilities: import_zod7.z.array(import_zod7.z.string()).optional()
    }))
  }),
  education: import_zod7.z.object({
    highest_degree: import_zod7.z.object({
      level_eqf: import_zod7.z.number().int().min(1).max(8),
      degree_type: import_zod7.z.string(),
      confidence: import_zod7.z.number().min(0).max(1)
    }).nullable()
  }),
  languages: import_zod7.z.array(import_zod7.z.object({
    code: import_zod7.z.string().length(2),
    cefr_level: import_zod7.z.number().int().min(1).max(6),
    confidence: import_zod7.z.number().min(0).max(1)
  })),
  preferences: import_zod7.z.object({
    contract_types: import_zod7.z.array(import_zod7.z.enum(["CDI", "CDD", "APP", "PRO", "INTERIM", "STAGE"])),
    work_modes: import_zod7.z.array(import_zod7.z.enum(["onsite", "remote", "hybrid"])),
    salary_expectation: import_zod7.z.object({
      min: import_zod7.z.number().int().min(0),
      max: import_zod7.z.number().int().min(0),
      period: import_zod7.z.enum(["annual", "monthly"])
    }).nullable()
  }),
  confidence_scores: import_zod7.z.object({
    profile: import_zod7.z.number().min(0).max(1),
    skills: import_zod7.z.number().min(0).max(1),
    experience: import_zod7.z.number().min(0).max(1),
    education: import_zod7.z.number().min(0).max(1),
    global: import_zod7.z.number().min(0).max(1)
  })
});
var CVUploadInitRequestSchema = import_zod7.z.object({
  filename: import_zod7.z.string().min(1).max(500),
  file_size: import_zod7.z.number().int().min(1).max(10 * 1024 * 1024),
  // 10MB max
  file_hash: import_zod7.z.string().length(64),
  // SHA256
  content_type: import_zod7.z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"])
});
var CVUploadInitResponseSchema = import_zod7.z.object({
  session_id: import_zod7.z.string().uuid(),
  upload_url: import_zod7.z.string().url(),
  success: import_zod7.z.boolean(),
  message: import_zod7.z.string().optional()
});
var CVProcessStatusResponseSchema = import_zod7.z.object({
  session_id: import_zod7.z.string().uuid(),
  status: import_zod7.z.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  progress_percentage: import_zod7.z.number().min(0).max(100),
  current_stage: import_zod7.z.string().optional(),
  estimated_time_remaining: import_zod7.z.number().nullable(),
  // seconds
  error_message: import_zod7.z.string().nullable(),
  validation_results: import_zod7.z.array(CVValidationResultSchema).optional(),
  processing_metrics: import_zod7.z.array(CVProcessingMetricSchema).optional()
});
var CVProcessingStageSchema = import_zod7.z.object({
  stage_name: import_zod7.z.string(),
  stage_order: import_zod7.z.number().int().min(1),
  status: import_zod7.z.enum(["pending", "processing", "completed", "failed", "skipped"]),
  progress_percentage: import_zod7.z.number().min(0).max(100),
  started_at: import_zod7.z.string().datetime().nullable(),
  completed_at: import_zod7.z.string().datetime().nullable(),
  duration_ms: import_zod7.z.number().int().min(0).nullable(),
  error_message: import_zod7.z.string().nullable(),
  stage_data: import_zod7.z.record(import_zod7.z.unknown()).default({})
});
var CVProcessingProgressSchema = import_zod7.z.object({
  session_id: import_zod7.z.string().uuid(),
  overall_status: import_zod7.z.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  overall_progress: import_zod7.z.number().min(0).max(100),
  estimated_completion: import_zod7.z.string().datetime().nullable(),
  stages: import_zod7.z.array(CVProcessingStageSchema),
  quality_score: import_zod7.z.number().min(0).max(1).nullable(),
  cost_estimate: import_zod7.z.number().min(0).nullable()
  // in dollars
});
var CVJobMatchSchema = import_zod7.z.object({
  offer_id: import_zod7.z.string(),
  match_score: import_zod7.z.number().min(0).max(1),
  explanation: import_zod7.z.object({
    semantic_similarity: import_zod7.z.number().min(0).max(1),
    skills_coverage: import_zod7.z.number().min(0).max(1),
    seniority_compatibility: import_zod7.z.number().min(0).max(1),
    location_match: import_zod7.z.number().min(0).max(1),
    preferences_alignment: import_zod7.z.number().min(0).max(1),
    reasons: import_zod7.z.array(import_zod7.z.string()),
    skill_gaps: import_zod7.z.array(import_zod7.z.string())
  }),
  offer_summary: import_zod7.z.object({
    title: import_zod7.z.string(),
    company_name: import_zod7.z.string(),
    location: import_zod7.z.string(),
    contract_type: import_zod7.z.string(),
    salary_range: import_zod7.z.string().nullable()
  })
});
var CVProcessingErrorSchema = import_zod7.z.object({
  error_code: import_zod7.z.string(),
  error_message: import_zod7.z.string(),
  error_details: import_zod7.z.record(import_zod7.z.unknown()).optional(),
  session_id: import_zod7.z.string().uuid().optional(),
  recovery_suggestions: import_zod7.z.array(import_zod7.z.string()).optional()
});
var CV_UPLOAD_STATUS = {
  INITIATED: "initiated",
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed"
};
var CV_PROCESSING_STAGES = {
  FILE_VALIDATION: "file_validation",
  TEXT_EXTRACTION: "text_extraction",
  AI_PARSING: "ai_parsing",
  DATA_VALIDATION: "data_validation",
  EMBEDDING_GENERATION: "embedding_generation",
  PROFILE_CREATION: "profile_creation",
  MATCHING_PREPARATION: "matching_preparation"
};
var CV_VALIDATION_TYPES = {
  FORMAT: "format",
  CONTENT: "content",
  SECURITY: "security",
  QUALITY: "quality"
};
var CV_PROCESSING_PRIORITIES = {
  HIGH: 1,
  NORMAL: 5,
  LOW: 10
};
var CV_CONSTRAINTS = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  // 10MB
  SUPPORTED_FORMATS: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  MAX_FILENAME_LENGTH: 500,
  MIN_CONFIDENCE_THRESHOLD: 0.8,
  MAX_PROCESSING_TIME_SECONDS: 300
  // 5 minutes
};
var AnonymousCVResultSchema = import_zod7.z.object({
  id: import_zod7.z.string().uuid(),
  anonymous_session_id: import_zod7.z.string().uuid(),
  upload_session_id: import_zod7.z.string().uuid(),
  // Partial results data (limited information)
  skills_count: import_zod7.z.number().int().min(0).default(0),
  experience_level: import_zod7.z.string().nullable(),
  job_matches_count: import_zod7.z.number().int().min(0).default(0),
  confidence_score: import_zod7.z.number().min(0).max(1).nullable(),
  // Limited skills preview (max 5 skills)
  skills_preview: import_zod7.z.array(import_zod7.z.object({
    name: import_zod7.z.string(),
    normalized_name: import_zod7.z.string(),
    confidence: import_zod7.z.number().min(0).max(1)
  })).default([]),
  // Teaser information to encourage registration
  additional_skills_available: import_zod7.z.number().int().min(0).default(0),
  detailed_matches_available: import_zod7.z.number().int().min(0).default(0),
  ai_insights_available: import_zod7.z.boolean().default(false),
  // Access tracking
  viewed_count: import_zod7.z.number().int().min(0).default(0),
  last_viewed_at: import_zod7.z.string().datetime().nullable(),
  // Expiration and cleanup
  created_at: import_zod7.z.string().datetime(),
  expires_at: import_zod7.z.string().datetime(),
  // Metadata
  metadata: import_zod7.z.record(import_zod7.z.unknown()).default({})
});
var AnonymousCVMigrationSchema = import_zod7.z.object({
  id: import_zod7.z.string().uuid(),
  // Source anonymous data
  anonymous_session_id: import_zod7.z.string().uuid(),
  original_upload_session_id: import_zod7.z.string().uuid(),
  // Target authenticated data
  new_user_id: import_zod7.z.string().uuid(),
  new_upload_session_id: import_zod7.z.string().uuid(),
  new_cv_profile_id: import_zod7.z.string().uuid().nullable(),
  // Migration details
  migration_status: import_zod7.z.enum(["pending", "completed", "failed"]).default("pending"),
  migrated_data_types: import_zod7.z.array(import_zod7.z.enum(["upload_session", "cv_profile", "cv_embeddings", "results"])).default([]),
  // Audit trail
  migration_started_at: import_zod7.z.string().datetime(),
  migration_completed_at: import_zod7.z.string().datetime().nullable(),
  error_message: import_zod7.z.string().nullable(),
  // Metadata
  metadata: import_zod7.z.record(import_zod7.z.unknown()).default({})
});
var SessionDetectionResponseSchema = import_zod7.z.object({
  session_type: import_zod7.z.enum(["authenticated", "anonymous", "invalid"]),
  user_id: import_zod7.z.string().uuid().nullable(),
  anonymous_session_id: import_zod7.z.string().uuid().nullable(),
  session_token: import_zod7.z.string().nullable(),
  requires_auth: import_zod7.z.boolean(),
  can_access_cv_processing: import_zod7.z.boolean(),
  upload_attempts_remaining: import_zod7.z.number().int().min(0).nullable(),
  session_expires_at: import_zod7.z.string().datetime().nullable()
});
var PartialCVResultsResponseSchema = import_zod7.z.object({
  success: import_zod7.z.boolean(),
  session_id: import_zod7.z.string().uuid(),
  access_level: import_zod7.z.enum(["partial", "full"]),
  // Partial data
  summary: import_zod7.z.object({
    skills_found: import_zod7.z.number().int().min(0),
    experience_level: import_zod7.z.string(),
    job_opportunities_estimated: import_zod7.z.number().int().min(0),
    analysis_confidence: import_zod7.z.number().min(0).max(1)
  }),
  // Limited preview data
  skills_preview: import_zod7.z.array(import_zod7.z.object({
    name: import_zod7.z.string(),
    confidence: import_zod7.z.enum(["high", "medium", "low"])
  })).max(5),
  location_detected: import_zod7.z.object({
    city: import_zod7.z.string().nullable(),
    region: import_zod7.z.string().nullable()
  }).nullable(),
  // Upgrade incentives
  full_results_available: import_zod7.z.object({
    complete_skills_analysis: import_zod7.z.number().int().min(0),
    detailed_job_matches: import_zod7.z.number().int().min(0),
    ai_powered_insights: import_zod7.z.boolean(),
    personalized_recommendations: import_zod7.z.boolean()
  }),
  // Next steps
  call_to_action: import_zod7.z.object({
    title: import_zod7.z.string(),
    description: import_zod7.z.string(),
    action_url: import_zod7.z.string(),
    expires_at: import_zod7.z.string().datetime()
  }),
  // Metadata
  processed_at: import_zod7.z.string().datetime(),
  expires_at: import_zod7.z.string().datetime()
});
var AnonymousCVProcessingRequestSchema = import_zod7.z.object({
  session_token: import_zod7.z.string().min(16),
  session_id: import_zod7.z.string().uuid(),
  generate_partial_results: import_zod7.z.boolean().default(true)
});
var CVMigrationRequestSchema = import_zod7.z.object({
  anonymous_session_token: import_zod7.z.string().min(16),
  new_user_id: import_zod7.z.string().uuid(),
  migrate_all_data: import_zod7.z.boolean().default(true),
  migrate_data_types: import_zod7.z.array(import_zod7.z.enum(["upload_session", "cv_profile", "cv_embeddings", "results"])).optional()
});
var ANONYMOUS_CV_CONSTRAINTS = {
  MAX_SKILLS_PREVIEW: 5,
  SESSION_DURATION_MINUTES: 60,
  PARTIAL_RESULTS_EXPIRY_MINUTES: 60,
  MAX_ANONYMOUS_UPLOADS_PER_SESSION: 3,
  MIN_CONFIDENCE_FOR_PARTIAL_RESULTS: 0.6,
  // Lower threshold for anonymous
  PARTIAL_RESULTS_REFRESH_INTERVAL_MS: 3e4
  // 30 seconds
};

// src/anonymous.ts
var import_zod8 = require("zod");
var AnonymousSessionSchema = import_zod8.z.object({
  id: import_zod8.z.string().uuid(),
  session_token: import_zod8.z.string(),
  // Security and fingerprinting
  client_ip: import_zod8.z.string(),
  user_agent_hash: import_zod8.z.string(),
  browser_fingerprint: import_zod8.z.string().optional(),
  // Session lifecycle
  created_at: import_zod8.z.string().datetime(),
  last_accessed_at: import_zod8.z.string().datetime(),
  expires_at: import_zod8.z.string().datetime(),
  is_active: import_zod8.z.boolean(),
  // Rate limiting
  upload_attempts: import_zod8.z.number().int().min(0),
  max_upload_attempts: import_zod8.z.number().int().min(1),
  // Conversion tracking
  converted_to_user_id: import_zod8.z.string().uuid().nullable(),
  converted_at: import_zod8.z.string().datetime().nullable(),
  // Metadata
  security_flags: import_zod8.z.record(import_zod8.z.unknown()).optional(),
  metadata: import_zod8.z.record(import_zod8.z.unknown()).optional()
});
var AnonymousCVSessionSchema = import_zod8.z.object({
  id: import_zod8.z.string().uuid(),
  anonymous_session_id: import_zod8.z.string().uuid(),
  // File information
  filename: import_zod8.z.string(),
  file_size_bytes: import_zod8.z.number().int().positive(),
  file_hash: import_zod8.z.string(),
  storage_path: import_zod8.z.string(),
  // Status tracking
  upload_status: import_zod8.z.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  processing_status: import_zod8.z.enum(["pending", "processing", "completed", "failed"]).nullable(),
  // Processing lifecycle
  processing_started_at: import_zod8.z.string().datetime().nullable(),
  processing_completed_at: import_zod8.z.string().datetime().nullable(),
  // Results (partial for anonymous users)
  partial_results: import_zod8.z.record(import_zod8.z.unknown()).nullable(),
  full_results_available: import_zod8.z.boolean(),
  // Error handling
  error_message: import_zod8.z.string().nullable(),
  retry_count: import_zod8.z.number().int().min(0),
  max_retries: import_zod8.z.number().int().min(0),
  // Timestamps
  created_at: import_zod8.z.string().datetime(),
  updated_at: import_zod8.z.string().datetime(),
  expires_at: import_zod8.z.string().datetime(),
  // Metadata
  metadata: import_zod8.z.record(import_zod8.z.unknown()).optional()
});
var AnonymousSessionRateLimitSchema = import_zod8.z.object({
  id: import_zod8.z.string().uuid(),
  anonymous_session_id: import_zod8.z.string().uuid(),
  // Rate limiting window
  window_start: import_zod8.z.string().datetime(),
  window_duration: import_zod8.z.string(),
  // PostgreSQL interval
  // Counters
  api_calls_count: import_zod8.z.number().int().min(0),
  upload_attempts: import_zod8.z.number().int().min(0),
  // Limits
  max_api_calls: import_zod8.z.number().int().min(1),
  max_uploads: import_zod8.z.number().int().min(1),
  // Blocking
  is_blocked: import_zod8.z.boolean(),
  blocked_until: import_zod8.z.string().datetime().nullable(),
  block_reason: import_zod8.z.string().nullable(),
  // Timestamps
  created_at: import_zod8.z.string().datetime(),
  updated_at: import_zod8.z.string().datetime()
});
var CreateAnonymousSessionRequestSchema = import_zod8.z.object({
  browser_fingerprint: import_zod8.z.string().optional()
});
var CreateAnonymousSessionResponseSchema = import_zod8.z.object({
  success: import_zod8.z.boolean(),
  session_token: import_zod8.z.string(),
  session_id: import_zod8.z.string().uuid(),
  expires_at: import_zod8.z.string().datetime(),
  remaining_uploads: import_zod8.z.number().int().min(0),
  message: import_zod8.z.string().optional()
});
var ValidateAnonymousSessionResponseSchema = import_zod8.z.object({
  session_id: import_zod8.z.string().uuid(),
  is_valid: import_zod8.z.boolean(),
  remaining_uploads: import_zod8.z.number().int().min(0),
  rate_limited: import_zod8.z.boolean(),
  session_expires_at: import_zod8.z.string().datetime()
});
var AnonymousCVUploadInitRequestSchema = import_zod8.z.object({
  filename: import_zod8.z.string().min(1).max(255),
  file_size: import_zod8.z.number().int().positive().max(10 * 1024 * 1024),
  // 10MB max
  content_type: import_zod8.z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  file_hash: import_zod8.z.string().length(64)
  // SHA-256 hash
});
var AnonymousCVUploadInitResponseSchema = import_zod8.z.object({
  success: import_zod8.z.boolean(),
  session_id: import_zod8.z.string().uuid(),
  cv_session_id: import_zod8.z.string().uuid(),
  upload_url: import_zod8.z.string().url(),
  expires_at: import_zod8.z.string().datetime(),
  message: import_zod8.z.string().optional()
});
var AnonymousCVProcessingStatusSchema = import_zod8.z.object({
  cv_session_id: import_zod8.z.string().uuid(),
  upload_status: import_zod8.z.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  processing_status: import_zod8.z.enum(["pending", "processing", "completed", "failed"]).nullable(),
  // Progress information
  progress_percentage: import_zod8.z.number().int().min(0).max(100),
  current_stage: import_zod8.z.string(),
  estimated_time_remaining: import_zod8.z.number().int().nullable(),
  // seconds
  // Partial results (limited for anonymous users)
  partial_results: import_zod8.z.object({
    job_title: import_zod8.z.string().optional(),
    experience_level: import_zod8.z.enum(["intern", "junior", "mid", "senior", "lead", "manager"]).optional(),
    key_skills: import_zod8.z.array(import_zod8.z.string()).max(5),
    // Limited to 5 skills for anonymous
    location_preference: import_zod8.z.string().optional(),
    education_level: import_zod8.z.string().optional()
  }).nullable(),
  // Call to action for full results
  full_results_available: import_zod8.z.boolean(),
  registration_required: import_zod8.z.boolean(),
  // Error information
  error_message: import_zod8.z.string().nullable()
});
var SessionCookieConfigSchema = import_zod8.z.object({
  name: import_zod8.z.string(),
  maxAge: import_zod8.z.number().int().positive(),
  // seconds
  httpOnly: import_zod8.z.boolean(),
  secure: import_zod8.z.boolean(),
  sameSite: import_zod8.z.enum(["strict", "lax", "none"]),
  domain: import_zod8.z.string().optional(),
  path: import_zod8.z.string()
});
var RateLimitConfigSchema = import_zod8.z.object({
  max_uploads_per_session: import_zod8.z.number().int().positive(),
  max_api_calls_per_hour: import_zod8.z.number().int().positive(),
  upload_window_minutes: import_zod8.z.number().int().positive(),
  block_duration_minutes: import_zod8.z.number().int().positive(),
  cleanup_interval_minutes: import_zod8.z.number().int().positive()
});
var SecurityConfigSchema = import_zod8.z.object({
  require_ip_consistency: import_zod8.z.boolean(),
  require_user_agent_consistency: import_zod8.z.boolean(),
  enable_browser_fingerprinting: import_zod8.z.boolean(),
  max_session_lifetime_minutes: import_zod8.z.number().int().positive(),
  enable_cleanup_job: import_zod8.z.boolean()
});
var AnonymousSessionErrorCodes = {
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  SESSION_RATE_LIMITED: "SESSION_RATE_LIMITED",
  SESSION_BLOCKED: "SESSION_BLOCKED",
  INVALID_SESSION_TOKEN: "INVALID_SESSION_TOKEN",
  SECURITY_VIOLATION: "SECURITY_VIOLATION",
  UPLOAD_LIMIT_EXCEEDED: "UPLOAD_LIMIT_EXCEEDED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  PROCESSING_FAILED: "PROCESSING_FAILED"
};
var AnonymousSessionErrorSchema = import_zod8.z.object({
  code: import_zod8.z.enum([
    "SESSION_EXPIRED",
    "SESSION_NOT_FOUND",
    "SESSION_RATE_LIMITED",
    "SESSION_BLOCKED",
    "INVALID_SESSION_TOKEN",
    "SECURITY_VIOLATION",
    "UPLOAD_LIMIT_EXCEEDED",
    "FILE_TOO_LARGE",
    "INVALID_FILE_TYPE",
    "PROCESSING_FAILED"
  ]),
  message: import_zod8.z.string(),
  details: import_zod8.z.record(import_zod8.z.unknown()).optional(),
  retry_after: import_zod8.z.number().int().optional()
  // seconds until retry allowed
});
var ANONYMOUS_SESSION_CONSTANTS = {
  // Session Configuration
  SESSION_LIFETIME_MINUTES: 60,
  CV_SESSION_LIFETIME_HOURS: 2,
  SESSION_COOKIE_NAME: "cledger_anonymous_session",
  // Rate Limiting
  MAX_UPLOADS_PER_SESSION: 3,
  MAX_API_CALLS_PER_HOUR: 100,
  RATE_LIMIT_WINDOW_MINUTES: 60,
  BLOCK_DURATION_MINUTES: 30,
  // File Limits
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  // 10MB
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  // Security
  SESSION_TOKEN_LENGTH: 32,
  // bytes (256 bits)
  CLEANUP_INTERVAL_MINUTES: 15,
  // Partial Results Limits
  MAX_SKILLS_SHOWN: 5,
  MAX_EXPERIENCE_DETAIL: "basic"
  // vs 'detailed' for registered users
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ANONYMOUS_CV_CONSTRAINTS,
  ANONYMOUS_SESSION_CONSTANTS,
  AdminBatchEnrichmentRequestSchema,
  AdminEnrichmentStatsSchema,
  Agent,
  AgentCapability,
  AgentConversation,
  AgentResponse,
  AnonymousCVMigrationSchema,
  AnonymousCVProcessingRequestSchema,
  AnonymousCVProcessingStatusSchema,
  AnonymousCVResultSchema,
  AnonymousCVSessionSchema,
  AnonymousCVUploadInitRequestSchema,
  AnonymousCVUploadInitResponseSchema,
  AnonymousSessionErrorCodes,
  AnonymousSessionErrorSchema,
  AnonymousSessionRateLimitSchema,
  AnonymousSessionSchema,
  AppRoleEnum,
  AppUserSchema,
  BatchCreateRequestSchema,
  BatchSchema,
  BatchStatusEnum,
  CEFRLevelEnum,
  CVAIExtractionSchema,
  CVDegreeSchema,
  CVDocumentSchema,
  CVEmbeddingContextSchema,
  CVEmbeddingSchema,
  CVEnrichmentSchema,
  CVExperienceSchema,
  CVJobMatchSchema,
  CVLanguageSchema,
  CVMigrationRequestSchema,
  CVParseStatusEnum,
  CVProcessStatusResponseSchema,
  CVProcessingErrorSchema,
  CVProcessingMetricSchema,
  CVProcessingProgressSchema,
  CVProcessingQueueSchema,
  CVProcessingStageSchema,
  CVSkillSchema,
  CVUploadInitRequestSchema,
  CVUploadInitResponseSchema,
  CVUploadRequestSchema,
  CVUploadSessionSchema,
  CVValidationResultSchema,
  CV_CONSTRAINTS,
  CV_PROCESSING_PRIORITIES,
  CV_PROCESSING_STAGES,
  CV_UPLOAD_STATUS,
  CV_VALIDATION_TYPES,
  CandidateProfileSchema,
  CapabilitiesResponse,
  CompanySchema,
  ConfidenceScoreSchema,
  ConfidenceScoresSchema,
  ContractTypeEnum,
  ConversationStatus,
  CreateAnonymousSessionRequestSchema,
  CreateAnonymousSessionResponseSchema,
  DegreeClassificationSchema,
  DegreeRequirementSchema,
  DelegateTaskRequest,
  EnrichedLanguageSchema,
  EnrichedSkillSchema,
  EnrichmentHistoryItemSchema,
  EnrichmentHistoryResponseSchema,
  EnrichmentRequestSchema,
  EnrichmentResponseSchema,
  ErrorResponseSchema,
  IngestOffersRequestSchema,
  InvokeAgentRequest,
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
  PartialCVResultsResponseSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  Priority,
  RateLimitConfigSchema,
  RegistrationSchema,
  SSEEventSchema,
  SSEEventTypeEnum,
  SearchOffersRequestSchema,
  SecurityConfigSchema,
  SeniorityLevelEnum,
  SessionCookieConfigSchema,
  SessionDetectionResponseSchema,
  SessionSchema,
  SkillCategoryEnum,
  SkillExtractionSchema,
  SkillSchema,
  SortOrderEnum,
  SuccessResponseSchema,
  TaskType,
  ValidateAnonymousSessionResponseSchema,
  WorkModeEnum,
  canAgentInvoke,
  getAgentByCapability,
  getAgentsByTaskType
});
