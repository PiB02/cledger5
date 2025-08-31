import { z } from 'zod'
import { PaginationSchema, SortOrderEnum } from './common'
import { OfferSourceEnum, WorkModeEnum, ContractTypeEnum } from './offers'

// Search offers request
export const SearchOffersRequestSchema = z.object({
  query: z.string().optional(),
  rome_codes: z.array(z.string()).optional(),
  location: z.string().optional(),
  radius_km: z.number().min(1).max(500).optional(),
  contract_types: z.array(ContractTypeEnum).optional(),
  work_modes: z.array(WorkModeEnum).optional(),
  salary_min: z.number().optional(),
  alternance: z.boolean().optional(),
  sort_by: z.enum(['relevance', 'date', 'salary']).default('relevance'),
  sort_order: SortOrderEnum.default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})
export type SearchOffersRequest = z.infer<typeof SearchOffersRequestSchema>

// Ingest offers request
export const IngestOffersRequestSchema = z.object({
  source: OfferSourceEnum,
  filters: z.record(z.any()).optional(),
  limit: z.number().min(1).max(1000).optional(),
  dry_run: z.boolean().default(false)
})
export type IngestOffersRequest = z.infer<typeof IngestOffersRequestSchema>

// CV upload request
export const CVUploadRequestSchema = z.object({
  file_name: z.string(),
  mime_type: z.enum(['application/pdf']),
  file_size: z.number().max(10 * 1024 * 1024) // 10MB max
})
export type CVUploadRequest = z.infer<typeof CVUploadRequestSchema>

// Match request
export const MatchRequestSchema = z.object({
  app_user_id: z.string().uuid(),
  limit: z.number().min(1).max(100).default(20),
  min_score: z.number().min(0).max(1).default(0.5),
  include_explanations: z.boolean().default(true)
})
export type MatchRequest = z.infer<typeof MatchRequestSchema>

// Match result
export const MatchResultSchema = z.object({
  offer_id: z.string().uuid(),
  score: z.number().min(0).max(1),
  score_components: z.object({
    semantic_similarity: z.number(),
    skills_overlap: z.number(),
    location_match: z.number()
  }).optional(),
  explanations: z.object({
    matched_skills: z.array(z.string()),
    missing_skills: z.array(z.string()),
    gating_reasons: z.array(z.string()),
    distance_km: z.number().optional()
  }).optional()
})
export type MatchResult = z.infer<typeof MatchResultSchema>

// Batch create request
export const BatchCreateRequestSchema = z.object({
  name: z.string(),
  type: z.enum(['offers_ingest', 'cv_parsing', 'embeddings_update']),
  filters: z.record(z.any()).optional(),
  options: z.object({
    concurrency: z.number().min(1).max(10).default(3),
    retry_count: z.number().min(0).max(5).default(2),
    dry_run: z.boolean().default(false)
  }).optional()
})
export type BatchCreateRequest = z.infer<typeof BatchCreateRequestSchema>

// SSE event types
export const SSEEventTypeEnum = z.enum([
  'batch_started',
  'batch_progress',
  'batch_item_processed',
  'batch_item_failed',
  'batch_completed',
  'batch_failed',
  'batch_cancelled'
])
export type SSEEventType = z.infer<typeof SSEEventTypeEnum>

// SSE event
export const SSEEventSchema = z.object({
  type: SSEEventTypeEnum,
  data: z.any(),
  timestamp: z.string()
})
export type SSEEvent = z.infer<typeof SSEEventSchema>

// ===== AI ENRICHMENT SCHEMAS =====

// Skill extraction schema
export const SkillExtractionSchema = z.object({
  name: z.string(),
  normalized_name: z.string(),
  category: z.enum(['technical', 'soft', 'domain', 'tool', 'language']),
  confidence: z.number().min(0).max(1),
  required: z.boolean()
})
export type SkillExtraction = z.infer<typeof SkillExtractionSchema>

// Language detection schema
export const LanguageDetectionSchema = z.object({
  code: z.string().length(2),
  name: z.string(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']).optional(),
  confidence: z.number().min(0).max(1),
  required: z.boolean()
})
export type LanguageDetection = z.infer<typeof LanguageDetectionSchema>

// Degree requirement schema
export const DegreeRequirementSchema = z.object({
  level_eqf: z.number().min(1).max(8),
  degree_type: z.string(),
  confidence: z.number().min(0).max(1)
})
export type DegreeRequirement = z.infer<typeof DegreeRequirementSchema>

// Confidence scores schema
export const ConfidenceScoresSchema = z.object({
  skills: z.number().min(0).max(1),
  seniority: z.number().min(0).max(1),
  languages: z.number().min(0).max(1),
  degrees: z.number().min(0).max(1),
  global: z.number().min(0).max(1)
})
export type ConfidenceScores = z.infer<typeof ConfidenceScoresSchema>

// Enrichment request schema
export const EnrichmentRequestSchema = z.object({
  offer_ids: z.array(z.string().uuid()).min(1).max(100),
  confidence_threshold: z.number().min(0).max(1).default(0.8),
  force_reprocess: z.boolean().default(false),
  include_low_confidence: z.boolean().default(false)
})
export type EnrichmentRequest = z.infer<typeof EnrichmentRequestSchema>

// Enrichment response schema
export const EnrichmentResponseSchema = z.object({
  success: z.boolean(),
  processed_count: z.number(),
  enrichments: z.array(z.object({
    id: z.string().uuid(),
    offer_id: z.string().uuid(),
    skills_required: z.array(SkillExtractionSchema),
    skills_preferred: z.array(SkillExtractionSchema),
    seniority_level: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager']).optional(),
    languages_detected: z.array(LanguageDetectionSchema),
    degree_requirements: z.array(DegreeRequirementSchema),
    confidence_scores: ConfidenceScoresSchema,
    enrichment_status: z.enum(['completed', 'low_confidence', 'failed']),
    processed_at: z.string()
  })),
  errors: z.array(z.object({
    offer_id: z.string().uuid(),
    error: z.string(),
    retryable: z.boolean()
  })),
  cost_estimate: z.object({
    tokens_used: z.number(),
    estimated_cost_usd: z.number()
  }),
  processing_stats: z.object({
    total_time_ms: z.number(),
    avg_confidence: z.number(),
    success_rate: z.number()
  })
})
export type EnrichmentResponse = z.infer<typeof EnrichmentResponseSchema>

// Admin enrichment stats schema
export const AdminEnrichmentStatsSchema = z.object({
  overview: z.object({
    total_offers: z.number(),
    enriched_offers: z.number(),
    enrichment_rate: z.number(),
    avg_confidence: z.number()
  }),
  status_breakdown: z.object({
    completed: z.number(),
    processing: z.number(),
    failed: z.number(),
    low_confidence: z.number()
  }),
  cost_tracking: z.object({
    total_tokens_used: z.number(),
    total_cost_usd: z.number(),
    avg_cost_per_offer: z.number(),
    monthly_budget_used: z.number()
  }),
  performance_metrics: z.object({
    avg_processing_time_ms: z.number(),
    success_rate_24h: z.number(),
    latest_batch_id: z.string().optional(),
    active_batches: z.number()
  }),
  skill_categories: z.array(z.object({
    category: z.string(),
    count: z.number(),
    confidence_avg: z.number()
  }))
})
export type AdminEnrichmentStats = z.infer<typeof AdminEnrichmentStatsSchema>

// Enrichment history schema
export const EnrichmentHistoryItemSchema = z.object({
  id: z.string().uuid(),
  batch_id: z.string().uuid().optional(),
  offer_id: z.string().uuid(),
  offer_title: z.string(),
  enrichment_status: z.enum(['completed', 'processing', 'failed', 'low_confidence']),
  confidence_scores: ConfidenceScoresSchema.optional(),
  skills_count: z.number(),
  tokens_used: z.number(),
  processing_time_ms: z.number(),
  error_message: z.string().optional(),
  processed_at: z.string(),
  created_at: z.string()
})
export type EnrichmentHistoryItem = z.infer<typeof EnrichmentHistoryItemSchema>

export const EnrichmentHistoryResponseSchema = z.object({
  success: z.boolean(),
  history: z.array(EnrichmentHistoryItemSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    total_pages: z.number()
  })
})
export type EnrichmentHistoryResponse = z.infer<typeof EnrichmentHistoryResponseSchema>

// Admin batch enrichment request
export const AdminBatchEnrichmentRequestSchema = z.object({
  filters: z.object({
    rome_codes: z.array(z.string()).optional(),
    source: z.enum(['LBA', 'FT']).optional(),
    created_after: z.string().optional(),
    not_enriched_only: z.boolean().default(true)
  }).optional(),
  batch_size: z.number().min(1).max(500).default(100),
  confidence_threshold: z.number().min(0).max(1).default(0.8),
  priority: z.enum(['low', 'normal', 'high']).default('normal')
})
export type AdminBatchEnrichmentRequest = z.infer<typeof AdminBatchEnrichmentRequestSchema> 