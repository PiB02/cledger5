/**
 * Anonymous Session Detection and Validation Utilities
 * Phase 2: Anonymous CV Processing Pipeline
 * 
 * Provides secure session management for anonymous users including:
 * - Session validation and detection
 * - Rate limiting enforcement  
 * - CV upload eligibility checks
 * - Session type detection utilities
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { errorFactory } from '@/lib/errors'
import { createHash } from 'crypto'

// =============================================================================
// TYPES AND SCHEMAS
// =============================================================================

export const AnonymousSessionSchema = z.object({
  id: z.string().uuid(),
  session_token: z.string(),
  client_ip: z.string(),
  user_agent_hash: z.string(),
  created_at: z.string(),
  last_accessed_at: z.string(),
  expires_at: z.string(),
  is_active: z.boolean(),
  upload_attempts: z.number().int(),
  max_upload_attempts: z.number().int(),
  converted_to_user_id: z.string().uuid().nullable(),
  security_flags: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({})
})

export const SessionValidationResultSchema = z.object({
  session_id: z.string().uuid().nullable(),
  is_valid: z.boolean(),
  expires_at: z.string().nullable(),
  upload_attempts: z.number().int().default(0),
  can_upload: z.boolean(),
  rate_limited: z.boolean().default(false),
  security_warning: z.boolean().default(false)
})

export const SessionTypeDetectionSchema = z.object({
  session_type: z.enum(['authenticated', 'anonymous', 'invalid']),
  user_id: z.string().uuid().nullable(),
  anonymous_session_id: z.string().uuid().nullable(),
  session_token: z.string().nullable(),
  requires_auth: z.boolean(),
  can_access_cv_processing: z.boolean()
})

export type AnonymousSession = z.infer<typeof AnonymousSessionSchema>
export type SessionValidationResult = z.infer<typeof SessionValidationResultSchema>
export type SessionTypeDetection = z.infer<typeof SessionTypeDetectionSchema>

// =============================================================================
// CONSTANTS
// =============================================================================

export const ANONYMOUS_SESSION_CONFIG = {
  COOKIE_NAME: 'cledger_anonymous_session',
  TOKEN_HEADER: 'x-anonymous-session-token',
  MAX_UPLOAD_ATTEMPTS: 3,
  SESSION_DURATION_MINUTES: 60,
  RATE_LIMIT_WINDOW_MINUTES: 60,
  MAX_API_CALLS_PER_WINDOW: 100,
  SECURITY_IP_TOLERANCE: true, // Allow IP changes (mobile networks)
  USER_AGENT_TOLERANCE: false // Strict user agent checking
} as const

// =============================================================================
// SESSION DETECTION UTILITIES
// =============================================================================

/**
 * Detect session type from request (authenticated vs anonymous)
 * This is the main entry point for determining how to handle a request
 */
export async function detectSessionType(
  request: NextRequest, 
  authUserId?: string | null
): Promise<SessionTypeDetection> {
  
  // Check for authenticated user first
  if (authUserId) {
    return {
      session_type: 'authenticated',
      user_id: authUserId,
      anonymous_session_id: null,
      session_token: null,
      requires_auth: false,
      can_access_cv_processing: true
    }
  }

  // Check for anonymous session token
  const anonymousToken = extractAnonymousToken(request)
  
  if (!anonymousToken) {
    return {
      session_type: 'invalid',
      user_id: null,
      anonymous_session_id: null,
      session_token: null,
      requires_auth: true,
      can_access_cv_processing: false
    }
  }

  // Validate anonymous session
  const validation = await validateAnonymousSession(anonymousToken, request)
  
  if (!validation.is_valid || !validation.session_id) {
    return {
      session_type: 'invalid',
      user_id: null,
      anonymous_session_id: null,
      session_token: anonymousToken,
      requires_auth: true,
      can_access_cv_processing: false
    }
  }

  return {
    session_type: 'anonymous',
    user_id: null,
    anonymous_session_id: validation.session_id,
    session_token: anonymousToken,
    requires_auth: false,
    can_access_cv_processing: validation.can_upload && !validation.rate_limited
  }
}

/**
 * Extract anonymous session token from request
 * Checks multiple sources: header, cookie, query parameter
 */
export function extractAnonymousToken(request: NextRequest): string | null {
  // Priority 1: Header (for API calls)
  const headerToken = request.headers.get(ANONYMOUS_SESSION_CONFIG.TOKEN_HEADER)
  if (headerToken) {
    return headerToken
  }

  // Priority 2: Cookie (for web pages)  
  const cookieToken = request.cookies.get(ANONYMOUS_SESSION_CONFIG.COOKIE_NAME)?.value
  if (cookieToken) {
    return cookieToken
  }

  // Priority 3: Query parameter (for special cases)
  const urlParams = new URL(request.url).searchParams
  const queryToken = urlParams.get('session_token')
  if (queryToken) {
    return queryToken
  }

  return null
}

/**
 * Validate anonymous session and check rate limits
 * Returns comprehensive validation result with upload eligibility
 */
export async function validateAnonymousSession(
  sessionToken: string,
  request: NextRequest
): Promise<SessionValidationResult> {
  
  if (!sessionToken || sessionToken.length < 16) {
    return {
      session_id: null,
      is_valid: false,
      expires_at: null,
      upload_attempts: 0,
      can_upload: false,
      rate_limited: true,
      security_warning: false
    }
  }

  try {
    const supabaseAdmin = await createSupabaseAdmin()
    
    // Extract request metadata for security validation
    const clientIP = getClientIP(request)
    const userAgentHash = generateUserAgentHash(request.headers.get('user-agent') || '')

    // Use database function for validation and rate limit checking
    const { data, error } = await supabaseAdmin
      .rpc('get_anonymous_session_for_cv', {
        p_session_token: sessionToken
      })

    if (error) {
      console.error('Anonymous session validation error:', error)
      return {
        session_id: null,
        is_valid: false,
        expires_at: null,
        upload_attempts: 0,
        can_upload: false,
        rate_limited: true,
        security_warning: false
      }
    }

    const result = data?.[0]
    if (!result || !result.is_valid) {
      return {
        session_id: null,
        is_valid: false,
        expires_at: null,
        upload_attempts: 0,
        can_upload: false,
        rate_limited: true,
        security_warning: false
      }
    }

    // Additional security validation
    let securityWarning = false
    
    if (ANONYMOUS_SESSION_CONFIG.USER_AGENT_TOLERANCE) {
      // Check if user agent changed (possible session hijacking)
      const { data: sessionData } = await supabaseAdmin
        .from('anonymous_sessions')
        .select('user_agent_hash, security_flags')
        .eq('id', result.session_id)
        .single()

      if (sessionData && sessionData.user_agent_hash !== userAgentHash) {
        securityWarning = true
        
        // Update security flags
        await supabaseAdmin
          .from('anonymous_sessions')
          .update({
            security_flags: {
              ...(sessionData.security_flags || {}),
              user_agent_mismatch: true,
              last_user_agent_change: new Date().toISOString()
            }
          })
          .eq('id', result.session_id)
      }
    }

    return {
      session_id: result.session_id,
      is_valid: result.is_valid,
      expires_at: result.expires_at,
      upload_attempts: result.upload_attempts || 0,
      can_upload: result.can_upload && !securityWarning,
      rate_limited: !result.can_upload,
      security_warning: securityWarning
    }

  } catch (error) {
    console.error('Anonymous session validation error:', error)
    return {
      session_id: null,
      is_valid: false,
      expires_at: null,
      upload_attempts: 0,
      can_upload: false,
      rate_limited: true,
      security_warning: false
    }
  }
}

/**
 * Check if anonymous session can perform CV upload
 * Includes comprehensive rate limiting and security checks
 */
export async function canAnonymousSessionUploadCV(
  sessionToken: string,
  request: NextRequest
): Promise<{
  can_upload: boolean
  reason?: string
  remaining_attempts?: number
  next_available_at?: string
}> {
  
  const validation = await validateAnonymousSession(sessionToken, request)
  
  if (!validation.is_valid || !validation.session_id) {
    return {
      can_upload: false,
      reason: 'Invalid or expired session'
    }
  }

  if (validation.security_warning) {
    return {
      can_upload: false,
      reason: 'Security validation failed - please refresh and try again'
    }
  }

  if (validation.rate_limited) {
    return {
      can_upload: false,
      reason: 'Upload limit reached for this session',
      remaining_attempts: 0
    }
  }

  const remainingAttempts = Math.max(0, ANONYMOUS_SESSION_CONFIG.MAX_UPLOAD_ATTEMPTS - validation.upload_attempts)
  
  return {
    can_upload: validation.can_upload,
    remaining_attempts: remainingAttempts
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extract client IP address from request
 * Handles various proxy configurations (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  const xRealIP = request.headers.get('x-real-ip')
  if (xRealIP) {
    return xRealIP
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return 'unknown'
}

/**
 * Generate hash of user agent for security tracking
 * Helps detect session hijacking attempts
 */
export function generateUserAgentHash(userAgent: string): string {
  if (!userAgent) {
    return 'unknown'
  }
  
  return createHash('sha256')
    .update(userAgent)
    .digest('hex')
    .substring(0, 16) // First 16 chars for storage efficiency
}

/**
 * Check if session is eligible for conversion to authenticated user
 * Used when anonymous user decides to register
 */
export async function isSessionEligibleForConversion(
  sessionToken: string
): Promise<{
  eligible: boolean
  reason?: string
  has_cv_data: boolean
  cv_count: number
}> {
  
  if (!sessionToken) {
    return {
      eligible: false,
      reason: 'No session token provided',
      has_cv_data: false,
      cv_count: 0
    }
  }

  try {
    const supabaseAdmin = await createSupabaseAdmin()
    
    // Get session info
    const { data: sessionData } = await supabaseAdmin
      .from('anonymous_sessions')
      .select('id, converted_to_user_id, is_active, expires_at')
      .eq('session_token', sessionToken)
      .single()

    if (!sessionData || !sessionData.is_active) {
      return {
        eligible: false,
        reason: 'Session not found or inactive',
        has_cv_data: false,
        cv_count: 0
      }
    }

    if (sessionData.converted_to_user_id) {
      return {
        eligible: false,
        reason: 'Session already converted',
        has_cv_data: false,
        cv_count: 0
      }
    }

    if (new Date(sessionData.expires_at) <= new Date()) {
      return {
        eligible: false,
        reason: 'Session expired',
        has_cv_data: false,
        cv_count: 0
      }
    }

    // Check for CV data
    const { data: cvData, error: cvError } = await supabaseAdmin
      .from('cv_profiles')
      .select('id')
      .eq('anonymous_session_id', sessionData.id)

    if (cvError) {
      console.error('Error checking CV data for conversion:', cvError)
    }

    const cvCount = cvData?.length || 0
    
    return {
      eligible: true,
      has_cv_data: cvCount > 0,
      cv_count: cvCount
    }

  } catch (error) {
    console.error('Session conversion eligibility check error:', error)
    return {
      eligible: false,
      reason: 'System error',
      has_cv_data: false,
      cv_count: 0
    }
  }
}

/**
 * Generate new anonymous session token
 * Used when creating new anonymous sessions
 */
export function generateAnonymousSessionToken(): string {
  // Generate cryptographically secure random token
  // Format: base64url for URL safety
  const bytes = new Uint8Array(32) // 256 bits
  crypto.getRandomValues(bytes)
  
  return Buffer.from(bytes)
    .toString('base64url')
    .replace(/[+/]/g, '') // Extra safety for URL encoding
    .substring(0, 43) // Standard base64url length for 32 bytes
}

/**
 * Validate session token format
 * Quick client-side validation before making API calls
 */
export function isValidSessionTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }
  
  // Check length (base64url encoded 32 bytes should be 43 chars)
  if (token.length < 16 || token.length > 50) {
    return false
  }
  
  // Check characters (base64url alphabet)
  const base64urlRegex = /^[A-Za-z0-9_-]+$/
  return base64urlRegex.test(token)
}

// =============================================================================
// ERROR HELPERS
// =============================================================================

/**
 * Create standardized error responses for session validation failures
 */
export function createSessionError(
  code: 'INVALID_SESSION' | 'EXPIRED_SESSION' | 'RATE_LIMITED' | 'SECURITY_ERROR',
  message?: string
) {
  switch (code) {
    case 'INVALID_SESSION':
      return errorFactory.UNAUTHORIZED(message || 'Invalid anonymous session')
    case 'EXPIRED_SESSION':
      return errorFactory.UNAUTHORIZED(message || 'Anonymous session expired')
    case 'RATE_LIMITED':
      return errorFactory.RATE_LIMIT(message || 'Too many requests for this session')
    case 'SECURITY_ERROR':
      return errorFactory.FORBIDDEN(message || 'Security validation failed')
    default:
      return errorFactory.UNAUTHORIZED('Session validation failed')
  }
}