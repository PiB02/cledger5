import { NextRequest, NextResponse } from 'next/server'
import { 
  createAnonymousSession, 
  getClientIP,
} from '@/lib/anonymous-sessions'
import { errorFactory, httpErrorMap } from '@/lib/errors'
import {
  CreateAnonymousSessionRequestSchema,
  CreateAnonymousSessionResponse,
} from '@cledger5/types'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedBody = CreateAnonymousSessionRequestSchema.parse(body)
    
    // Extract client information
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    console.log('Creating anonymous session:', { 
      clientIP, 
      userAgent: userAgent.substring(0, 50), 
      browserFingerprint: validatedBody.browser_fingerprint 
    })
    
    // Create the session
    const { sessionToken, sessionId, expiresAt } = await createAnonymousSession(
      clientIP,
      userAgent,
      validatedBody.browser_fingerprint
    )
    
    const response: CreateAnonymousSessionResponse = {
      success: true,
      session_token: sessionToken,
      session_id: sessionId,
      expires_at: expiresAt,
      remaining_uploads: 3,
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Anonymous session creation failed:', error)
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const appError = httpErrorMap[error.statusCode as keyof typeof httpErrorMap](error.message)
      return NextResponse.json(
        { 
          success: false,
          error: appError.code,
          message: appError.message,
          details: appError.details
        }, 
        { status: appError.statusCode }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create anonymous session',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      }, 
      { status: 500 }
    )
  }
}