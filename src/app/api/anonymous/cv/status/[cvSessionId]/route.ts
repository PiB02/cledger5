/**
 * Anonymous CV Processing Status API
 * GET /api/anonymous/cv/status/[cvSessionId]
 * 
 * Returns processing status and partial results for anonymous CV uploads.
 * Shows limited preview to encourage registration for full results.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { errorFactory } from '@/lib/errors'
import {
  validateSessionFromRequest,
  getAnonymousCVSession,
  checkRateLimit,
  incrementRateLimit,
} from '@/lib/anonymous-sessions'
import {
  AnonymousCVProcessingStatusSchema,
  ANONYMOUS_SESSION_CONSTANTS,
  AnonymousSessionErrorCodes,
} from '@cledger5/types'

/**
 * GET /api/anonymous/cv/status/[cvSessionId]
 * Get anonymous CV processing status and partial results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cvSessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const { cvSessionId } = resolvedParams

    if (!cvSessionId) {
      throw errorFactory.VALIDATION_ERROR('CV session ID is required')
    }

    // Validate anonymous session
    const sessionInfo = await validateSessionFromRequest(request)
    
    if (!sessionInfo) {
      return NextResponse.json(
        {
          success: false,
          error: AnonymousSessionErrorCodes.SESSION_NOT_FOUND,
          message: 'Valid anonymous session required',
        },
        { status: 401 }
      )
    }

    // Check API call rate limits
    const rateLimitCheck = await checkRateLimit(sessionInfo.session_id, 'api_call')
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: AnonymousSessionErrorCodes.SESSION_RATE_LIMITED,
          message: 'API rate limit exceeded',
          details: {
            retry_after: rateLimitCheck.retryAfter,
            current_calls: rateLimitCheck.currentCounts.apiCalls,
            max_calls: rateLimitCheck.limits.maxApiCalls
          }
        },
        { status: 429 }
      )
    }

    // Increment API call counter
    await incrementRateLimit(sessionInfo.session_id, 'api_call')

    // Get CV session info
    const cvSession = await getAnonymousCVSession(cvSessionId)
    
    if (!cvSession) {
      throw errorFactory.NOT_FOUND('CV session not found or expired')
    }

    // Verify session ownership
    if (cvSession.anonymous_session_id !== sessionInfo.session_id) {
      throw errorFactory.FORBIDDEN('Access denied to this CV session')
    }

    // Calculate progress and stage information
    let progressPercentage = 0
    let currentStage = 'Initialization'
    let estimatedTimeRemaining: number | null = null

    switch (cvSession.upload_status) {
      case 'initiated':
        progressPercentage = 5
        currentStage = 'Ready for upload'
        break
      case 'uploading':
        progressPercentage = 20
        currentStage = 'File upload in progress'
        estimatedTimeRemaining = 60
        break
      case 'uploaded':
        progressPercentage = 40
        currentStage = 'File uploaded, queued for AI processing'
        estimatedTimeRemaining = 120
        break
      case 'processing':
        progressPercentage = 70
        currentStage = 'AI analysis in progress'
        estimatedTimeRemaining = 90
        break
      case 'completed':
        progressPercentage = 100
        currentStage = 'Processing completed'
        estimatedTimeRemaining = 0
        break
      case 'failed':
        progressPercentage = 0
        currentStage = 'Processing failed'
        estimatedTimeRemaining = null
        break
    }

    // Process partial results for anonymous users
    let partialResults = null
    let fullResultsAvailable = false

    if (cvSession.partial_results && cvSession.upload_status === 'completed') {
      const rawResults = cvSession.partial_results as any
      
      // Limit skills shown to anonymous users
      const skills = Array.isArray(rawResults.skills) ? rawResults.skills : []
      const limitedSkills = skills.slice(0, ANONYMOUS_SESSION_CONSTANTS.MAX_SKILLS_SHOWN)

      partialResults = {
        job_title: rawResults.job_title || undefined,
        experience_level: rawResults.seniority || undefined,
        key_skills: limitedSkills,
        location_preference: rawResults.location || undefined,
        education_level: rawResults.degree ? 
          `EQF Level ${rawResults.degree}` : undefined,
      }

      fullResultsAvailable = true
    }

    // Construct response
    const response = {
      cv_session_id: cvSessionId,
      upload_status: cvSession.upload_status,
      processing_status: cvSession.processing_status,
      
      // Progress information
      progress_percentage: progressPercentage,
      current_stage: currentStage,
      estimated_time_remaining: estimatedTimeRemaining,
      
      // Partial results (limited for anonymous users)
      partial_results: partialResults,
      
      // Call to action
      full_results_available: fullResultsAvailable,
      registration_required: fullResultsAvailable,
      
      // Error information
      error_message: cvSession.error_message,
      
      // Additional info for anonymous users
      anonymous_limits: {
        max_skills_shown: ANONYMOUS_SESSION_CONSTANTS.MAX_SKILLS_SHOWN,
        upgrade_message: fullResultsAvailable ? 
          'Register to see complete CV analysis with detailed skills, experience breakdown, and job matching recommendations' :
          undefined
      }
    }

    // Validate response against schema
    const validatedResponse = AnonymousCVProcessingStatusSchema.parse(response)

    return NextResponse.json({
      success: true,
      data: validatedResponse,
      message: 'CV processing status retrieved successfully'
    })

  } catch (error: any) {
    console.error('Anonymous CV status error:', error)
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      console.error('Response validation error:', error.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_RESPONSE',
          message: 'Invalid response data structure',
          details: error.errors
        },
        { status: 500 }
      )
    }

    // Handle app errors
    if (error.statusCode) {
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'STATUS_ERROR',
          message: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      )
    }

    // Fallback error response
    return NextResponse.json(
      {
        success: false,
        error: 'STATUS_RETRIEVAL_FAILED',
        message: 'Failed to retrieve CV processing status'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/anonymous/cv/status/[cvSessionId]
 * Not supported - status is read-only for anonymous users
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'CV status is read-only for anonymous users',
      details: {
        allowed_methods: ['GET'],
        modify_access: 'Registration required to modify CV processing'
      }
    },
    { status: 405 }
  )
}