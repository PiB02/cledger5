/**
 * Anonymous Session Foundation System
 * 
 * Central export for all anonymous session utilities and middleware.
 * This provides the complete infrastructure for the "try before you buy" CV upload experience.
 */

// Session utilities
export * from './session-utils'

// Session middleware
export * from './session-middleware'

// Rate limiting utilities
export * from './rate-limiting'

// Re-export types and constants from packages
export type {
  // Types
  AnonymousSession,
  AnonymousCVSession,
  AnonymousSessionRateLimit,
  CreateAnonymousSessionRequest,
  CreateAnonymousSessionResponse,
  ValidateAnonymousSessionResponse,
  AnonymousCVUploadInitRequest,
  AnonymousCVUploadInitResponse,
  AnonymousCVProcessingStatus,
  SessionCookieConfig,
  RateLimitConfig,
  SecurityConfig,
  AnonymousSessionError,
  AnonymousSessionErrorCode,
} from '@cledger5/types'

export {
  
  // Constants
  ANONYMOUS_SESSION_CONSTANTS,
  AnonymousSessionErrorCodes,
  
  // Schemas for validation  
  AnonymousSessionSchema,
  AnonymousCVSessionSchema,
  AnonymousSessionRateLimitSchema,
  CreateAnonymousSessionRequestSchema,
  CreateAnonymousSessionResponseSchema,
  ValidateAnonymousSessionResponseSchema,
  AnonymousCVUploadInitRequestSchema,
  AnonymousCVUploadInitResponseSchema,
  AnonymousCVProcessingStatusSchema,
  SessionCookieConfigSchema,
  RateLimitConfigSchema,
  SecurityConfigSchema,
  AnonymousSessionErrorSchema,
} from '@cledger5/types'