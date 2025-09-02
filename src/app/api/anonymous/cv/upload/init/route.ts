/**
 * Anonymous CV Upload Initialization API
 * POST /api/anonymous/cv/upload/init
 * 
 * Initialize CV upload for anonymous users with session validation,
 * rate limiting, and partial results preview capability.
 */

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { errorFactory } from '@/lib/errors'
import {
  requireAnonymousSession,
  createAnonymousCVSession,
  incrementUploadAttempt,
  checkRateLimit,
  incrementRateLimit,
  applyAbusePreventionMeasures,
  getClientIP,
} from '@/lib/anonymous-sessions'
import {
  AnonymousCVUploadInitRequestSchema,
  AnonymousCVUploadInitResponseSchema,
  ANONYMOUS_SESSION_CONSTANTS,
  AnonymousSessionErrorCodes,
} from '@cledger5/types'

// Constants
const CV_STORAGE_BUCKET = 'cv-documents'
const UPLOAD_EXPIRY_MINUTES = 30

/**
 * POST /api/anonymous/cv/upload/init
 * Initialize anonymous CV upload session
 */
export async function POST(request: NextRequest) {
  try {
    // Validate anonymous session
    const sessionValidation = await requireAnonymousSession(request)
    
    // If validation returned an error response, return it
    if (sessionValidation instanceof NextResponse) {
      return sessionValidation
    }

    const sessionInfo = sessionValidation

    // Parse and validate request body
    const rawBody = await request.json()
    const validatedRequest = AnonymousCVUploadInitRequestSchema.parse(rawBody)

    // Additional file validations
    if (validatedRequest.file_size > ANONYMOUS_SESSION_CONSTANTS.MAX_FILE_SIZE_BYTES) {
      throw errorFactory.VALIDATION_ERROR(
        `File size exceeds maximum limit of ${ANONYMOUS_SESSION_CONSTANTS.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
        { code: AnonymousSessionErrorCodes.FILE_TOO_LARGE }
      )
    }

    if (!ANONYMOUS_SESSION_CONSTANTS.ALLOWED_MIME_TYPES.includes(validatedRequest.content_type)) {
      throw errorFactory.VALIDATION_ERROR(
        `Unsupported file type. Allowed: ${ANONYMOUS_SESSION_CONSTANTS.ALLOWED_MIME_TYPES.join(', ')}`,
        { code: AnonymousSessionErrorCodes.INVALID_FILE_TYPE }
      )
    }

    // Check upload rate limits
    const uploadRateCheck = await checkRateLimit(sessionInfo.session_id, 'upload')
    
    if (!uploadRateCheck.allowed) {
      throw errorFactory.RATE_LIMIT(
        uploadRateCheck.reason || 'Upload limit exceeded',
        { 
          code: AnonymousSessionErrorCodes.UPLOAD_LIMIT_EXCEEDED,
          retry_after: uploadRateCheck.retryAfter,
          current_uploads: uploadRateCheck.currentCounts.uploads,
          max_uploads: uploadRateCheck.limits.maxUploads
        }
      )
    }

    // Apply abuse prevention measures
    const abuseAnalysis = await applyAbusePreventionMeasures(sessionInfo.session_id)
    
    if (abuseAnalysis.action_taken === 'blocked') {
      throw errorFactory.FORBIDDEN(
        'Session blocked due to suspicious activity',
        {
          code: AnonymousSessionErrorCodes.SESSION_BLOCKED,
          risk_score: abuseAnalysis.risk_score,
          details: abuseAnalysis.details
        }
      )
    }

    const supabaseAdmin = await createSupabaseAdmin()

    // Check for duplicate file uploads (by hash)
    const { data: existingCV, error: duplicateError } = await supabaseAdmin
      .from('anonymous_cv_sessions')
      .select('id, upload_status, partial_results')
      .eq('anonymous_session_id', sessionInfo.session_id)
      .eq('file_hash', validatedRequest.file_hash)
      .single()

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('Error checking for duplicate files:', duplicateError)
    }

    // If file already exists and was processed, return existing results
    if (existingCV) {
      if (existingCV.upload_status === 'completed' && existingCV.partial_results) {
        return NextResponse.json({
          success: true,
          session_id: sessionInfo.session_id,
          cv_session_id: existingCV.id,
          upload_url: null, // No new upload needed
          expires_at: sessionInfo.session_expires_at,
          message: 'File already processed - returning existing results',
          existing_results: existingCV.partial_results
        }, { status: 200 })
      }
    }

    // Generate unique storage path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExtension = validatedRequest.content_type === 'application/pdf' ? 'pdf' : 'docx'
    const storagePath = `anonymous/${sessionInfo.session_id}/${timestamp}-${uuidv4()}.${fileExtension}`

    try {
      // Create anonymous CV session
      const { cvSessionId, expiresAt } = await createAnonymousCVSession(
        sessionInfo.session_id,
        validatedRequest.filename,
        validatedRequest.file_size,
        validatedRequest.file_hash,
        storagePath,
        validatedRequest.content_type
      )

      // Generate signed upload URL using Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(CV_STORAGE_BUCKET)
        .createSignedUploadUrl(storagePath, {
          expiresIn: UPLOAD_EXPIRY_MINUTES * 60, // Convert to seconds
          upsert: false
        })

      if (uploadError || !uploadData) {
        console.error('Failed to create signed upload URL:', uploadError)
        
        // Cleanup CV session on failure
        await supabaseAdmin
          .from('anonymous_cv_sessions')
          .update({ 
            upload_status: 'failed', 
            error_message: 'Failed to generate upload URL' 
          })
          .eq('id', cvSessionId)

        throw errorFactory.INTERNAL('Failed to generate upload URL')
      }

      // Increment counters
      await Promise.all([
        incrementUploadAttempt(sessionInfo.session_id),
        incrementRateLimit(sessionInfo.session_id, 'upload')
      ])

      // Add to processing queue with lower priority (anonymous users)
      const { error: queueError } = await supabaseAdmin
        .from('cv_processing_queue')
        .insert({
          upload_session_id: cvSessionId, // Using CV session ID as upload session
          queue_status: 'pending',
          priority: 10, // Lower priority than authenticated users
          metadata: {
            initiated_at: new Date().toISOString(),
            file_type: validatedRequest.content_type,
            is_anonymous: true,
            session_id: sessionInfo.session_id
          }
        })

      if (queueError) {
        console.error('Failed to add to processing queue:', queueError)
        // Don't fail the request - processing can be triggered manually
      }

      // Log successful upload initiation
      await supabaseAdmin
        .from('cv_processing_metrics')
        .insert({
          upload_session_id: cvSessionId,
          metric_type: 'upload_initiation',
          metric_value: 1,
          metric_unit: 'count',
          processing_stage: 'initialization',
          metadata: {
            file_size: validatedRequest.file_size,
            file_type: validatedRequest.content_type,
            is_anonymous: true,
            risk_score: abuseAnalysis.risk_score
          }
        })

      const response = {
        success: true,
        session_id: sessionInfo.session_id,
        cv_session_id: cvSessionId,
        upload_url: uploadData.signedUrl,
        expires_at: expiresAt,
        message: 'Anonymous CV upload session initialized successfully',
        upload_limits: {
          remaining_uploads: Math.max(0, sessionInfo.remaining_uploads - 1),
          max_file_size_mb: ANONYMOUS_SESSION_CONSTANTS.MAX_FILE_SIZE_BYTES / (1024 * 1024),
          allowed_types: ANONYMOUS_SESSION_CONSTANTS.ALLOWED_MIME_TYPES
        },
        preview_info: {
          full_results_after_registration: true,
          partial_results_available: true,
          max_skills_shown: ANONYMOUS_SESSION_CONSTANTS.MAX_SKILLS_SHOWN
        }
      }

      return NextResponse.json(response, { status: 201 })

    } catch (processingError) {
      // If CV session was created but other operations failed, clean it up
      if (processingError && typeof processingError === 'object' && 'cvSessionId' in processingError) {
        await supabaseAdmin
          .from('anonymous_cv_sessions')
          .delete()
          .eq('id', (processingError as any).cvSessionId)
      }

      throw processingError
    }

  } catch (error: any) {
    console.error('Anonymous CV Upload Init Error:', error)
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: AnonymousSessionErrorCodes.INVALID_FILE_TYPE,
          message: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle app errors
    if (error.statusCode) {
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'UPLOAD_ERROR',
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
        error: 'UPLOAD_INIT_FAILED',
        message: 'Failed to initialize CV upload'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/anonymous/cv/upload/init
 * Not supported - initialization requires POST with file info
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Use POST to initialize CV uploads',
      details: {
        allowed_methods: ['POST'],
        required_fields: ['filename', 'file_size', 'content_type', 'file_hash'],
        max_file_size_mb: ANONYMOUS_SESSION_CONSTANTS.MAX_FILE_SIZE_BYTES / (1024 * 1024),
        allowed_types: ANONYMOUS_SESSION_CONSTANTS.ALLOWED_MIME_TYPES
      }
    },
    { status: 405 }
  )
}