import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { errorFactory, AppError } from '@/lib/errors'
import { generateAnonymousSessionToken, getClientIP, generateUserAgentHash, ANONYMOUS_SESSION_CONFIG } from '@/lib/anonymous/session-utils'
import { v4 as uuidv4 } from 'uuid'

// Request schema
const CreateAnonymousSessionRequestSchema = z.object({
  browser_fingerprint: z.string().optional()
})

// Response schema
const CreateAnonymousSessionResponseSchema = z.object({
  session_token: z.string(),
  session_id: z.string().uuid(),
  expires_at: z.string(),
  success: z.boolean()
})

/**
 * POST /api/anonymous-session-init
 * Create a new anonymous session for CV upload
 * STRATEGIC WORKAROUND: Single endpoint that works around Next.js route compilation issues
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request
    const rawBody = await request.json()
    const validatedRequest = CreateAnonymousSessionRequestSchema.parse(rawBody)

    // Extract client metadata
    const clientIP = getClientIP(request)
    const userAgentHash = generateUserAgentHash(request.headers.get('user-agent') || '')
    
    // Generate session data
    const sessionId = uuidv4()
    const sessionToken = generateAnonymousSessionToken()
    const expiresAt = new Date(Date.now() + ANONYMOUS_SESSION_CONFIG.SESSION_DURATION_MINUTES * 60 * 1000)

    // Create session in database
    const supabaseAdmin = await createSupabaseAdmin()
    
    const { data: newSession, error: insertError } = await supabaseAdmin
      .from('anonymous_sessions')
      .insert({
        id: sessionId,
        session_token: sessionToken,
        client_ip: clientIP,
        user_agent_hash: userAgentHash,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        upload_attempts: 0,
        max_upload_attempts: ANONYMOUS_SESSION_CONFIG.MAX_UPLOAD_ATTEMPTS,
        converted_to_user_id: null,
        security_flags: {},
        metadata: {
          browser_fingerprint: validatedRequest.browser_fingerprint,
          created_via: 'api',
          user_agent: request.headers.get('user-agent') || 'unknown'
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create anonymous session:', insertError)
      throw errorFactory.INTERNAL('Failed to create anonymous session')
    }

    if (!newSession) {
      throw errorFactory.INTERNAL('Session creation returned no data')
    }

    // Log session creation for analytics
    await supabaseAdmin
      .from('anonymous_session_metrics')
      .insert({
        session_id: sessionId,
        metric_type: 'session_creation',
        metric_value: 1,
        metric_unit: 'count',
        metadata: {
          client_ip: clientIP,
          user_agent_hash: userAgentHash,
          browser_fingerprint: validatedRequest.browser_fingerprint
        }
      })
      .catch(error => {
        console.warn('Failed to log session creation metric:', error)
        // Don't fail the request for analytics errors
      })

    const response: z.infer<typeof CreateAnonymousSessionResponseSchema> = {
      session_token: sessionToken,
      session_id: sessionId,
      expires_at: expiresAt.toISOString(),
      success: true
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('Anonymous Session Creation Error:', error)
    
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      )
    }

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to create anonymous session',
      },
      { status: 500 }
    )
  }
}