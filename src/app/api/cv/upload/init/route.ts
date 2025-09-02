import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase/server'
import { withErrorHandler, errorFactory } from '@/lib/errors'
import { CVUploadInitRequestSchema, CVUploadInitResponseSchema } from '@cledger5/types/cv'
import { v4 as uuidv4 } from 'uuid'

// Constants
const CV_STORAGE_BUCKET = 'cv-documents'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const UPLOAD_EXPIRY_MINUTES = 30

/**
 * POST /api/cv/upload/init
 * Initialize CV upload session and generate signed upload URL
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      throw errorFactory('UNAUTHORIZED', 'Authentication required for CV upload')
    }

    // Parse and validate request
    const rawBody = await request.json()
    const validatedRequest = CVUploadInitRequestSchema.parse(rawBody)

    // Additional validations
    if (validatedRequest.file_size > MAX_FILE_SIZE) {
      throw errorFactory('VALIDATION_ERROR', `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    if (!ALLOWED_TYPES.includes(validatedRequest.content_type)) {
      throw errorFactory('VALIDATION_ERROR', `Unsupported file type. Allowed: ${ALLOWED_TYPES.join(', ')}`)
    }

    // Check if user exists and is active
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      throw errorFactory('UNAUTHORIZED', 'User not found or inactive')
    }

    // Check for existing processing sessions (limit concurrent uploads)
    const { data: existingSessions, error: sessionError } = await supabase
      .from('cv_upload_sessions')
      .select('id, upload_status')
      .eq('user_id', userId)
      .in('upload_status', ['initiated', 'uploading', 'processing'])

    if (sessionError) {
      throw errorFactory('DATABASE_ERROR', 'Failed to check existing sessions')
    }

    if (existingSessions && existingSessions.length >= 3) {
      throw errorFactory('RATE_LIMIT', 'Maximum concurrent uploads exceeded. Please wait for current uploads to complete.')
    }

    // Generate unique session ID and storage path
    const sessionId = uuidv4()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExtension = validatedRequest.content_type === 'application/pdf' ? 'pdf' : 'docx'
    const storagePath = `${userId}/${timestamp}-${sessionId}.${fileExtension}`

    try {
      // Create upload session record
      const { data: uploadSession, error: insertError } = await supabase
        .from('cv_upload_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          filename: validatedRequest.filename,
          file_size_bytes: validatedRequest.file_size,
          file_hash: validatedRequest.file_hash,
          upload_status: 'initiated',
          storage_path: storagePath,
          metadata: {
            content_type: validatedRequest.content_type,
            client_ip: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown'
          }
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create upload session:', insertError)
        throw errorFactory('DATABASE_ERROR', 'Failed to initialize upload session')
      }

      // Generate signed upload URL using Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(CV_STORAGE_BUCKET)
        .createSignedUploadUrl(storagePath, {
          expiresIn: UPLOAD_EXPIRY_MINUTES * 60, // Convert to seconds
          upsert: false
        })

      if (uploadError || !uploadData) {
        console.error('Failed to create signed upload URL:', uploadError)
        
        // Cleanup upload session on failure
        await supabase
          .from('cv_upload_sessions')
          .update({ 
            upload_status: 'failed', 
            error_message: 'Failed to generate upload URL' 
          })
          .eq('id', sessionId)

        throw errorFactory('STORAGE_ERROR', 'Failed to generate upload URL')
      }

      // Add upload session to processing queue with normal priority
      const { error: queueError } = await supabase
        .from('cv_processing_queue')
        .insert({
          upload_session_id: sessionId,
          queue_status: 'pending',
          priority: 5, // Normal priority
          metadata: {
            initiated_at: new Date().toISOString(),
            file_type: validatedRequest.content_type
          }
        })

      if (queueError) {
        console.error('Failed to add to processing queue:', queueError)
        // Don't fail the request, just log the error - processing can be triggered manually
      }

      // Log successful upload initiation for analytics
      await supabase
        .from('cv_processing_metrics')
        .insert({
          upload_session_id: sessionId,
          metric_type: 'upload_initiation',
          metric_value: 1,
          metric_unit: 'count',
          processing_stage: 'initialization',
          metadata: {
            file_size: validatedRequest.file_size,
            file_type: validatedRequest.content_type
          }
        })

      const response: z.infer<typeof CVUploadInitResponseSchema> = {
        session_id: sessionId,
        upload_url: uploadData.signedUrl,
        success: true,
        message: 'Upload session initialized successfully'
      }

      return NextResponse.json(response, { status: 201 })

    } catch (error) {
      // Cleanup on any failure
      await supabase
        .from('cv_upload_sessions')
        .delete()
        .eq('id', sessionId)

      throw error
    }
  })
}

/**
 * GET /api/cv/upload/init?session_id=xxx
 * Check upload session status
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { userId } = await auth()
    if (!userId) {
      throw errorFactory('UNAUTHORIZED', 'Authentication required')
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      throw errorFactory('VALIDATION_ERROR', 'session_id parameter required')
    }

    // Get upload session with validation results and metrics
    const { data: sessionData, error: sessionError } = await supabase
      .from('cv_upload_sessions')
      .select(`
        *,
        cv_validation_results(*),
        cv_processing_metrics(*)
      `)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionError || !sessionData) {
      throw errorFactory('NOT_FOUND', 'Upload session not found')
    }

    // Calculate progress percentage based on status
    let progressPercentage = 0
    let currentStage = 'Initialization'
    let estimatedTimeRemaining: number | null = null

    switch (sessionData.upload_status) {
      case 'initiated':
        progressPercentage = 10
        currentStage = 'Ready for upload'
        break
      case 'uploading':
        progressPercentage = 30
        currentStage = 'File upload in progress'
        estimatedTimeRemaining = 60
        break
      case 'uploaded':
        progressPercentage = 50
        currentStage = 'File uploaded, queued for processing'
        estimatedTimeRemaining = 45
        break
      case 'processing':
        progressPercentage = 75
        currentStage = 'AI processing in progress'
        estimatedTimeRemaining = 30
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

    const response = {
      session_id: sessionId,
      status: sessionData.upload_status,
      progress_percentage: progressPercentage,
      current_stage: currentStage,
      estimated_time_remaining: estimatedTimeRemaining,
      error_message: sessionData.error_message,
      validation_results: sessionData.cv_validation_results || undefined,
      processing_metrics: sessionData.cv_processing_metrics || undefined
    }

    return NextResponse.json(response)
  })
}