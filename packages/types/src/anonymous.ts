/**
 * Anonymous Session Foundation System Types
 * 
 * Types and schemas for anonymous user sessions, CV processing,
 * and partial results display for the "try before you buy" experience.
 */

import { z } from 'zod'

// ============================================================================
// Anonymous Session Types
// ============================================================================

/**
 * Anonymous Session Schema
 * Secure cookie-based session tracking for anonymous users
 */
export const AnonymousSessionSchema = z.object({
  id: z.string().uuid(),
  session_token: z.string(),
  
  // Security and fingerprinting
  client_ip: z.string(),
  user_agent_hash: z.string(),
  browser_fingerprint: z.string().optional(),
  
  // Session lifecycle
  created_at: z.string().datetime(),
  last_accessed_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  is_active: z.boolean(),
  
  // Rate limiting
  upload_attempts: z.number().int().min(0),
  max_upload_attempts: z.number().int().min(1),
  
  // Conversion tracking
  converted_to_user_id: z.string().uuid().nullable(),
  converted_at: z.string().datetime().nullable(),
  
  // Metadata
  security_flags: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type AnonymousSession = z.infer<typeof AnonymousSessionSchema>

/**
 * Anonymous CV Session Schema
 * Links anonymous sessions to CV processing pipeline
 */
export const AnonymousCVSessionSchema = z.object({
  id: z.string().uuid(),
  anonymous_session_id: z.string().uuid(),
  
  // File information
  filename: z.string(),
  file_size_bytes: z.number().int().positive(),
  file_hash: z.string(),
  storage_path: z.string(),
  
  // Status tracking
  upload_status: z.enum(['initiated', 'uploading', 'uploaded', 'processing', 'completed', 'failed']),
  processing_status: z.enum(['pending', 'processing', 'completed', 'failed']).nullable(),
  
  // Processing lifecycle
  processing_started_at: z.string().datetime().nullable(),
  processing_completed_at: z.string().datetime().nullable(),
  
  // Results (partial for anonymous users)
  partial_results: z.record(z.unknown()).nullable(),
  full_results_available: z.boolean(),
  
  // Error handling
  error_message: z.string().nullable(),
  retry_count: z.number().int().min(0),
  max_retries: z.number().int().min(0),
  
  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  
  // Metadata
  metadata: z.record(z.unknown()).optional(),
})

export type AnonymousCVSession = z.infer<typeof AnonymousCVSessionSchema>

/**
 * Anonymous Session Rate Limits Schema
 * Rate limiting and abuse prevention
 */
export const AnonymousSessionRateLimitSchema = z.object({
  id: z.string().uuid(),
  anonymous_session_id: z.string().uuid(),
  
  // Rate limiting window
  window_start: z.string().datetime(),
  window_duration: z.string(), // PostgreSQL interval
  
  // Counters
  api_calls_count: z.number().int().min(0),
  upload_attempts: z.number().int().min(0),
  
  // Limits
  max_api_calls: z.number().int().min(1),
  max_uploads: z.number().int().min(1),
  
  // Blocking
  is_blocked: z.boolean(),
  blocked_until: z.string().datetime().nullable(),
  block_reason: z.string().nullable(),
  
  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type AnonymousSessionRateLimit = z.infer<typeof AnonymousSessionRateLimitSchema>

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Anonymous Session Creation Request
 */
export const CreateAnonymousSessionRequestSchema = z.object({
  browser_fingerprint: z.string().optional(),
})

export type CreateAnonymousSessionRequest = z.infer<typeof CreateAnonymousSessionRequestSchema>

/**
 * Anonymous Session Creation Response
 */
export const CreateAnonymousSessionResponseSchema = z.object({
  success: z.boolean(),
  session_token: z.string(),
  session_id: z.string().uuid(),
  expires_at: z.string().datetime(),
  remaining_uploads: z.number().int().min(0),
  message: z.string().optional(),
})

export type CreateAnonymousSessionResponse = z.infer<typeof CreateAnonymousSessionResponseSchema>

/**
 * Anonymous Session Validation Response
 */
export const ValidateAnonymousSessionResponseSchema = z.object({
  session_id: z.string().uuid(),
  is_valid: z.boolean(),
  remaining_uploads: z.number().int().min(0),
  rate_limited: z.boolean(),
  session_expires_at: z.string().datetime(),
})

export type ValidateAnonymousSessionResponse = z.infer<typeof ValidateAnonymousSessionResponseSchema>

/**
 * Anonymous CV Upload Init Request
 */
export const AnonymousCVUploadInitRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  file_size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max
  content_type: z.enum(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  file_hash: z.string().length(64), // SHA-256 hash
})

export type AnonymousCVUploadInitRequest = z.infer<typeof AnonymousCVUploadInitRequestSchema>

/**
 * Anonymous CV Upload Init Response
 */
export const AnonymousCVUploadInitResponseSchema = z.object({
  success: z.boolean(),
  session_id: z.string().uuid(),
  cv_session_id: z.string().uuid(),
  upload_url: z.string().url(),
  expires_at: z.string().datetime(),
  message: z.string().optional(),
})

export type AnonymousCVUploadInitResponse = z.infer<typeof AnonymousCVUploadInitResponseSchema>

/**
 * Anonymous CV Processing Status Response
 */
export const AnonymousCVProcessingStatusSchema = z.object({
  cv_session_id: z.string().uuid(),
  upload_status: z.enum(['initiated', 'uploading', 'uploaded', 'processing', 'completed', 'failed']),
  processing_status: z.enum(['pending', 'processing', 'completed', 'failed']).nullable(),
  
  // Progress information
  progress_percentage: z.number().int().min(0).max(100),
  current_stage: z.string(),
  estimated_time_remaining: z.number().int().nullable(), // seconds
  
  // Partial results (limited for anonymous users)
  partial_results: z.object({
    job_title: z.string().optional(),
    experience_level: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager']).optional(),
    key_skills: z.array(z.string()).max(5), // Limited to 5 skills for anonymous
    location_preference: z.string().optional(),
    education_level: z.string().optional(),
  }).nullable(),
  
  // Call to action for full results
  full_results_available: z.boolean(),
  registration_required: z.boolean(),
  
  // Error information
  error_message: z.string().nullable(),
})

export type AnonymousCVProcessingStatus = z.infer<typeof AnonymousCVProcessingStatusSchema>

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Session Cookie Configuration
 */
export const SessionCookieConfigSchema = z.object({
  name: z.string(),
  maxAge: z.number().int().positive(), // seconds
  httpOnly: z.boolean(),
  secure: z.boolean(),
  sameSite: z.enum(['strict', 'lax', 'none']),
  domain: z.string().optional(),
  path: z.string(),
})

export type SessionCookieConfig = z.infer<typeof SessionCookieConfigSchema>

/**
 * Rate Limiting Configuration
 */
export const RateLimitConfigSchema = z.object({
  max_uploads_per_session: z.number().int().positive(),
  max_api_calls_per_hour: z.number().int().positive(),
  upload_window_minutes: z.number().int().positive(),
  block_duration_minutes: z.number().int().positive(),
  cleanup_interval_minutes: z.number().int().positive(),
})

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>

/**
 * Security Configuration
 */
export const SecurityConfigSchema = z.object({
  require_ip_consistency: z.boolean(),
  require_user_agent_consistency: z.boolean(),
  enable_browser_fingerprinting: z.boolean(),
  max_session_lifetime_minutes: z.number().int().positive(),
  enable_cleanup_job: z.boolean(),
})

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>

// ============================================================================
// Error Types
// ============================================================================

/**
 * Anonymous Session Error Codes
 */
export const AnonymousSessionErrorCodes = {
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_RATE_LIMITED: 'SESSION_RATE_LIMITED',
  SESSION_BLOCKED: 'SESSION_BLOCKED',
  INVALID_SESSION_TOKEN: 'INVALID_SESSION_TOKEN',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  UPLOAD_LIMIT_EXCEEDED: 'UPLOAD_LIMIT_EXCEEDED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
} as const

export type AnonymousSessionErrorCode = typeof AnonymousSessionErrorCodes[keyof typeof AnonymousSessionErrorCodes]

/**
 * Anonymous Session Error Schema
 */
export const AnonymousSessionErrorSchema = z.object({
  code: z.enum([
    'SESSION_EXPIRED',
    'SESSION_NOT_FOUND',
    'SESSION_RATE_LIMITED',
    'SESSION_BLOCKED',
    'INVALID_SESSION_TOKEN',
    'SECURITY_VIOLATION',
    'UPLOAD_LIMIT_EXCEEDED',
    'FILE_TOO_LARGE',
    'INVALID_FILE_TYPE',
    'PROCESSING_FAILED',
  ]),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  retry_after: z.number().int().optional(), // seconds until retry allowed
})

export type AnonymousSessionError = z.infer<typeof AnonymousSessionErrorSchema>

// ============================================================================
// Constants
// ============================================================================

export const ANONYMOUS_SESSION_CONSTANTS = {
  // Session Configuration
  SESSION_LIFETIME_MINUTES: 60,
  CV_SESSION_LIFETIME_HOURS: 2,
  SESSION_COOKIE_NAME: 'cledger_anonymous_session',
  
  // Rate Limiting
  MAX_UPLOADS_PER_SESSION: 3,
  MAX_API_CALLS_PER_HOUR: 100,
  RATE_LIMIT_WINDOW_MINUTES: 60,
  BLOCK_DURATION_MINUTES: 30,
  
  // File Limits
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Security
  SESSION_TOKEN_LENGTH: 32, // bytes (256 bits)
  CLEANUP_INTERVAL_MINUTES: 15,
  
  // Partial Results Limits
  MAX_SKILLS_SHOWN: 5,
  MAX_EXPERIENCE_DETAIL: 'basic', // vs 'detailed' for registered users
} as const

export type AnonymousSessionConstants = typeof ANONYMOUS_SESSION_CONSTANTS