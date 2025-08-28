import { z } from 'zod'

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number().optional(),
  totalPages: z.number().optional()
})
export type Pagination = z.infer<typeof PaginationSchema>

// Sort order
export const SortOrderEnum = z.enum(['asc', 'desc'])
export type SortOrder = z.infer<typeof SortOrderEnum>

// Location schema
export const LocationSchema = z.object({
  id: z.string().uuid(),
  city: z.string(),
  postal_code: z.string().optional(),
  department_code: z.string().optional(),
  department_name: z.string().optional(),
  region_code: z.string().optional(),
  region_name: z.string().optional(),
  country_code: z.string().default('FR'),
  latitude: z.number().optional(),
  longitude: z.number().optional()
})
export type Location = z.infer<typeof LocationSchema>

// Company schema
export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  siret: z.string().optional(),
  naf_code: z.string().optional(),
  size: z.enum(['1-9', '10-49', '50-249', '250-999', '1000+']).optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  created_at: z.string(),
  updated_at: z.string()
})
export type Company = z.infer<typeof CompanySchema>

// Error response
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional()
})
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// Success response
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional()
})
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>

// Batch status
export const BatchStatusEnum = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled'])
export type BatchStatus = z.infer<typeof BatchStatusEnum>

// Batch schema
export const BatchSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['offers_ingest', 'cv_parsing', 'embeddings_update']),
  status: BatchStatusEnum,
  filters: z.record(z.any()).optional(),
  total_items: z.number().optional(),
  processed_items: z.number().default(0),
  failed_items: z.number().default(0),
  estimated_cost: z.number().optional(),
  estimated_duration_seconds: z.number().optional(),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  error_message: z.string().optional(),
  created_by: z.string().uuid(),
  created_at: z.string()
})
export type Batch = z.infer<typeof BatchSchema> 