/**
 * Anonymous Session Validation API
 * GET /api/anonymous/session/validate
 * 
 * Validates anonymous session token and returns session status,
 * remaining upload capacity, and rate limiting information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  validateSessionFromRequest,
  getSessionTokenFromRequest,
  checkRateLimit,
  incrementRateLimit,
} from '@/lib/anonymous-sessions'
import { AnonymousSessionErrorCodes } from '@cledger5/types'

/**
 * GET /api/anonymous/session/validate
 * Validate current anonymous session
 */
export async function GET(request: NextRequest) {
  try {
    // Get session info from request
    const sessionInfo = await validateSessionFromRequest(request)
    
    if (!sessionInfo) {
      const sessionToken = getSessionTokenFromRequest(request)
      
      return NextResponse.json(
        {
          success: false,
          error: sessionToken 
            ? AnonymousSessionErrorCodes.SESSION_EXPIRED 
            : AnonymousSessionErrorCodes.SESSION_NOT_FOUND,
          message: sessionToken 
            ? 'Session has expired or is invalid'
            : 'No anonymous session found',
          details: {
            has_session_cookie: Boolean(sessionToken),
            required_action: 'create_session',
            create_endpoint: '/api/anonymous/session/create'
          }
        },
        { status: 401 }
      )
    }

    // Check current rate limits for API calls
    const rateLimitCheck = await checkRateLimit(sessionInfo.session_id, 'api_call')
    
    // Increment API call counter if within limits
    if (rateLimitCheck.allowed) {
      await incrementRateLimit(sessionInfo.session_id, 'api_call')
    }

    // Return session validation response
    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionInfo.session_id,
        is_valid: sessionInfo.is_valid,
        expires_at: sessionInfo.session_expires_at,
        remaining_uploads: sessionInfo.remaining_uploads,
        rate_limited: sessionInfo.rate_limited,
      },
      rate_limits: {
        api_calls: {
          current: rateLimitCheck.currentCounts.apiCalls,
          limit: rateLimitCheck.limits.maxApiCalls,
          remaining: Math.max(0, rateLimitCheck.limits.maxApiCalls - rateLimitCheck.currentCounts.apiCalls),
        },
        uploads: {
          current: rateLimitCheck.currentCounts.uploads,
          limit: rateLimitCheck.limits.maxUploads,
          remaining: sessionInfo.remaining_uploads,
        },
        blocked: !rateLimitCheck.allowed,
        retry_after: rateLimitCheck.retryAfter || null,
      },
      message: 'Session validation successful'
    })

  } catch (error: any) {
    console.error('Session validation error:', error)
    
    // Handle app errors
    if (error.statusCode) {
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'VALIDATION_ERROR',
          message: error.message,
          details: error.details
        },
        { status: error.statusCode }
      )
    }

    // Fallback error response
    return NextResponse.json(
      {
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Failed to validate session'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/anonymous/session/validate
 * Not supported - validation is read-only operation
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Use GET to validate anonymous sessions',
      details: {
        allowed_methods: ['GET'],
        validation_endpoint: '/api/anonymous/session/validate'
      }
    },
    { status: 405 }
  )
}