import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase/server'
import { withErrorHandler, errorFactory } from '@/lib/errors'
import { buildEmbeddingText } from '@cledger5/utils/embedding-text-builder'
import { CVAIExtractionSchema, CVEmbeddingContext } from '@cledger5/types/cv'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/cv/process
 * Process a CV document through the AI pipeline
 * This endpoint is called by the queue worker system
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // Verify service role or admin access
    const { userId } = await auth()
    if (!userId) {
      throw errorFactory('UNAUTHORIZED', 'Authentication required')
    }

    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      throw errorFactory('VALIDATION_ERROR', 'session_id required')
    }

    // Get upload session
    const { data: session, error: sessionError } = await supabase
      .from('cv_upload_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      throw errorFactory('NOT_FOUND', 'Upload session not found')
    }

    // Verify user owns this session
    if (session.user_id !== userId) {
      throw errorFactory('FORBIDDEN', 'Access denied to this session')
    }

    // Mark session as processing
    await supabase
      .from('cv_upload_sessions')
      .update({ 
        upload_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', session_id)

    try {
      // Step 1: Extract text from uploaded file
      const extractedText = await extractTextFromFile(session.storage_path)
      
      // Step 2: Process with GPT-4o-mini
      const aiExtraction = await processWithGPT(extractedText, session.filename)
      
      // Step 3: Create CV profile record
      const cvProfile = await createCVProfile(session_id, session.user_id, aiExtraction)
      
      // Step 4: Generate embedding text
      const embeddingText = buildEmbeddingText('cv', convertToEmbeddingFormat(aiExtraction))
      
      // Step 5: Generate embedding using OpenAI
      const embedding = await generateEmbedding(embeddingText)
      
      // Step 6: Store embedding
      await storeCVEmbedding(cvProfile.id, embeddingText, embedding, aiExtraction.confidence_scores.global)
      
      // Step 7: Mark session as completed
      await supabase
        .from('cv_upload_sessions')
        .update({ 
          upload_status: 'completed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', session_id)

      // Record final metrics
      await recordProcessingMetrics(session_id, 'success', {
        total_time_seconds: (Date.now() - new Date(session.processing_started_at || session.created_at).getTime()) / 1000,
        confidence_score: aiExtraction.confidence_scores.global,
        embedding_length: embedding.length
      })

      return NextResponse.json({ 
        success: true, 
        cv_profile_id: cvProfile.id,
        confidence_score: aiExtraction.confidence_scores.global
      })

    } catch (error) {
      console.error('CV processing error:', error)
      
      // Mark session as failed
      await supabase
        .from('cv_upload_sessions')
        .update({ 
          upload_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Processing failed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', session_id)

      await recordProcessingMetrics(session_id, 'failure', {
        error_type: error instanceof Error ? error.name : 'UnknownError',
        error_message: error instanceof Error ? error.message : 'Processing failed'
      })

      throw error
    }
  })
}

/**
 * Extract text content from uploaded file
 */
async function extractTextFromFile(storagePath: string): Promise<string> {
  // Download file from Supabase Storage
  const { data, error } = await supabase.storage
    .from('cv-documents')
    .download(storagePath)

  if (error || !data) {
    throw errorFactory('STORAGE_ERROR', 'Failed to download uploaded file')
  }

  // Convert to buffer for processing
  const buffer = await data.arrayBuffer()
  
  // Detect file type and extract text accordingly
  if (storagePath.endsWith('.pdf')) {
    return await extractPDFText(buffer)
  } else if (storagePath.endsWith('.docx')) {
    return await extractWordText(buffer)
  } else {
    throw errorFactory('VALIDATION_ERROR', 'Unsupported file format')
  }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractPDFText(buffer: ArrayBuffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  
  try {
    const pdf = await pdfParse(Buffer.from(buffer))
    
    // Clean and validate extracted text
    const text = pdf.text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    if (text.length < 100) {
      throw new Error('PDF seems empty or text extraction failed (too short)')
    }
    
    if (text.length > 50000) {
      // Truncate very long documents to avoid token limits
      return text.slice(0, 50000) + '\n[Document truncated for processing]'
    }
    
    return text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw errorFactory('PDF_EXTRACTION_ERROR', `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from Word document using mammoth
 */
async function extractWordText(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth')
  
  try {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    
    // Clean and validate extracted text
    const text = result.value
      .replace(/\s+/g, ' ') // Normalize whitespace  
      .trim()
    
    if (text.length < 100) {
      throw new Error('Word document seems empty or text extraction failed (too short)')
    }
    
    if (text.length > 50000) {
      // Truncate very long documents to avoid token limits
      return text.slice(0, 50000) + '\n[Document truncated for processing]'
    }
    
    // Log any messages/warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.warn('Word extraction warnings:', result.messages.map(m => m.message).join(', '))
    }
    
    return text
  } catch (error) {
    console.error('Word extraction error:', error)
    throw errorFactory('WORD_EXTRACTION_ERROR', `Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Process extracted text with GPT-4o-mini
 */
async function processWithGPT(extractedText: string, filename: string) {
  const systemPrompt = `Tu es un expert en analyse de CV français. Tu extrais précisément les informations professionnelles avec des scores de confiance.

CONTEXTE: Candidat français cherchant un emploi - extraire profil, compétences, expérience, formation, préférences.

RÈGLES STRICTES :
- Score de confiance entre 0.0 et 1.0 pour chaque extraction
- Seuil minimum global : 0.80 (sinon rejeter)  
- Normaliser compétences : minuscules, sans accents
- Séniorité basée sur expérience : intern(<1an)|junior(1-3ans)|mid(3-7ans)|senior(7+ans)|lead|manager
- Langues : code ISO + niveau CEFR si détectable
- Formation : niveau EQF européen (1-8), prendre le plus élevé
- ROME codes basés sur expérience professionnelle

FORMAT JSON REQUIS :
{
  "profile": {
    "title_canonical": "développeur web full-stack",
    "location_preferred": {"city": "Paris", "department_code": "75", "region_code": "11"},
    "availability": "2025-03",
    "seniority_level": "mid"
  },
  "skills_mastered": [{"name": "react", "normalized_name": "react", "years_experience": 3, "confidence": 0.9}],
  "skills_learning": [{"name": "vue.js", "normalized_name": "vue js", "confidence": 0.7}],
  "experience": {
    "total_years": 4,
    "rome_codes_detected": ["M1805", "M1806"],
    "previous_roles": [{"title": "développeur frontend", "duration_months": 24, "company": "TechCorp"}]
  },
  "education": {
    "highest_degree": {"level_eqf": 6, "degree_type": "Master Informatique", "confidence": 0.95}
  },
  "languages": [{"code": "fr", "cefr_level": 6, "confidence": 1.0}, {"code": "en", "cefr_level": 4, "confidence": 0.8}],
  "preferences": {
    "contract_types": ["CDI", "CDD"],
    "work_modes": ["remote", "hybrid"],
    "salary_expectation": {"min": 45000, "max": 55000, "period": "annual"}
  },
  "confidence_scores": {"profile": 0.9, "skills": 0.85, "experience": 0.92, "education": 0.88, "global": 0.89}
}`

  const userPrompt = `Analyse ce CV français (fichier: ${filename}):\n\n${extractedText.slice(0, 8000)}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1,
    max_tokens: 1500
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw errorFactory('AI_ERROR', 'No response from GPT-4o-mini')
  }

  try {
    const parsed = JSON.parse(content)
    return CVAIExtractionSchema.parse(parsed)
  } catch (error) {
    console.error('GPT response parsing error:', error)
    console.error('GPT raw response:', content)
    throw errorFactory('AI_ERROR', 'Failed to parse GPT-4o-mini response')
  }
}

/**
 * Create CV profile record in database
 */
async function createCVProfile(sessionId: string, userId: string, aiExtraction: any) {
  const { data: profile, error } = await supabase
    .from('cv_profiles')
    .insert({
      upload_session_id: sessionId,
      user_id: userId,
      title_canonical: aiExtraction.profile.title_canonical,
      rome_codes: aiExtraction.experience.rome_codes_detected,
      city: aiExtraction.profile.location_preferred.city,
      department_code: aiExtraction.profile.location_preferred.department_code,
      region_code: aiExtraction.profile.location_preferred.region_code,
      career_level: aiExtraction.profile.seniority_level,
      total_experience_years: aiExtraction.experience.total_years,
      highest_degree_eqf: aiExtraction.education.highest_degree?.level_eqf || null,
      languages: aiExtraction.languages,
      availability: aiExtraction.profile.availability,
      preferences: aiExtraction.preferences,
      ai_confidence_global: aiExtraction.confidence_scores.global,
      ai_confidence_breakdown: aiExtraction.confidence_scores,
      raw_ai_extraction: aiExtraction,
    })
    .select()
    .single()

  if (error) {
    console.error('CV profile creation error:', error)
    throw errorFactory('DATABASE_ERROR', 'Failed to create CV profile')
  }

  return profile
}

/**
 * Convert AI extraction to embedding format
 */
function convertToEmbeddingFormat(aiExtraction: any): any {
  return {
    title_canonical: aiExtraction.profile.title_canonical,
    rome_codes: aiExtraction.experience.rome_codes_detected,
    city: aiExtraction.profile.location_preferred.city,
    department_code: aiExtraction.profile.location_preferred.department_code,
    region_code: aiExtraction.profile.location_preferred.region_code,
    career_level: aiExtraction.profile.seniority_level,
    contract_type_code: aiExtraction.preferences.contract_types?.[0] || 'FLEXIBLE',
    work_mode_code: aiExtraction.preferences.work_modes?.[0] || 'flexible',
    languages: aiExtraction.languages?.map((lang: any) => ({
      code: lang.code,
      cefr: lang.cefr_level
    })) || [],
    degree_top_eqf: aiExtraction.education.highest_degree?.level_eqf || null,
    skills_mastered: aiExtraction.skills_mastered?.map((skill: any) => skill.normalized_name) || [],
    skills_learning: aiExtraction.skills_learning?.map((skill: any) => skill.normalized_name) || [],
    salary_min: aiExtraction.preferences.salary_expectation?.min || null,
    salary_max: aiExtraction.preferences.salary_expectation?.max || null,
    salary_period: aiExtraction.preferences.salary_expectation?.period || null,
    availability: aiExtraction.profile.availability,
  }
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

/**
 * Store CV embedding in database
 */
async function storeCVEmbedding(cvProfileId: string, embeddingText: string, embedding: number[], confidence: number) {
  const { error } = await supabase
    .from('cv_embeddings')
    .insert({
      cv_profile_id: cvProfileId,
      kind: 'semantic',
      embedding_text: embeddingText,
      embedding: embedding,
      confidence_score: confidence,
      model: 'text-embedding-3-small',
      version: '1.0'
    })

  if (error) {
    console.error('CV embedding storage error:', error)
    throw errorFactory('DATABASE_ERROR', 'Failed to store CV embedding')
  }
}

/**
 * Record processing metrics
 */
async function recordProcessingMetrics(sessionId: string, outcome: 'success' | 'failure', metrics: any) {
  await supabase
    .from('cv_processing_metrics')
    .insert({
      upload_session_id: sessionId,
      metric_type: 'processing_outcome',
      metric_value: outcome === 'success' ? 1 : 0,
      metric_unit: 'boolean',
      processing_stage: 'complete',
      metadata: metrics
    })
}