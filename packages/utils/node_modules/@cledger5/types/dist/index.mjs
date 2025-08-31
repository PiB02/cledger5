// src/offers.ts
import { z } from "zod";
var ContractTypeEnum = z.enum(["CDI", "CDD", "INTERIM", "APP", "PRO", "STAGE"]);
var WorkModeEnum = z.enum(["onsite", "remote", "hybrid", "unknown"]);
var SeniorityLevelEnum = z.enum(["intern", "junior", "mid", "senior", "lead", "manager"]);
var OfferStatusEnum = z.enum(["active", "expired", "suspended"]);
var CEFRLevelEnum = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
var OfferSourceEnum = z.enum(["lba", "france_travail"]);
var LanguageRequirementSchema = z.object({
  code: z.string().length(2),
  level: CEFRLevelEnum,
  required: z.boolean().default(false)
});
var SkillSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(1),
  required: z.boolean(),
  years: z.number().optional()
});
var OfferSchema = z.object({
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
  salary_period: z.enum(["hour", "day", "month", "year"]).optional(),
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
});
var ConfidenceScoreSchema = z.object({
  skills: z.number().min(0).max(1),
  seniority: z.number().min(0).max(1),
  languages: z.number().min(0).max(1),
  degrees: z.number().min(0).max(1),
  global: z.number().min(0).max(1)
});
var SkillCategoryEnum = z.enum(["technical", "business", "soft", "language", "certification"]);
var EnrichedSkillSchema = z.object({
  name: z.string().min(1),
  normalized_name: z.string().min(1),
  // lowercase, no accents
  category: SkillCategoryEnum,
  confidence: z.number().min(0).max(1),
  required: z.boolean().default(false),
  years_required: z.number().optional(),
  source: z.enum(["extracted", "existing", "inferred"]).default("extracted")
});
var EnrichedLanguageSchema = z.object({
  code: z.string().length(2),
  // ISO 639-1 (fr, en, de, etc.)
  name: z.string(),
  // français, english, deutsch
  level: CEFRLevelEnum,
  confidence: z.number().min(0).max(1),
  required: z.boolean().default(false),
  context: z.enum(["professional", "client", "technical", "general"]).optional()
});
var DegreeClassificationSchema = z.object({
  level_eqf: z.number().min(1).max(8),
  // European Qualifications Framework
  degree_type: z.string().optional(),
  // "Master", "Licence", "BTS", etc.
  field_of_study: z.string().optional(),
  // "Informatique", "Commerce", etc.
  confidence: z.number().min(0).max(1),
  source_text: z.string().optional()
  // original text matched
});
var OfferEnrichmentSchema = z.object({
  id: z.string().uuid().optional(),
  // Primary key
  offer_id: z.string().uuid(),
  // Processing status and metadata
  enrichment_status: z.enum(["pending", "processing", "completed", "failed", "low_confidence"]).default("pending"),
  enrichment_version: z.string().default("1.0"),
  // For schema evolution
  model_used: z.string().default("gpt-4o-mini"),
  // AI model version
  // Core AI extractions
  skills_required: z.array(EnrichedSkillSchema).default([]),
  skills_preferred: z.array(EnrichedSkillSchema).default([]),
  seniority_level: SeniorityLevelEnum.optional(),
  languages_detected: z.array(EnrichedLanguageSchema).default([]),
  degree_requirements: z.array(DegreeClassificationSchema).default([]),
  // Confidence scoring (≥0.80 required for validation)
  confidence_scores: ConfidenceScoreSchema.optional(),
  // Additional context and metadata
  rome_codes_suggested: z.array(z.string()).default([]),
  // AI-suggested ROME codes
  job_category_detected: z.string().optional(),
  // Broad category detection
  company_size_indicators: z.array(z.string()).default([]),
  // "startup", "multinational", etc.
  // Processing info and error handling
  tokens_used: z.number().optional(),
  // For cost tracking
  processing_time_ms: z.number().optional(),
  // Performance monitoring
  error_message: z.string().optional(),
  retry_count: z.number().default(0),
  // Timestamps
  created_at: z.string().optional(),
  processed_at: z.string().optional(),
  updated_at: z.string().optional()
});
var OfferEmbeddingSchema = z.object({
  offer_id: z.string().uuid(),
  kind: z.enum(["semantic", "skills"]).default("semantic"),
  embedding: z.array(z.number()),
  text_used: z.string(),
  text_used_hash: z.string(),
  created_at: z.string()
});

// src/candidates.ts
import { z as z2 } from "zod";
var CVDocumentSchema = z2.object({
  id: z2.string().uuid(),
  app_user_id: z2.string().uuid(),
  file_name: z2.string(),
  file_path: z2.string(),
  file_size: z2.number(),
  mime_type: z2.string(),
  upload_at: z2.string(),
  delete_after_date: z2.string(),
  // RGPD: +6 months
  is_current: z2.boolean().default(true)
});
var CVParseStatusEnum = z2.enum(["pending", "processing", "ok", "error"]);
var CandidateProfileSchema = z2.object({
  app_user_id: z2.string().uuid(),
  profile_title: z2.string(),
  profile_summary: z2.string().optional(),
  years_experience: z2.number().min(0).optional(),
  seniority_level: SeniorityLevelEnum.optional(),
  location_id: z2.string().uuid().optional(),
  work_mode_preference: WorkModeEnum.optional(),
  contract_type_preference: ContractTypeEnum.optional(),
  availability: z2.enum(["immediately", "within_month", "within_3_months", "later"]).optional(),
  availability_date: z2.string().optional(),
  salary_expectation_min: z2.number().optional(),
  salary_expectation_max: z2.number().optional(),
  is_public: z2.boolean().default(false),
  created_at: z2.string(),
  updated_at: z2.string()
});
var CVSkillSchema = z2.object({
  app_user_id: z2.string().uuid(),
  skill_name: z2.string(),
  confidence: z2.number().min(0).max(1),
  years_experience: z2.number().optional(),
  level: z2.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  source: z2.enum(["extracted", "manual"]).default("extracted")
});
var CVLanguageSchema = z2.object({
  app_user_id: z2.string().uuid(),
  language_code: z2.string().length(2),
  cefr_level: z2.number().min(1).max(6),
  // 1=A1, 6=C2
  confidence: z2.number().min(0).max(1)
});
var CVDegreeSchema = z2.object({
  app_user_id: z2.string().uuid(),
  degree_name: z2.string(),
  field_of_study: z2.string().optional(),
  institution: z2.string().optional(),
  eqf_level: z2.number().min(1).max(8).optional(),
  start_year: z2.number().optional(),
  end_year: z2.number().optional(),
  is_completed: z2.boolean().default(true)
});
var CVExperienceSchema = z2.object({
  app_user_id: z2.string().uuid(),
  job_title: z2.string(),
  company_name: z2.string().optional(),
  description: z2.string().optional(),
  start_date: z2.string().optional(),
  end_date: z2.string().optional(),
  is_current: z2.boolean().default(false),
  rome_codes: z2.array(z2.string()).optional(),
  skills_used: z2.array(z2.string()).optional()
});
var CVEnrichmentSchema = z2.object({
  app_user_id: z2.string().uuid(),
  parse_status: CVParseStatusEnum,
  profile_title_canonical: z2.string().optional(),
  rome_codes_extracted: z2.array(z2.string()).optional(),
  skills_extracted: z2.array(SkillSchema).optional(),
  languages_extracted: z2.array(LanguageRequirementSchema).optional(),
  seniority_detected: SeniorityLevelEnum.optional(),
  years_experience_detected: z2.number().optional(),
  confidence_scores: z2.record(z2.number()).optional(),
  error_message: z2.string().optional(),
  processed_at: z2.string().optional()
});
var CVEmbeddingSchema = z2.object({
  app_user_id: z2.string().uuid(),
  kind: z2.enum(["semantic", "skills"]).default("semantic"),
  embedding: z2.array(z2.number()),
  text_used: z2.string(),
  text_used_hash: z2.string(),
  created_at: z2.string()
});

// src/auth.ts
import { z as z3 } from "zod";
var AppRoleEnum = z3.enum(["candidate", "recruiter", "admin"]);
var AppUserSchema = z3.object({
  id: z3.string().uuid(),
  email: z3.string().email(),
  role: AppRoleEnum,
  email_verified_at: z3.string().optional(),
  is_active: z3.boolean().default(true),
  first_name: z3.string().optional(),
  last_name: z3.string().optional(),
  phone: z3.string().optional(),
  created_at: z3.string(),
  updated_at: z3.string()
});
var LoginSchema = z3.object({
  email: z3.string().email(),
  password: z3.string().min(8)
});
var RegistrationSchema = z3.object({
  email: z3.string().email(),
  password: z3.string().min(8).regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule").regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre").regex(/[!@#$%^&*()]/, "Le mot de passe doit contenir au moins un caract\xE8re sp\xE9cial"),
  role: AppRoleEnum.default("candidate"),
  first_name: z3.string().optional(),
  last_name: z3.string().optional()
});
var PasswordResetRequestSchema = z3.object({
  email: z3.string().email()
});
var PasswordResetSchema = z3.object({
  token: z3.string(),
  password: z3.string().min(8).regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule").regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre").regex(/[!@#$%^&*()]/, "Le mot de passe doit contenir au moins un caract\xE8re sp\xE9cial")
});
var SessionSchema = z3.object({
  user: AppUserSchema,
  access_token: z3.string(),
  refresh_token: z3.string().optional(),
  expires_at: z3.string()
});

// src/common.ts
import { z as z4 } from "zod";
var PaginationSchema = z4.object({
  page: z4.number().min(1).default(1),
  limit: z4.number().min(1).max(100).default(20),
  total: z4.number().optional(),
  totalPages: z4.number().optional()
});
var SortOrderEnum = z4.enum(["asc", "desc"]);
var LocationSchema = z4.object({
  id: z4.string().uuid(),
  city: z4.string(),
  postal_code: z4.string().optional(),
  department_code: z4.string().optional(),
  department_name: z4.string().optional(),
  region_code: z4.string().optional(),
  region_name: z4.string().optional(),
  country_code: z4.string().default("FR"),
  latitude: z4.number().optional(),
  longitude: z4.number().optional()
});
var CompanySchema = z4.object({
  id: z4.string().uuid(),
  name: z4.string(),
  siret: z4.string().optional(),
  naf_code: z4.string().optional(),
  size: z4.enum(["1-9", "10-49", "50-249", "250-999", "1000+"]).optional(),
  description: z4.string().optional(),
  website: z4.string().url().optional(),
  created_at: z4.string(),
  updated_at: z4.string()
});
var ErrorResponseSchema = z4.object({
  error: z4.string(),
  message: z4.string(),
  code: z4.string().optional(),
  details: z4.record(z4.any()).optional()
});
var SuccessResponseSchema = z4.object({
  success: z4.boolean(),
  message: z4.string().optional(),
  data: z4.any().optional()
});
var BatchStatusEnum = z4.enum(["pending", "running", "completed", "failed", "cancelled"]);
var BatchSchema = z4.object({
  id: z4.string().uuid(),
  name: z4.string(),
  type: z4.enum(["offers_ingest", "cv_parsing", "embeddings_update"]),
  status: BatchStatusEnum,
  filters: z4.record(z4.any()).optional(),
  total_items: z4.number().optional(),
  processed_items: z4.number().default(0),
  failed_items: z4.number().default(0),
  estimated_cost: z4.number().optional(),
  estimated_duration_seconds: z4.number().optional(),
  started_at: z4.string().optional(),
  completed_at: z4.string().optional(),
  error_message: z4.string().optional(),
  created_by: z4.string().uuid(),
  created_at: z4.string()
});

// src/api.ts
import { z as z5 } from "zod";
var SearchOffersRequestSchema = z5.object({
  query: z5.string().optional(),
  rome_codes: z5.array(z5.string()).optional(),
  location: z5.string().optional(),
  radius_km: z5.number().min(1).max(500).optional(),
  contract_types: z5.array(ContractTypeEnum).optional(),
  work_modes: z5.array(WorkModeEnum).optional(),
  salary_min: z5.number().optional(),
  alternance: z5.boolean().optional(),
  sort_by: z5.enum(["relevance", "date", "salary"]).default("relevance"),
  sort_order: SortOrderEnum.default("desc"),
  page: z5.number().min(1).default(1),
  limit: z5.number().min(1).max(100).default(20)
});
var IngestOffersRequestSchema = z5.object({
  source: OfferSourceEnum,
  filters: z5.record(z5.any()).optional(),
  limit: z5.number().min(1).max(1e3).optional(),
  dry_run: z5.boolean().default(false)
});
var CVUploadRequestSchema = z5.object({
  file_name: z5.string(),
  mime_type: z5.enum(["application/pdf"]),
  file_size: z5.number().max(10 * 1024 * 1024)
  // 10MB max
});
var MatchRequestSchema = z5.object({
  app_user_id: z5.string().uuid(),
  limit: z5.number().min(1).max(100).default(20),
  min_score: z5.number().min(0).max(1).default(0.5),
  include_explanations: z5.boolean().default(true)
});
var MatchResultSchema = z5.object({
  offer_id: z5.string().uuid(),
  score: z5.number().min(0).max(1),
  score_components: z5.object({
    semantic_similarity: z5.number(),
    skills_overlap: z5.number(),
    location_match: z5.number()
  }).optional(),
  explanations: z5.object({
    matched_skills: z5.array(z5.string()),
    missing_skills: z5.array(z5.string()),
    gating_reasons: z5.array(z5.string()),
    distance_km: z5.number().optional()
  }).optional()
});
var BatchCreateRequestSchema = z5.object({
  name: z5.string(),
  type: z5.enum(["offers_ingest", "cv_parsing", "embeddings_update"]),
  filters: z5.record(z5.any()).optional(),
  options: z5.object({
    concurrency: z5.number().min(1).max(10).default(3),
    retry_count: z5.number().min(0).max(5).default(2),
    dry_run: z5.boolean().default(false)
  }).optional()
});
var SSEEventTypeEnum = z5.enum([
  "batch_started",
  "batch_progress",
  "batch_item_processed",
  "batch_item_failed",
  "batch_completed",
  "batch_failed",
  "batch_cancelled"
]);
var SSEEventSchema = z5.object({
  type: SSEEventTypeEnum,
  data: z5.any(),
  timestamp: z5.string()
});
var SkillExtractionSchema = z5.object({
  name: z5.string(),
  normalized_name: z5.string(),
  category: z5.enum(["technical", "soft", "domain", "tool", "language"]),
  confidence: z5.number().min(0).max(1),
  required: z5.boolean()
});
var LanguageDetectionSchema = z5.object({
  code: z5.string().length(2),
  name: z5.string(),
  level: z5.enum(["A1", "A2", "B1", "B2", "C1", "C2", "native"]).optional(),
  confidence: z5.number().min(0).max(1),
  required: z5.boolean()
});
var DegreeRequirementSchema = z5.object({
  level_eqf: z5.number().min(1).max(8),
  degree_type: z5.string(),
  confidence: z5.number().min(0).max(1)
});
var ConfidenceScoresSchema = z5.object({
  skills: z5.number().min(0).max(1),
  seniority: z5.number().min(0).max(1),
  languages: z5.number().min(0).max(1),
  degrees: z5.number().min(0).max(1),
  global: z5.number().min(0).max(1)
});
var EnrichmentRequestSchema = z5.object({
  offer_ids: z5.array(z5.string().uuid()).min(1).max(100),
  confidence_threshold: z5.number().min(0).max(1).default(0.8),
  force_reprocess: z5.boolean().default(false),
  include_low_confidence: z5.boolean().default(false)
});
var EnrichmentResponseSchema = z5.object({
  success: z5.boolean(),
  processed_count: z5.number(),
  enrichments: z5.array(z5.object({
    id: z5.string().uuid(),
    offer_id: z5.string().uuid(),
    skills_required: z5.array(SkillExtractionSchema),
    skills_preferred: z5.array(SkillExtractionSchema),
    seniority_level: z5.enum(["intern", "junior", "mid", "senior", "lead", "manager"]).optional(),
    languages_detected: z5.array(LanguageDetectionSchema),
    degree_requirements: z5.array(DegreeRequirementSchema),
    confidence_scores: ConfidenceScoresSchema,
    enrichment_status: z5.enum(["completed", "low_confidence", "failed"]),
    processed_at: z5.string()
  })),
  errors: z5.array(z5.object({
    offer_id: z5.string().uuid(),
    error: z5.string(),
    retryable: z5.boolean()
  })),
  cost_estimate: z5.object({
    tokens_used: z5.number(),
    estimated_cost_usd: z5.number()
  }),
  processing_stats: z5.object({
    total_time_ms: z5.number(),
    avg_confidence: z5.number(),
    success_rate: z5.number()
  })
});
var AdminEnrichmentStatsSchema = z5.object({
  overview: z5.object({
    total_offers: z5.number(),
    enriched_offers: z5.number(),
    enrichment_rate: z5.number(),
    avg_confidence: z5.number()
  }),
  status_breakdown: z5.object({
    completed: z5.number(),
    processing: z5.number(),
    failed: z5.number(),
    low_confidence: z5.number()
  }),
  cost_tracking: z5.object({
    total_tokens_used: z5.number(),
    total_cost_usd: z5.number(),
    avg_cost_per_offer: z5.number(),
    monthly_budget_used: z5.number()
  }),
  performance_metrics: z5.object({
    avg_processing_time_ms: z5.number(),
    success_rate_24h: z5.number(),
    latest_batch_id: z5.string().optional(),
    active_batches: z5.number()
  }),
  skill_categories: z5.array(z5.object({
    category: z5.string(),
    count: z5.number(),
    confidence_avg: z5.number()
  }))
});
var EnrichmentHistoryItemSchema = z5.object({
  id: z5.string().uuid(),
  batch_id: z5.string().uuid().optional(),
  offer_id: z5.string().uuid(),
  offer_title: z5.string(),
  enrichment_status: z5.enum(["completed", "processing", "failed", "low_confidence"]),
  confidence_scores: ConfidenceScoresSchema.optional(),
  skills_count: z5.number(),
  tokens_used: z5.number(),
  processing_time_ms: z5.number(),
  error_message: z5.string().optional(),
  processed_at: z5.string(),
  created_at: z5.string()
});
var EnrichmentHistoryResponseSchema = z5.object({
  success: z5.boolean(),
  history: z5.array(EnrichmentHistoryItemSchema),
  pagination: z5.object({
    total: z5.number(),
    page: z5.number(),
    limit: z5.number(),
    total_pages: z5.number()
  })
});
var AdminBatchEnrichmentRequestSchema = z5.object({
  filters: z5.object({
    rome_codes: z5.array(z5.string()).optional(),
    source: z5.enum(["LBA", "FT"]).optional(),
    created_after: z5.string().optional(),
    not_enriched_only: z5.boolean().default(true)
  }).optional(),
  batch_size: z5.number().min(1).max(500).default(100),
  confidence_threshold: z5.number().min(0).max(1).default(0.8),
  priority: z5.enum(["low", "normal", "high"]).default("normal")
});
export {
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
};
