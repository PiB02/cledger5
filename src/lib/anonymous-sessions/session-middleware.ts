/**
 * Anonymous Session Middleware
 * 
 * Middleware utilities for managing anonymous session cookies and validation.
 * Handles secure cookie creation, validation, and session lifecycle management.
 */

import { NextRequest, NextResponse } from 'next/server'
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import {
  validateAnonymousSession,
  getClientIP,
  createAnonymousSession,
  hashUserAgent,
} from './session-utils'
import {
  ANONYMOUS_SESSION_CONSTANTS,
  SessionCookieConfig,
  ValidateAnonymousSessionResponse,
  AnonymousSessionErrorCodes,
} from '@cledger5/types'

// ============================================================================
// Cookie Configuration
// ============================================================================

/**
 * Get session cookie configuration based on environment
 */
function getSessionCookieConfig(): SessionCookieConfig {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    name: ANONYMOUS_SESSION_CONSTANTS.SESSION_COOKIE_NAME,
    maxAge: ANONYMOUS_SESSION_CONSTANTS.SESSION_LIFETIME_MINUTES * 60, // Convert to seconds
    httpOnly: true,
    secure: isProduction, // Only secure in production (HTTPS)
    sameSite: isProduction ? 'strict' : 'lax', // More permissive in dev for localhost
    domain: isProduction ? process.env.NEXT_PUBLIC_DOMAIN : undefined,
    path: '/',
  }
}

// ============================================================================
// Cookie Management
// ============================================================================

/**
 * Set anonymous session cookie in response
 */
export function setSessionCookie(response: NextResponse, sessionToken: string): void {
  const config = getSessionCookieConfig()
  
  response.cookies.set(config.name, sessionToken, {
    maxAge: config.maxAge,
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    domain: config.domain,
    path: config.path,
  })
}

/**
 * Clear anonymous session cookie from response
 */
export function clearSessionCookie(response: NextResponse): void {
  const config = getSessionCookieConfig()
  
  response.cookies.set(config.name, '', {
    maxAge: 0,
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    domain: config.domain,
    path: config.path,
  })
}

/**
 * Get session token from request cookies
 */
export function getSessionTokenFromRequest(request: NextRequest): string | null {
  const config = getSessionCookieConfig()
  const cookie = request.cookies.get(config.name)
  return cookie?.value || null
}

/**
 * Get session token from cookie object (for API routes)
 */
export function getSessionTokenFromCookie(cookie: RequestCookie | undefined): string | null {
  return cookie?.value || null
}

// ============================================================================
// Session Validation Middleware
// ============================================================================

/**
 * Validate anonymous session from request
 * Returns session info or null if invalid/missing
 */
export async function validateSessionFromRequest(
  request: NextRequest
): Promise<ValidateAnonymousSessionResponse | null> {
  const sessionToken = getSessionTokenFromRequest(request)
  
  if (!sessionToken) {
    return null
  }

  try {
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    return await validateAnonymousSession(sessionToken, clientIP, userAgent)
  } catch (error) {
    // Log validation errors but don't throw - just return null
    console.warn('Session validation failed:', error)
    return null
  }
}

/**
 * Require valid anonymous session or return error response
 */
export async function requireAnonymousSession(
  request: NextRequest
): Promise<ValidateAnonymousSessionResponse | NextResponse> {
  const sessionInfo = await validateSessionFromRequest(request)
  
  if (!sessionInfo) {
    return NextResponse.json(
      {
        success: false,
        error: AnonymousSessionErrorCodes.SESSION_NOT_FOUND,
        message: 'Valid anonymous session required',
        details: { 
          required_action: 'create_session',
          endpoint: '/api/anonymous/session/create'
        }
      },
      { status: 401 }
    )
  }

  if (sessionInfo.rate_limited) {
    return NextResponse.json(
      {
        success: false,
        error: AnonymousSessionErrorCodes.UPLOAD_LIMIT_EXCEEDED,
        message: 'Upload limit exceeded for this session',
        details: { 
          remaining_uploads: sessionInfo.remaining_uploads,
          session_expires_at: sessionInfo.session_expires_at
        }
      },
      { status: 429 }
    )
  }

  return sessionInfo
}

// ============================================================================
// Session Creation Helpers
// ============================================================================

/**
 * Create new anonymous session and set cookie
 * Returns response with session info and cookie set
 */
export async function createSessionWithCookie(
  request: NextRequest,
  browserFingerprint?: string
): Promise<NextResponse> {
  try {
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    const { sessionToken, sessionId, expiresAt } = await createAnonymousSession(
      clientIP,
      userAgent,
      browserFingerprint
    )

    // Create response with session info
    const response = NextResponse.json({
      success: true,
      session_token: sessionToken,
      session_id: sessionId,
      expires_at: expiresAt,
      remaining_uploads: ANONYMOUS_SESSION_CONSTANTS.MAX_UPLOADS_PER_SESSION,
      message: 'Anonymous session created successfully'
    }, { status: 201 })

    // Set secure cookie
    setSessionCookie(response, sessionToken)

    return response
  } catch (error) {
    console.error('Failed to create anonymous session:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'SESSION_CREATION_FAILED',
        message: 'Failed to create anonymous session'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Security Helpers
// ============================================================================

/**
 * Check if request appears to be from the same client
 * (IP and User-Agent consistency check)
 */
export function validateClientConsistency(
  request: NextRequest,
  sessionClientIP: string,
  sessionUserAgentHash: string
): { isConsistent: boolean; violations: string[] } {
  const violations: string[] = []
  
  const currentIP = getClientIP(request)
  const currentUserAgent = request.headers.get('user-agent') || 'unknown'
  const currentUserAgentHash = hashUserAgent(currentUserAgent)
  
  // IP consistency check
  if (sessionClientIP !== 'unknown' && currentIP !== 'unknown' && sessionClientIP !== currentIP) {
    violations.push('ip_mismatch')
  }
  
  // User-Agent consistency check
  if (sessionUserAgentHash !== currentUserAgentHash) {
    violations.push('user_agent_mismatch')
  }
  
  return {
    isConsistent: violations.length === 0,
    violations
  }
}

/**
 * Generate browser fingerprint from request headers
 * This is a basic fingerprint - in production you'd want more sophisticated client-side fingerprinting
 */
export function generateBrowserFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLanguage = request.headers.get('accept-language') || 'unknown'
  const acceptEncoding = request.headers.get('accept-encoding') || 'unknown'
  const acceptCharset = request.headers.get('accept-charset') || 'unknown'
  
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${acceptCharset}`
  
  return hashUserAgent(fingerprintData)
}

// ============================================================================
// Rate Limiting Helpers
// ============================================================================

/**
 * Check if anonymous session has remaining upload capacity
 */
export function checkUploadCapacity(sessionInfo: ValidateAnonymousSessionResponse): {
  canUpload: boolean;
  remainingUploads: number;
  reason?: string;
} {
  if (sessionInfo.rate_limited) {
    return {
      canUpload: false,
      remainingUploads: sessionInfo.remaining_uploads,
      reason: 'Upload limit exceeded'
    }
  }

  if (sessionInfo.remaining_uploads <= 0) {
    return {
      canUpload: false,
      remainingUploads: 0,
      reason: 'No remaining upload attempts'
    }
  }

  return {
    canUpload: true,
    remainingUploads: sessionInfo.remaining_uploads
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a request path should be handled by anonymous session middleware
 */
export function shouldHandleRequest(pathname: string): boolean {
  const anonymousPathPatterns = [
    '/api/anonymous',
    '/api/cv/upload/anonymous',
    '/api/cv/process/anonymous',
  ]
  
  return anonymousPathPatterns.some(pattern => pathname.startsWith(pattern))
}

/**
 * Check if a request is from an anonymous user (has session cookie but no auth)
 */
export function isAnonymousRequest(request: NextRequest): boolean {
  const sessionToken = getSessionTokenFromRequest(request)
  const authCookie = request.cookies.get('sb-access-token') // Supabase auth cookie
  const clerkCookie = request.cookies.get('__clerk_jwt') // Clerk auth cookie
  
  return Boolean(sessionToken) && !authCookie && !clerkCookie
}

/**
 * Get remaining time until session expires
 */
export function getSessionTimeRemaining(expiresAt: string): number {
  const expiryTime = new Date(expiresAt).getTime()
  const currentTime = Date.now()
  const remainingMs = expiryTime - currentTime
  
  return Math.max(0, Math.floor(remainingMs / 1000)) // Return seconds
}