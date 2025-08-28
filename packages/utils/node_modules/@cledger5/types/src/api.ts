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