import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase/server'
import { errorFactory } from '@/lib/errors'
import { CVProcessingProgress, CVProcessingStage } from '@cledger5/types/cv'

/**
 * GET /api/cv/process/[sessionId]/stream
 * Server-Sent Events endpoint for real-time CV processing progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { userId } = await auth()
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const sessionId = params.sessionId
  if (!sessionId) {
    return new NextResponse('Session ID required', { status: 400 })
  }

  // Verify user owns this session
  const { data: session, error: sessionError } = await supabase
    .from('cv_upload_sessions')
    .select('id, user_id, upload_status')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (sessionError || !session) {
    return new NextResponse('Session not found', { status: 404 })
  }

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  })

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      sendSSEMessage(controller, 'connected', { sessionId })

      let pollInterval: NodeJS.Timeout
      let lastStatus = session.upload_status
      let pollCount = 0
      const maxPolls = 600 // 10 minutes at 1 second intervals

      const poll = async () => {
        try {
          pollCount++

          // Get current session status with related data
          const { data: currentSession, error } = await supabase
            .from('cv_upload_sessions')
            .select(`
              *,
              cv_processing_queue(*),
              cv_validation_results(*),
              cv_processing_metrics(*)
            `)
            .eq('id', sessionId)
            .single()

          if (error || !currentSession) {
            sendSSEMessage(controller, 'error', { 
              error: 'Session not found',
              sessionId 
            })
            controller.close()
            return
          }

          // Generate processing progress
          const progress = generateProcessingProgress(currentSession)
          
          // Send progress update
          sendSSEMessage(controller, 'progress', progress)

          // Check if status changed
          if (currentSession.upload_status !== lastStatus) {
            lastStatus = currentSession.upload_status
            sendSSEMessage(controller, 'status_change', {
              sessionId,
              oldStatus: lastStatus,
              newStatus: currentSession.upload_status,
              timestamp: new Date().toISOString()
            })
          }

          // Send heartbeat every 30 seconds
          if (pollCount % 30 === 0) {
            sendSSEMessage(controller, 'heartbeat', { 
              timestamp: new Date().toISOString(),
              pollCount
            })
          }

          // Check completion conditions
          if (currentSession.upload_status === 'completed') {
            sendSSEMessage(controller, 'completed', {
              sessionId,
              finalProgress: progress,
              completedAt: currentSession.processing_completed_at
            })
            clearInterval(pollInterval)
            controller.close()
            return
          }

          if (currentSession.upload_status === 'failed') {
            sendSSEMessage(controller, 'failed', {
              sessionId,
              errorMessage: currentSession.error_message,
              failedAt: new Date().toISOString()
            })
            clearInterval(pollInterval)
            controller.close()
            return
          }

          // Timeout after max polls
          if (pollCount >= maxPolls) {
            sendSSEMessage(controller, 'timeout', {
              sessionId,
              message: 'Processing timeout reached',
              pollCount
            })
            clearInterval(pollInterval)
            controller.close()
            return
          }

        } catch (error) {
          console.error('SSE polling error:', error)
          sendSSEMessage(controller, 'error', {
            error: 'Internal server error during polling',
            sessionId
          })
          clearInterval(pollInterval)
          controller.close()
        }
      }

      // Start polling every second
      pollInterval = setInterval(poll, 1000)

      // Initial poll
      poll()

      // Cleanup on close
      return () => {
        if (pollInterval) {
          clearInterval(pollInterval)
        }
      }
    },

    cancel() {
      // Cleanup when stream is cancelled
      console.log(`SSE stream cancelled for session ${sessionId}`)
    }
  })

  return new NextResponse(stream, { headers })
}

/**
 * Helper function to send SSE messages
 */
function sendSSEMessage(controller: ReadableStreamDefaultController, event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
}

/**
 * Generate processing progress based on session data
 */
function generateProcessingProgress(session: any): CVProcessingProgress {
  const stages: CVProcessingStage[] = [
    {
      stage_name: 'File Validation',
      stage_order: 1,
      status: getStageStatus(session.upload_status, 'initiated'),
      progress_percentage: getStageProgress(session.upload_status, 'initiated'),
      started_at: session.created_at,
      completed_at: session.upload_status !== 'initiated' ? session.created_at : null,
      duration_ms: session.upload_status !== 'initiated' ? 1000 : null,
      error_message: null,
      stage_data: { validation_type: 'format_check' }
    },
    {
      stage_name: 'File Upload',
      stage_order: 2,
      status: getStageStatus(session.upload_status, 'uploading'),
      progress_percentage: getStageProgress(session.upload_status, 'uploading'),
      started_at: session.upload_status === 'uploading' ? new Date().toISOString() : null,
      completed_at: ['uploaded', 'processing', 'completed'].includes(session.upload_status) 
        ? session.updated_at : null,
      duration_ms: null,
      error_message: null,
      stage_data: { file_size: session.file_size_bytes }
    },
    {
      stage_name: 'Text Extraction',
      stage_order: 3,
      status: getStageStatus(session.upload_status, 'processing', 1),
      progress_percentage: getStageProgress(session.upload_status, 'processing', 1),
      started_at: session.upload_status === 'processing' ? session.processing_started_at : null,
      completed_at: null,
      duration_ms: null,
      error_message: null,
      stage_data: { extraction_method: 'pdf_parse' }
    },
    {
      stage_name: 'AI Analysis',
      stage_order: 4,
      status: getStageStatus(session.upload_status, 'processing', 2),
      progress_percentage: getStageProgress(session.upload_status, 'processing', 2),
      started_at: null,
      completed_at: null,
      duration_ms: null,
      error_message: null,
      stage_data: { ai_model: 'gpt-4o-mini', confidence_threshold: 0.80 }
    },
    {
      stage_name: 'Embedding Generation',
      stage_order: 5,
      status: getStageStatus(session.upload_status, 'processing', 3),
      progress_percentage: getStageProgress(session.upload_status, 'processing', 3),
      started_at: null,
      completed_at: null,
      duration_ms: null,
      error_message: null,
      stage_data: { embedding_model: 'text-embedding-3-small' }
    },
    {
      stage_name: 'Profile Creation',
      stage_order: 6,
      status: getStageStatus(session.upload_status, 'completed'),
      progress_percentage: getStageProgress(session.upload_status, 'completed'),
      started_at: null,
      completed_at: session.upload_status === 'completed' ? session.processing_completed_at : null,
      duration_ms: null,
      error_message: session.upload_status === 'failed' ? session.error_message : null,
      stage_data: {}
    }
  ]

  // Calculate overall progress
  const completedStages = stages.filter(s => s.status === 'completed').length
  const processingStages = stages.filter(s => s.status === 'processing').length
  const overallProgress = Math.round((completedStages / stages.length) * 100)

  // Estimate completion time
  let estimatedCompletion: string | null = null
  if (session.upload_status === 'processing' && session.processing_started_at) {
    const startTime = new Date(session.processing_started_at)
    const estimatedDuration = 60000 // 1 minute average
    estimatedCompletion = new Date(startTime.getTime() + estimatedDuration).toISOString()
  }

  // Calculate cost estimate based on file size (rough estimate)
  const costEstimate = Math.max(0.001, (session.file_size_bytes / (1024 * 1024)) * 0.0005)

  return {
    session_id: session.id,
    overall_status: session.upload_status,
    overall_progress: overallProgress,
    estimated_completion: estimatedCompletion,
    stages,
    quality_score: session.ai_confidence_score || null,
    cost_estimate: costEstimate
  }
}

/**
 * Get stage status based on overall session status
 */
function getStageStatus(sessionStatus: string, targetStatus: string, subStage?: number): 
  'pending' | 'processing' | 'completed' | 'failed' | 'skipped' {
  
  if (sessionStatus === 'failed') {
    return 'failed'
  }

  const statusOrder = ['initiated', 'uploading', 'uploaded', 'processing', 'completed']
  const currentIndex = statusOrder.indexOf(sessionStatus)
  const targetIndex = statusOrder.indexOf(targetStatus)

  if (currentIndex < targetIndex) {
    return 'pending'
  } else if (currentIndex === targetIndex) {
    if (targetStatus === 'processing' && subStage) {
      // For processing sub-stages, only first one is active
      return subStage === 1 ? 'processing' : 'pending'
    }
    return 'processing'
  } else {
    return 'completed'
  }
}

/**
 * Get stage progress percentage
 */
function getStageProgress(sessionStatus: string, targetStatus: string, subStage?: number): number {
  const status = getStageStatus(sessionStatus, targetStatus, subStage)
  
  switch (status) {
    case 'pending': return 0
    case 'processing': return Math.floor(Math.random() * 50) + 25 // 25-75% for active processing
    case 'completed': return 100
    case 'failed': return 0
    case 'skipped': return 0
    default: return 0
  }
}