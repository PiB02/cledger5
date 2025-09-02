import { NextRequest, NextResponse } from 'next/server'
import { cvParser } from '@/lib/cv-parser'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    // Get session ID from URL or headers
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('session_id') || 
                      request.headers.get('x-session-id')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_SESSION_ID',
        message: 'Session ID is required for upload'
      }, { status: 400 })
    }
    
    // Read the file from the request
    const file = await request.blob()
    const buffer = Buffer.from(await file.arrayBuffer())
    
    console.log('File received for session', sessionId, ':', file.size, 'bytes, type:', file.type)
    
    // Parse the document to extract text
    const parsedDoc = await cvParser.parseDocument(buffer, file.type)
    
    console.log('Document parsed successfully:', {
      sessionId,
      textLength: parsedDoc.text.length,
      wordCount: parsedDoc.metadata.wordCount,
      parseTime: parsedDoc.metadata.parseTime
    })
    
    // Validate CV content
    const validation = cvParser.validateCVContent(parsedDoc)
    if (!validation.isValid) {
      console.warn('CV validation warnings for session', sessionId, ':', validation.issues)
    }
    
    // Store the parsed data in Supabase for the processing step
    const supabase = await createSupabaseAdmin()
    
    // Create or update the anonymous CV session
    const { error: dbError } = await supabase
      .from('anonymous_cv_sessions')
      .upsert({
        id: sessionId,
        anonymous_session_id: sessionId, // Using sessionId as anonymous_session_id for now
        filename: 'uploaded_cv.pdf',
        file_size_bytes: file.size,
        file_hash: 'temp-hash', // TODO: Calculate actual hash
        storage_path: `temp/${sessionId}`,
        upload_status: 'completed',
        processing_status: 'pending',
        metadata: {
          parsedText: parsedDoc.text,
          parseMetadata: parsedDoc.metadata,
          validation: validation,
          uploadedAt: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
    
    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to store session data: ${dbError.message}`)
    }
    
    const response = {
      success: true,
      message: 'File uploaded and parsed successfully',
      sessionId: sessionId,
      parsing: {
        textExtracted: parsedDoc.text.length > 0,
        wordCount: parsedDoc.metadata.wordCount,
        charCount: parsedDoc.metadata.charCount,
        parseTime: parsedDoc.metadata.parseTime,
        validation: validation
      },
      // Include first 500 chars for debugging (remove in production)
      textPreview: parsedDoc.text.substring(0, 500) + (parsedDoc.text.length > 500 ? '...' : '')
    }
    
    return NextResponse.json(response, { status: 200 })
    
  } catch (error: any) {
    console.error('Upload Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'UPLOAD_ERROR',
        message: error.message || 'Erreur lors de l\'upload du fichier'
      },
      { status: 500 }
    )
  }
}

