import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'CV upload init endpoint is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate proper UUIDs for the session
    const sessionId = crypto.randomUUID()
    const sessionToken = crypto.randomUUID()
    
    // Create the anonymous session in the database first
    const supabase = await createSupabaseAdmin()
    
    // Get client IP and user agent (simplified for testing)
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'test-agent'
    const userAgentHash = Buffer.from(userAgent).toString('base64').substring(0, 32)
    
    const { error: sessionError } = await supabase
      .from('anonymous_sessions')
      .insert({
        id: sessionId,
        session_token: sessionToken,
        client_ip: clientIp,
        user_agent_hash: userAgentHash,
        browser_fingerprint: body.browser_fingerprint || 'test-fingerprint',
        created_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_active: true,
        upload_attempts: 0,
        max_upload_attempts: 5
      })
    
    if (sessionError) {
      console.error('Failed to create anonymous session:', sessionError)
      throw new Error(`Failed to create session: ${sessionError.message}`)
    }
    
    // Create a signed URL for direct upload to Supabase Storage
    const filePath = `anonymous-cvs/${sessionId}/${body.filename || 'cv.pdf'}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cv-documents')
      .createSignedUploadUrl(filePath, {
        upsert: true
      })
    
    if (uploadError) {
      console.error('Failed to create signed upload URL:', uploadError)
      throw new Error(`Failed to create upload URL: ${uploadError.message}`)
    }
    
    // Also create the CV session record
    const cvSessionId = crypto.randomUUID()
    const { error: cvSessionError } = await supabase
      .from('anonymous_cv_sessions')
      .insert({
        id: cvSessionId,
        anonymous_session_id: sessionId,
        filename: body.filename || 'cv.pdf',
        file_size_bytes: body.file_size || 0,
        file_hash: body.file_hash || 'auto-generated',
        storage_path: filePath,
        upload_status: 'initiated',
        processing_status: 'pending',
        full_results_available: false,
        retry_count: 0,
        max_retries: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
    
    if (cvSessionError) {
      console.error('Failed to create CV session:', cvSessionError)
      throw new Error(`Failed to create CV session: ${cvSessionError.message}`)
    }
    
    const response = {
      success: true,
      session_id: cvSessionId, // Use CV session ID for processing
      upload_url: uploadData.signedUrl,
      session_token: sessionToken,
      anonymous_session_id: sessionId,
      file_path: filePath,
      message: 'CV upload initialized successfully with Supabase Storage'
    }
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error: any) {
    console.error('CV Upload Init Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Une erreur inattendue s\'est produite lors de l\'initialisation'
      },
      { status: 500 }
    )
  }
}