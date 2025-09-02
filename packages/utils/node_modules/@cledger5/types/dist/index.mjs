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

// src/agents.ts
import { z as z6 } from "zod";
var AgentCapability = z6.enum([
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
var TaskType = z6.enum([
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
var ConversationStatus = z6.enum([
  "pending",
  "in_progress",
  "completed",
  "failed",
  "escalated"
]);
var Priority = z6.number().int().min(1).max(5);
var Agent = z6.object({
  id: z6.string(),
  name: z6.string(),
  role: z6.string(),
  capabilities: z6.array(AgentCapability),
  system_prompt: z6.string(),
  hierarchy_level: z6.number().int().min(1).max(5),
  can_invoke: z6.array(z6.string()),
  created_at: z6.union([z6.string().datetime(), z6.string()]).optional(),
  updated_at: z6.union([z6.string().datetime(), z6.string()]).optional()
});
var AgentConversation = z6.object({
  id: z6.string().uuid(),
  from_agent: z6.string(),
  to_agent: z6.string(),
  task_type: TaskType,
  task_description: z6.string(),
  request_data: z6.record(z6.any()),
  response_data: z6.record(z6.any()).optional(),
  status: ConversationStatus,
  priority: Priority,
  created_at: z6.string().datetime(),
  started_at: z6.string().datetime().optional(),
  completed_at: z6.string().datetime().optional(),
  error_message: z6.string().optional()
});
var InvokeAgentRequest = z6.object({
  target_agent: z6.string(),
  task_type: TaskType,
  task_description: z6.string(),
  request_data: z6.record(z6.any()),
  priority: Priority.optional().default(3)
});
var DelegateTaskRequest = z6.object({
  task_description: z6.string(),
  context: z6.record(z6.any()),
  priority: Priority.optional().default(3),
  preferred_agent: z6.string().optional()
});
var AgentResponse = z6.object({
  success: z6.boolean(),
  data: z6.record(z6.any()).optional(),
  error: z6.string().optional(),
  agent_id: z6.string(),
  conversation_id: z6.string().uuid(),
  execution_time_ms: z6.number().optional()
});
var CapabilitiesResponse = z6.object({
  agents: z6.array(Agent),
  total_count: z6.number()
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
import { z as z7 } from "zod";
var CVUploadSessionSchema = z7.object({
  id: z7.string().uuid(),
  user_id: z7.string().uuid().nullable(),
  // Made nullable for anonymous sessions
  anonymous_session_id: z7.string().uuid().nullable(),
  // New: for anonymous sessions
  filename: z7.string().max(500),
  file_size_bytes: z7.number().int().min(0),
  file_hash: z7.string().length(64),
  // SHA256 hash
  upload_status: z7.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  storage_path: z7.string().nullable(),
  processing_started_at: z7.string().datetime().nullable(),
  processing_completed_at: z7.string().datetime().nullable(),
  error_message: z7.string().nullable(),
  metadata: z7.record(z7.unknown()).default({}),
  // New Phase 2 fields
  session_type: z7.enum(["authenticated", "anonymous"]).default("authenticated"),
  partial_results_shown: z7.boolean().default(false),
  full_access_available: z7.boolean().default(false),
  conversion_attempted: z7.boolean().default(false),
  converted_user_id: z7.string().uuid().nullable(),
  created_at: z7.string().datetime(),
  updated_at: z7.string().datetime()
});
var CVProcessingQueueSchema = z7.object({
  id: z7.string().uuid(),
  upload_session_id: z7.string().uuid(),
  queue_status: z7.enum(["pending", "processing", "completed", "failed", "retry"]),
  priority: z7.number().int().min(1).max(10).default(5),
  retry_count: z7.number().int().min(0).default(0),
  max_retries: z7.number().int().min(0).default(3),
  processing_started_at: z7.string().datetime().nullable(),
  processing_completed_at: z7.string().datetime().nullable(),
  worker_id: z7.string().max(100).nullable(),
  error_message: z7.string().nullable(),
  stage_details: z7.record(z7.unknown()).default({}),
  created_at: z7.string().datetime(),
  updated_at: z7.string().datetime()
});
var CVValidationResultSchema = z7.object({
  id: z7.string().uuid(),
  upload_session_id: z7.string().uuid(),
  validation_type: z7.enum(["format", "content", "security", "quality"]),
  validation_status: z7.enum(["passed", "failed", "warning"]),
  validation_score: z7.number().min(0).max(1).nullable(),
  validation_details: z7.record(z7.unknown()).default({}),
  validation_errors: z7.array(z7.string()).default([]),
  created_at: z7.string().datetime()
});
var CVProcessingMetricSchema = z7.object({
  id: z7.string().uuid(),
  upload_session_id: z7.string().uuid(),
  metric_type: z7.enum(["processing_time", "api_cost", "extraction_accuracy", "tokens_used"]),
  metric_value: z7.number(),
  metric_unit: z7.enum(["seconds", "dollars", "percentage", "tokens"]).nullable(),
  processing_stage: z7.enum(["text_extraction", "ai_parsing", "embedding_generation", "total"]).nullable(),
  metadata: z7.record(z7.unknown()).default({}),
  created_at: z7.string().datetime()
});
var CVEmbeddingContextSchema = z7.object({
  profile_title: z7.string(),
  rome_codes: z7.array(z7.string()),
  location: z7.object({
    city: z7.string(),
    department_code: z7.string(),
    region_code: z7.string(),
    country: z7.string().default("FR")
  }),
  seniority_level: z7.enum(["intern", "junior", "mid", "senior", "lead", "manager"]),
  contract_preferences: z7.array(z7.enum(["CDI", "CDD", "APP", "PRO", "INTERIM", "STAGE", "FLEXIBLE"])),
  work_mode_preferences: z7.array(z7.enum(["onsite", "remote", "hybrid", "flexible"])),
  languages: z7.array(z7.object({
    code: z7.string().length(2),
    cefr_level: z7.number().int().min(1).max(6),
    confidence: z7.number().min(0).max(1)
  })),
  degree_eqf_top: z7.number().int().min(1).max(8).nullable(),
  skills_mastered: z7.array(z7.object({
    name: z7.string(),
    normalized_name: z7.string(),
    years_experience: z7.number().min(0).nullable(),
    confidence: z7.number().min(0).max(1)
  })),
  skills_learning: z7.array(z7.object({
    name: z7.string(),
    normalized_name: z7.string(),
    confidence: z7.number().min(0).max(1)
  })),
  salary_expectation: z7.object({
    min: z7.number().int().min(0),
    max: z7.number().int().min(0),
    period: z7.enum(["annual", "monthly", "daily"]),
    currency: z7.string().default("EUR")
  }).nullable(),
  availability: z7.string().nullable()
  // Format: 'YYYY-MM' or 'ASAP'
});
var CVAIExtractionSchema = z7.object({
  profile: z7.object({
    title_canonical: z7.string(),
    location_preferred: z7.object({
      city: z7.string(),
      department_code: z7.string(),
      region_code: z7.string()
    }),
    availability: z7.string().nullable(),
    seniority_level: z7.enum(["intern", "junior", "mid", "senior", "lead", "manager"])
  }),
  skills_mastered: z7.array(z7.object({
    name: z7.string(),
    normalized_name: z7.string(),
    years_experience: z7.number().min(0).nullable(),
    confidence: z7.number().min(0).max(1)
  })),
  skills_learning: z7.array(z7.object({
    name: z7.string(),
    normalized_name: z7.string(),
    confidence: z7.number().min(0).max(1)
  })),
  experience: z7.object({
    total_years: z7.number().min(0),
    rome_codes_detected: z7.array(z7.string()),
    previous_roles: z7.array(z7.object({
      title: z7.string(),
      duration_months: z7.number().int().min(0),
      company: z7.string(),
      responsibilities: z7.array(z7.string()).optional()
    }))
  }),
  education: z7.object({
    highest_degree: z7.object({
      level_eqf: z7.number().int().min(1).max(8),
      degree_type: z7.string(),
      confidence: z7.number().min(0).max(1)
    }).nullable()
  }),
  languages: z7.array(z7.object({
    code: z7.string().length(2),
    cefr_level: z7.number().int().min(1).max(6),
    confidence: z7.number().min(0).max(1)
  })),
  preferences: z7.object({
    contract_types: z7.array(z7.enum(["CDI", "CDD", "APP", "PRO", "INTERIM", "STAGE"])),
    work_modes: z7.array(z7.enum(["onsite", "remote", "hybrid"])),
    salary_expectation: z7.object({
      min: z7.number().int().min(0),
      max: z7.number().int().min(0),
      period: z7.enum(["annual", "monthly"])
    }).nullable()
  }),
  confidence_scores: z7.object({
    profile: z7.number().min(0).max(1),
    skills: z7.number().min(0).max(1),
    experience: z7.number().min(0).max(1),
    education: z7.number().min(0).max(1),
    global: z7.number().min(0).max(1)
  })
});
var CVUploadInitRequestSchema = z7.object({
  filename: z7.string().min(1).max(500),
  file_size: z7.number().int().min(1).max(10 * 1024 * 1024),
  // 10MB max
  file_hash: z7.string().length(64),
  // SHA256
  content_type: z7.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"])
});
var CVUploadInitResponseSchema = z7.object({
  session_id: z7.string().uuid(),
  upload_url: z7.string().url(),
  success: z7.boolean(),
  message: z7.string().optional()
});
var CVProcessStatusResponseSchema = z7.object({
  session_id: z7.string().uuid(),
  status: z7.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  progress_percentage: z7.number().min(0).max(100),
  current_stage: z7.string().optional(),
  estimated_time_remaining: z7.number().nullable(),
  // seconds
  error_message: z7.string().nullable(),
  validation_results: z7.array(CVValidationResultSchema).optional(),
  processing_metrics: z7.array(CVProcessingMetricSchema).optional()
});
var CVProcessingStageSchema = z7.object({
  stage_name: z7.string(),
  stage_order: z7.number().int().min(1),
  status: z7.enum(["pending", "processing", "completed", "failed", "skipped"]),
  progress_percentage: z7.number().min(0).max(100),
  started_at: z7.string().datetime().nullable(),
  completed_at: z7.string().datetime().nullable(),
  duration_ms: z7.number().int().min(0).nullable(),
  error_message: z7.string().nullable(),
  stage_data: z7.record(z7.unknown()).default({})
});
var CVProcessingProgressSchema = z7.object({
  session_id: z7.string().uuid(),
  overall_status: z7.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  overall_progress: z7.number().min(0).max(100),
  estimated_completion: z7.string().datetime().nullable(),
  stages: z7.array(CVProcessingStageSchema),
  quality_score: z7.number().min(0).max(1).nullable(),
  cost_estimate: z7.number().min(0).nullable()
  // in dollars
});
var CVJobMatchSchema = z7.object({
  offer_id: z7.string(),
  match_score: z7.number().min(0).max(1),
  explanation: z7.object({
    semantic_similarity: z7.number().min(0).max(1),
    skills_coverage: z7.number().min(0).max(1),
    seniority_compatibility: z7.number().min(0).max(1),
    location_match: z7.number().min(0).max(1),
    preferences_alignment: z7.number().min(0).max(1),
    reasons: z7.array(z7.string()),
    skill_gaps: z7.array(z7.string())
  }),
  offer_summary: z7.object({
    title: z7.string(),
    company_name: z7.string(),
    location: z7.string(),
    contract_type: z7.string(),
    salary_range: z7.string().nullable()
  })
});
var CVProcessingErrorSchema = z7.object({
  error_code: z7.string(),
  error_message: z7.string(),
  error_details: z7.record(z7.unknown()).optional(),
  session_id: z7.string().uuid().optional(),
  recovery_suggestions: z7.array(z7.string()).optional()
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
var AnonymousCVResultSchema = z7.object({
  id: z7.string().uuid(),
  anonymous_session_id: z7.string().uuid(),
  upload_session_id: z7.string().uuid(),
  // Partial results data (limited information)
  skills_count: z7.number().int().min(0).default(0),
  experience_level: z7.string().nullable(),
  job_matches_count: z7.number().int().min(0).default(0),
  confidence_score: z7.number().min(0).max(1).nullable(),
  // Limited skills preview (max 5 skills)
  skills_preview: z7.array(z7.object({
    name: z7.string(),
    normalized_name: z7.string(),
    confidence: z7.number().min(0).max(1)
  })).default([]),
  // Teaser information to encourage registration
  additional_skills_available: z7.number().int().min(0).default(0),
  detailed_matches_available: z7.number().int().min(0).default(0),
  ai_insights_available: z7.boolean().default(false),
  // Access tracking
  viewed_count: z7.number().int().min(0).default(0),
  last_viewed_at: z7.string().datetime().nullable(),
  // Expiration and cleanup
  created_at: z7.string().datetime(),
  expires_at: z7.string().datetime(),
  // Metadata
  metadata: z7.record(z7.unknown()).default({})
});
var AnonymousCVMigrationSchema = z7.object({
  id: z7.string().uuid(),
  // Source anonymous data
  anonymous_session_id: z7.string().uuid(),
  original_upload_session_id: z7.string().uuid(),
  // Target authenticated data
  new_user_id: z7.string().uuid(),
  new_upload_session_id: z7.string().uuid(),
  new_cv_profile_id: z7.string().uuid().nullable(),
  // Migration details
  migration_status: z7.enum(["pending", "completed", "failed"]).default("pending"),
  migrated_data_types: z7.array(z7.enum(["upload_session", "cv_profile", "cv_embeddings", "results"])).default([]),
  // Audit trail
  migration_started_at: z7.string().datetime(),
  migration_completed_at: z7.string().datetime().nullable(),
  error_message: z7.string().nullable(),
  // Metadata
  metadata: z7.record(z7.unknown()).default({})
});
var SessionDetectionResponseSchema = z7.object({
  session_type: z7.enum(["authenticated", "anonymous", "invalid"]),
  user_id: z7.string().uuid().nullable(),
  anonymous_session_id: z7.string().uuid().nullable(),
  session_token: z7.string().nullable(),
  requires_auth: z7.boolean(),
  can_access_cv_processing: z7.boolean(),
  upload_attempts_remaining: z7.number().int().min(0).nullable(),
  session_expires_at: z7.string().datetime().nullable()
});
var PartialCVResultsResponseSchema = z7.object({
  success: z7.boolean(),
  session_id: z7.string().uuid(),
  access_level: z7.enum(["partial", "full"]),
  // Partial data
  summary: z7.object({
    skills_found: z7.number().int().min(0),
    experience_level: z7.string(),
    job_opportunities_estimated: z7.number().int().min(0),
    analysis_confidence: z7.number().min(0).max(1)
  }),
  // Limited preview data
  skills_preview: z7.array(z7.object({
    name: z7.string(),
    confidence: z7.enum(["high", "medium", "low"])
  })).max(5),
  location_detected: z7.object({
    city: z7.string().nullable(),
    region: z7.string().nullable()
  }).nullable(),
  // Upgrade incentives
  full_results_available: z7.object({
    complete_skills_analysis: z7.number().int().min(0),
    detailed_job_matches: z7.number().int().min(0),
    ai_powered_insights: z7.boolean(),
    personalized_recommendations: z7.boolean()
  }),
  // Next steps
  call_to_action: z7.object({
    title: z7.string(),
    description: z7.string(),
    action_url: z7.string(),
    expires_at: z7.string().datetime()
  }),
  // Metadata
  processed_at: z7.string().datetime(),
  expires_at: z7.string().datetime()
});
var AnonymousCVProcessingRequestSchema = z7.object({
  session_token: z7.string().min(16),
  session_id: z7.string().uuid(),
  generate_partial_results: z7.boolean().default(true)
});
var CVMigrationRequestSchema = z7.object({
  anonymous_session_token: z7.string().min(16),
  new_user_id: z7.string().uuid(),
  migrate_all_data: z7.boolean().default(true),
  migrate_data_types: z7.array(z7.enum(["upload_session", "cv_profile", "cv_embeddings", "results"])).optional()
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
import { z as z8 } from "zod";
var AnonymousSessionSchema = z8.object({
  id: z8.string().uuid(),
  session_token: z8.string(),
  // Security and fingerprinting
  client_ip: z8.string(),
  user_agent_hash: z8.string(),
  browser_fingerprint: z8.string().optional(),
  // Session lifecycle
  created_at: z8.string().datetime(),
  last_accessed_at: z8.string().datetime(),
  expires_at: z8.string().datetime(),
  is_active: z8.boolean(),
  // Rate limiting
  upload_attempts: z8.number().int().min(0),
  max_upload_attempts: z8.number().int().min(1),
  // Conversion tracking
  converted_to_user_id: z8.string().uuid().nullable(),
  converted_at: z8.string().datetime().nullable(),
  // Metadata
  security_flags: z8.record(z8.unknown()).optional(),
  metadata: z8.record(z8.unknown()).optional()
});
var AnonymousCVSessionSchema = z8.object({
  id: z8.string().uuid(),
  anonymous_session_id: z8.string().uuid(),
  // File information
  filename: z8.string(),
  file_size_bytes: z8.number().int().positive(),
  file_hash: z8.string(),
  storage_path: z8.string(),
  // Status tracking
  upload_status: z8.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  processing_status: z8.enum(["pending", "processing", "completed", "failed"]).nullable(),
  // Processing lifecycle
  processing_started_at: z8.string().datetime().nullable(),
  processing_completed_at: z8.string().datetime().nullable(),
  // Results (partial for anonymous users)
  partial_results: z8.record(z8.unknown()).nullable(),
  full_results_available: z8.boolean(),
  // Error handling
  error_message: z8.string().nullable(),
  retry_count: z8.number().int().min(0),
  max_retries: z8.number().int().min(0),
  // Timestamps
  created_at: z8.string().datetime(),
  updated_at: z8.string().datetime(),
  expires_at: z8.string().datetime(),
  // Metadata
  metadata: z8.record(z8.unknown()).optional()
});
var AnonymousSessionRateLimitSchema = z8.object({
  id: z8.string().uuid(),
  anonymous_session_id: z8.string().uuid(),
  // Rate limiting window
  window_start: z8.string().datetime(),
  window_duration: z8.string(),
  // PostgreSQL interval
  // Counters
  api_calls_count: z8.number().int().min(0),
  upload_attempts: z8.number().int().min(0),
  // Limits
  max_api_calls: z8.number().int().min(1),
  max_uploads: z8.number().int().min(1),
  // Blocking
  is_blocked: z8.boolean(),
  blocked_until: z8.string().datetime().nullable(),
  block_reason: z8.string().nullable(),
  // Timestamps
  created_at: z8.string().datetime(),
  updated_at: z8.string().datetime()
});
var CreateAnonymousSessionRequestSchema = z8.object({
  browser_fingerprint: z8.string().optional()
});
var CreateAnonymousSessionResponseSchema = z8.object({
  success: z8.boolean(),
  session_token: z8.string(),
  session_id: z8.string().uuid(),
  expires_at: z8.string().datetime(),
  remaining_uploads: z8.number().int().min(0),
  message: z8.string().optional()
});
var ValidateAnonymousSessionResponseSchema = z8.object({
  session_id: z8.string().uuid(),
  is_valid: z8.boolean(),
  remaining_uploads: z8.number().int().min(0),
  rate_limited: z8.boolean(),
  session_expires_at: z8.string().datetime()
});
var AnonymousCVUploadInitRequestSchema = z8.object({
  filename: z8.string().min(1).max(255),
  file_size: z8.number().int().positive().max(10 * 1024 * 1024),
  // 10MB max
  content_type: z8.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  file_hash: z8.string().length(64)
  // SHA-256 hash
});
var AnonymousCVUploadInitResponseSchema = z8.object({
  success: z8.boolean(),
  session_id: z8.string().uuid(),
  cv_session_id: z8.string().uuid(),
  upload_url: z8.string().url(),
  expires_at: z8.string().datetime(),
  message: z8.string().optional()
});
var AnonymousCVProcessingStatusSchema = z8.object({
  cv_session_id: z8.string().uuid(),
  upload_status: z8.enum(["initiated", "uploading", "uploaded", "processing", "completed", "failed"]),
  processing_status: z8.enum(["pending", "processing", "completed", "failed"]).nullable(),
  // Progress information
  progress_percentage: z8.number().int().min(0).max(100),
  current_stage: z8.string(),
  estimated_time_remaining: z8.number().int().nullable(),
  // seconds
  // Partial results (limited for anonymous users)
  partial_results: z8.object({
    job_title: z8.string().optional(),
    experience_level: z8.enum(["intern", "junior", "mid", "senior", "lead", "manager"]).optional(),
    key_skills: z8.array(z8.string()).max(5),
    // Limited to 5 skills for anonymous
    location_preference: z8.string().optional(),
    education_level: z8.string().optional()
  }).nullable(),
  // Call to action for full results
  full_results_available: z8.boolean(),
  registration_required: z8.boolean(),
  // Error information
  error_message: z8.string().nullable()
});
var SessionCookieConfigSchema = z8.object({
  name: z8.string(),
  maxAge: z8.number().int().positive(),
  // seconds
  httpOnly: z8.boolean(),
  secure: z8.boolean(),
  sameSite: z8.enum(["strict", "lax", "none"]),
  domain: z8.string().optional(),
  path: z8.string()
});
var RateLimitConfigSchema = z8.object({
  max_uploads_per_session: z8.number().int().positive(),
  max_api_calls_per_hour: z8.number().int().positive(),
  upload_window_minutes: z8.number().int().positive(),
  block_duration_minutes: z8.number().int().positive(),
  cleanup_interval_minutes: z8.number().int().positive()
});
var SecurityConfigSchema = z8.object({
  require_ip_consistency: z8.boolean(),
  require_user_agent_consistency: z8.boolean(),
  enable_browser_fingerprinting: z8.boolean(),
  max_session_lifetime_minutes: z8.number().int().positive(),
  enable_cleanup_job: z8.boolean()
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
var AnonymousSessionErrorSchema = z8.object({
  code: z8.enum([
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
  message: z8.string(),
  details: z8.record(z8.unknown()).optional(),
  retry_after: z8.number().int().optional()
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
export {
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
};
