import { NextRequest, NextResponse } from 'next/server'
import { cvParser } from '@/lib/cv-parser'
import { cvAIAnalyzer } from '@/lib/cv-ai-analyzer'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionToken = request.headers.get('x-anonymous-session-token')
    
    console.log('Processing request:', { body, sessionToken })
    
    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_TOKEN',
          message: 'Session token is required'
        },
        { status: 400 }
      )
    }
    
    if (!body.session_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_SESSION_ID',
          message: 'Session ID is required'
        },
        { status: 400 }
      )
    }
    
    // Get the parsed CV text from Supabase using session_id
    const supabase = await createSupabaseAdmin()
    
    const { data: sessionData, error: fetchError } = await supabase
      .from('anonymous_cv_sessions')
      .select('*')
      .eq('id', body.session_id)
      .single()
    
    if (fetchError || !sessionData) {
      console.error('Failed to fetch session data:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Session data not found or expired'
      }, { status: 404 })
    }
    
    if (!sessionData.metadata?.parsedText) {
      console.log('No parsed text found for session, attempting to parse file:', body.session_id)
      
      // Try to download and parse the CV file from storage
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('cv-documents')
          .download(sessionData.storage_path)
        
        if (downloadError || !fileData) {
          console.error('Failed to download CV file:', downloadError)
          return NextResponse.json({
            success: false,
            error: 'FILE_NOT_FOUND',
            message: 'CV file not found in storage'
          }, { status: 404 })
        }
        
        console.log('Downloaded CV file, attempting to parse...')
        
        // Parse the CV file
        const parsed = await cvParser.parseDocument(
          Buffer.from(await fileData.arrayBuffer()),
          fileData.type
        )
        
        const parseResult = {
          success: true,
          text: parsed.text,
          metadata: parsed.metadata
        }
        
        if (!parseResult.success || !parseResult.text) {
          console.error('Failed to parse CV file:', parseResult.error)
          return NextResponse.json({
            success: false,
            error: 'PARSE_FAILED',
            message: 'Failed to parse CV content'
          }, { status: 400 })
        }
        
        console.log('CV parsed successfully, text length:', parseResult.text.length)
        
        // Update session with parsed text
        await supabase
          .from('anonymous_cv_sessions')
          .update({
            upload_status: 'completed',
            metadata: {
              parsedText: parseResult.text,
              parseMetadata: parseResult.metadata
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', body.session_id)
        
        // Update sessionData for the rest of the processing
        sessionData.metadata = {
          parsedText: parseResult.text,
          parseMetadata: parseResult.metadata
        }
        
      } catch (parseError: any) {
        console.error('File parsing error:', parseError)
        return NextResponse.json({
          success: false,
          error: 'PARSE_ERROR',
          message: 'Error parsing CV file: ' + parseError.message
        }, { status: 500 })
      }
    }
    
    // Update session status to processing
    await supabase
      .from('anonymous_cv_sessions')
      .update({
        processing_status: 'processing',
        processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', body.session_id)
    
    // If we have parsed text, perform real AI analysis
    try {
      console.log('Starting AI analysis for CV text:', sessionData.metadata.parsedText.substring(0, 100) + '...')
      
      const analysisResult = await cvAIAnalyzer.analyzeCVText({
        text: sessionData.metadata.parsedText,
        metadata: sessionData.metadata.parseMetadata || { wordCount: 0, charCount: 0, parseTime: 0, mimeType: 'unknown' }
      })
      
      console.log('AI analysis completed:', {
        confidence: analysisResult.analysisMetadata.confidence,
        tokensUsed: analysisResult.analysisMetadata.tokensUsed,
        skillsFound: analysisResult.skills.technical.length + analysisResult.skills.soft.length
      })
      
      // Generate embeddings for the CV text
      console.log('Generating embeddings for CV text...')
      const embedding = await cvAIAnalyzer.generateEmbedding(sessionData.metadata.parsedText, 'semantic')
      console.log('Embeddings generated:', { dimensions: embedding.length })
      
      // Store the analysis result in Supabase
      await supabase
        .from('anonymous_cv_sessions')
        .update({
          processing_status: 'completed',
          processing_completed_at: new Date().toISOString(),
          full_results_available: true,
          partial_results: {
            aiAnalysis: analysisResult,
            confidence: analysisResult.analysisMetadata.confidence,
            tokensUsed: analysisResult.analysisMetadata.tokensUsed,
            skillsCount: analysisResult.skills.technical.length + analysisResult.skills.soft.length,
            embedding: {
              dimensions: embedding.length,
              model: 'text-embedding-3-small',
              vector: embedding
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', body.session_id)
      
      return NextResponse.json({
        success: true,
        processing_id: 'proc-' + Date.now(),
        status: 'completed',
        analysis: {
          confidence: analysisResult.analysisMetadata.confidence,
          tokensUsed: analysisResult.analysisMetadata.tokensUsed,
          skillsCount: analysisResult.skills.technical.length + analysisResult.skills.soft.length,
          experienceLevel: analysisResult.summary.careerLevel,
          yearsExperience: analysisResult.summary.yearsExperience,
          romeCodes: analysisResult.romeCodes.map(r => r.code),
          languages: analysisResult.skills.languages.map(l => `${l.language}-${l.level}`),
          embeddingDimensions: embedding.length,
          embeddingModel: 'text-embedding-3-small'
        },
        message: 'CV analyzed successfully with AI'
      }, { status: 200 })
      
    } catch (aiError: any) {
      console.error('AI Analysis Error:', aiError)
      
      return NextResponse.json({
        success: false,
        error: 'AI_ANALYSIS_ERROR',
        message: `AI analysis failed: ${aiError.message}`
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('CV Process Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'PROCESS_ERROR', 
        message: 'Erreur lors du traitement du CV'
      },
      { status: 500 }
    )
  }
}