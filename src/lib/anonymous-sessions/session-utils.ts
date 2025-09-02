/**
 * Anonymous Session Utilities
 * 
 * Core utilities for managing anonymous user sessions including:
 * - Session creation and validation
 * - Rate limiting checks
 * - Security validation
 * - Session cleanup
 */

import { createHash, randomBytes } from 'crypto'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { errorFactory } from '@/lib/errors'
import {
  AnonymousSession,
  AnonymousCVSession,
  ValidateAnonymousSessionResponse,
  ANONYMOUS_SESSION_CONSTANTS,
  AnonymousSessionErrorCodes,
} from '@cledger5/types'

// ============================================================================
// Session Token Generation
// ============================================================================

/**
 * Generate a cryptographically secure session token
 */
export function generateSessionToken(): string {
  const randomBuffer = randomBytes(ANONYMOUS_SESSION_CONSTANTS.SESSION_TOKEN_LENGTH)
  return randomBuffer.toString('base64url')
}

/**
 * Generate SHA-256 hash of user agent for fingerprinting
 */
export function hashUserAgent(userAgent: string): string {
  return createHash('sha256').update(userAgent).digest('hex')
}

/**
 * Extract client IP from request headers (supports various proxy configurations)
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip') // Cloudflare
  
  // Priority order: CF-Connecting-IP, X-Real-IP, X-Forwarded-For (first IP)
  if (cfIP) return cfIP
  if (realIP) return realIP
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }
  
  return 'unknown'
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create a new anonymous session
 */
export async function createAnonymousSession(
  clientIP: string,
  userAgent: string,
  browserFingerprint?: string
): Promise<{ sessionToken: string; sessionId: string; expiresAt: string }> {
  const supabaseAdmin = await createSupabaseAdmin()
  
  const sessionToken = generateSessionToken()
  const userAgentHash = hashUserAgent(userAgent)
  
  // Create session record
  const { data: session, error } = await supabaseAdmin
    .from('anonymous_sessions')
    .insert({
      session_token: sessionToken,
      client_ip: clientIP,
      user_agent_hash: userAgentHash,
      browser_fingerprint: browserFingerprint || null,
      upload_attempts: 0,
      max_upload_attempts: ANONYMOUS_SESSION_CONSTANTS.MAX_UPLOADS_PER_SESSION,
      is_active: true,
      metadata: {
        created_from: 'session-utils',
        user_agent: userAgent.substring(0, 200), // Store truncated for debugging
      }
    })
    .select('id, expires_at')
    .single()

  if (error) {
    console.error('Failed to create anonymous session:', error)
    throw errorFactory.INTERNAL('Failed to create session')
  }

  if (!session) {
    throw errorFactory.INTERNAL('Session creation returned no data')
  }

  return {
    sessionToken,
    sessionId: session.id,
    expiresAt: session.expires_at,
  }
}

/**
 * Validate anonymous session and check rate limits
 */
export async function validateAnonymousSession(
  sessionToken: string,
  clientIP?: string,
  userAgent?: string
): Promise<ValidateAnonymousSessionResponse> {
  const supabaseAdmin = await createSupabaseAdmin()
  
  // Use the database function for validation
  const { data, error } = await supabaseAdmin.rpc('validate_anonymous_session', {
    p_session_token: sessionToken,
    p_client_ip: clientIP || null,
    p_user_agent_hash: userAgent ? hashUserAgent(userAgent) : null,
  })

  if (error) {
    console.error('Session validation error:', error)
    throw errorFactory.INTERNAL('Session validation failed')
  }

  if (!data || data.length === 0) {
    throw errorFactory.UNAUTHORIZED('Invalid session token', {
      code: AnonymousSessionErrorCodes.INVALID_SESSION_TOKEN
    })
  }

  const result = data[0]
  
  if (!result.is_valid) {
    throw errorFactory.UNAUTHORIZED('Session expired or invalid', {
      code: AnonymousSessionErrorCodes.SESSION_EXPIRED
    })
  }

  if (result.rate_limited) {
    throw errorFactory.RATE_LIMIT('Upload limit exceeded for this session', {
      code: AnonymousSessionErrorCodes.UPLOAD_LIMIT_EXCEEDED,
      retry_after: Math.floor((new Date(result.session_expires_at).getTime() - Date.now()) / 1000)
    })
  }

  return {
    session_id: result.session_id,
    is_valid: result.is_valid,
    remaining_uploads: result.remaining_uploads,
    rate_limited: result.rate_limited,
    session_expires_at: result.session_expires_at,
  }
}

/**
 * Increment upload attempt counter for a session
 */
export async function incrementUploadAttempt(sessionId: string): Promise<void> {
  const supabaseAdmin = await createSupabaseAdmin()
  
  // First get current upload_attempts, then increment
  const { data: currentSession } = await supabaseAdmin
    .from('anonymous_sessions')
    .select('upload_attempts')
    .eq('id', sessionId)
    .single()

  const { error } = await supabaseAdmin
    .from('anonymous_sessions')
    .update({
      upload_attempts: (currentSession?.upload_attempts || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('is_active', true)

  if (error) {
    console.error('Failed to increment upload attempt:', error)
    throw errorFactory.INTERNAL('Failed to update session')
  }
}

/**
 * Get session information by token
 */
export async function getSessionByToken(sessionToken: string): Promise<AnonymousSession | null> {
  const supabaseAdmin = await createSupabaseAdmin()
  
  const { data: session, error } = await supabaseAdmin
    .from('anonymous_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null
    }
    console.error('Failed to get session by token:', error)
    throw errorFactory.INTERNAL('Failed to retrieve session')
  }

  return session as AnonymousSession
}

// ============================================================================
// CV Session Management
// ============================================================================

/**
 * Create anonymous CV processing session
 */
export async function createAnonymousCVSession(
  anonymousSessionId: string,
  filename: string,
  fileSizeBytes: number,
  fileHash: string,
  storagePath: string,
  contentType: string
): Promise<{ cvSessionId: string; expiresAt: string }> {
  const supabaseAdmin = await createSupabaseAdmin()
  
  // First validate the anonymous session exists and is active
  const { data: anonymousSession } = await supabaseAdmin
    .from('anonymous_sessions')
    .select('id')
    .eq('id', anonymousSessionId)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (!anonymousSession) {
    throw errorFactory.UNAUTHORIZED('Invalid anonymous session', {
      code: AnonymousSessionErrorCodes.SESSION_EXPIRED
    })
  }

  // Create CV session
  const { data: cvSession, error } = await supabaseAdmin
    .from('anonymous_cv_sessions')
    .insert({
      anonymous_session_id: anonymousSessionId,
      filename,
      file_size_bytes: fileSizeBytes,
      file_hash: fileHash,
      storage_path: storagePath,
      upload_status: 'initiated',
      processing_status: null,
      partial_results: null,
      full_results_available: false,
      retry_count: 0,
      max_retries: 2,
      metadata: {
        content_type: contentType,
        created_from: 'session-utils',
      }
    })
    .select('id, expires_at')
    .single()

  if (error) {
    console.error('Failed to create CV session:', error)
    throw errorFactory.INTERNAL('Failed to create CV processing session')
  }

  if (!cvSession) {
    throw errorFactory.INTERNAL('CV session creation returned no data')
  }

  return {
    cvSessionId: cvSession.id,
    expiresAt: cvSession.expires_at,
  }
}

/**
 * Get CV session by ID with validation
 */
export async function getAnonymousCVSession(cvSessionId: string): Promise<AnonymousCVSession | null> {
  const supabaseAdmin = await createSupabaseAdmin()
  
  const { data: cvSession, error } = await supabaseAdmin
    .from('anonymous_cv_sessions')
    .select(`
      *,
      anonymous_sessions!inner(id, is_active, expires_at)
    `)
    .eq('id', cvSessionId)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null
    }
    console.error('Failed to get CV session:', error)
    throw errorFactory.INTERNAL('Failed to retrieve CV session')
  }

  // Validate parent session is still active
  const anonymousSession = (cvSession as any).anonymous_sessions
  if (!anonymousSession?.is_active || new Date(anonymousSession.expires_at) <= new Date()) {
    return null
  }

  // Remove the nested anonymous_sessions object
  const { anonymous_sessions, ...cleanCVSession } = cvSession as Record<string, unknown>
  
  return cleanCVSession as AnonymousCVSession
}

/**
 * Update CV session status
 */
export async function updateCVSessionStatus(
  cvSessionId: string,
  uploadStatus?: string,
  processingStatus?: string | null,
  partialResults?: Record<string, unknown> | null,
  errorMessage?: string | null
): Promise<void> {
  const supabaseAdmin = await createSupabaseAdmin()
  
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (uploadStatus) updateData.upload_status = uploadStatus
  if (processingStatus !== undefined) updateData.processing_status = processingStatus
  if (partialResults !== undefined) updateData.partial_results = partialResults
  if (errorMessage !== undefined) updateData.error_message = errorMessage

  // Set processing timestamps based on status
  if (processingStatus === 'processing' && !updateData.processing_started_at) {
    updateData.processing_started_at = new Date().toISOString()
  } else if (processingStatus === 'completed' || processingStatus === 'failed') {
    updateData.processing_completed_at = new Date().toISOString()
    updateData.full_results_available = processingStatus === 'completed'
  }

  const { error } = await supabaseAdmin
    .from('anonymous_cv_sessions')
    .update(updateData)
    .eq('id', cvSessionId)

  if (error) {
    console.error('Failed to update CV session status:', error)
    throw errorFactory.INTERNAL('Failed to update CV session')
  }
}

// ============================================================================
// Session Cleanup
// ============================================================================

/**
 * Clean up expired anonymous sessions
 * This should be called periodically to maintain database hygiene
 */
export async function cleanupExpiredSessions(): Promise<{ deletedSessions: number }> {
  const supabaseAdmin = await createSupabaseAdmin()
  
  try {
    // Use the database function for cleanup
    const { data, error } = await supabaseAdmin.rpc('cleanup_expired_anonymous_sessions')

    if (error) {
      console.error('Session cleanup error:', error)
      throw errorFactory.INTERNAL('Session cleanup failed')
    }

    const deletedCount = data || 0
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired anonymous sessions`)
    }

    return { deletedSessions: deletedCount }
  } catch (error) {
    console.error('Session cleanup error:', error)
    throw errorFactory.INTERNAL('Session cleanup failed')
  }
}

/**
 * Manually deactivate a session (for security reasons)
 */
export async function deactivateSession(sessionId: string, _reason?: string): Promise<void> {
  const supabaseAdmin = await createSupabaseAdmin()
  
  const { error } = await supabaseAdmin
    .from('anonymous_sessions')
    .update({
      is_active: false,
      security_flags: {
        deactivated_at: new Date().toISOString(),
        reason: _reason || 'manually_deactivated'
      },
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Failed to deactivate session:', error)
    throw errorFactory.INTERNAL('Failed to deactivate session')
  }
}