import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'
import { EnrichmentRequestSchema, EnrichmentResponseSchema, type EnrichmentRequest, type EnrichmentResponse } from '@cledger5/types'
import { errorFactory } from '@/lib/errors'
import OpenAI from 'openai'
import { z } from 'zod'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// GPT-4o-mini system prompt for French job market
const SYSTEM_PROMPT = `Tu es un expert en analyse d'offres d'emploi françaises. Tu extrais précisément les compétences, niveaux de séniorité, langues et diplômes requis avec des scores de confiance.

RÈGLES STRICTES :
- Score de confiance entre 0.0 et 1.0 pour chaque extraction
- Seuil minimum global : 0.80 (sinon rejeter)  
- Normaliser compétences : minuscules, sans accents
- Séniorité : intern|junior|mid|senior|lead|manager
- Langues : code ISO + niveau CEFR si détectable
- Diplômes : niveau EQF européen (1-8)

FORMAT JSON REQUIS :
{
  "skills_required": [{"name": "react", "normalized_name": "react", "category": "technical", "confidence": 0.9, "required": true}],
  "skills_preferred": [...],
  "seniority_level": "mid",
  "languages_detected": [{"code": "fr", "name": "français", "level": "C2", "confidence": 0.95, "required": true}],
  "degree_requirements": [{"level_eqf": 6, "degree_type": "Master", "confidence": 0.85}],
  "confidence_scores": {"skills": 0.85, "seniority": 0.90, "languages": 0.80, "degrees": 0.75, "global": 0.825}
}`

// API rate limiting and cost tracking
const RATE_LIMIT_PER_MINUTE = 60
const ESTIMATED_COST_PER_TOKEN = 0.00000015 // GPT-4o-mini pricing

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const adminSecret = request.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw errorFactory.UNAUTHORIZED('Admin access required')
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedRequest: EnrichmentRequest = EnrichmentRequestSchema.parse(body)
    
    const supabase = createRouteHandlerClient()
    
    // Fetch offers to enrich
    const { data: offers, error: fetchError } = await supabase
      .from('offers')
      .select(`
        id,
        title,
        description,
        rome_codes,
        seniority_level,
        created_at
      `)
      .in('id', validatedRequest.offer_ids)
    
    if (fetchError) {
      throw errorFactory.INTERNAL_ERROR(`Failed to fetch offers: ${fetchError.message}`)
    }

    if (!offers || offers.length === 0) {
      throw errorFactory.NOT_FOUND('No offers found for provided IDs')
    }

    // Check for existing enrichments (unless force_reprocess)
    let offersToProcess = offers
    if (!validatedRequest.force_reprocess) {
      const { data: existingEnrichments } = await supabase
        .from('offer_enrichment')
        .select('offer_id, enrichment_status, confidence_scores, processed_at')
        .in('offer_id', validatedRequest.offer_ids)
        .eq('enrichment_status', 'completed')
        .gte('confidence_scores->global', validatedRequest.confidence_threshold)

      if (existingEnrichments && existingEnrichments.length > 0) {
        const existingOfferIds = existingEnrichments.map(e => e.offer_id)
        offersToProcess = offers.filter(offer => !existingOfferIds.includes(offer.id))
        
        console.log(`Skipping ${existingEnrichments.length} offers with existing high-quality enrichments`)
      }
    }

    const startTime = Date.now()
    const enrichments: any[] = []
    const errors: any[] = []
    let totalTokensUsed = 0

    // Process each offer with GPT-4o-mini
    for (const offer of offersToProcess) {
      try {
        console.log(`Processing offer ${offer.id}: ${offer.title}`)
        
        // Create enrichment record with pending status
        const { data: enrichmentRecord, error: createError } = await supabase
          .from('offer_enrichment')
          .insert({
            offer_id: offer.id,
            enrichment_status: 'processing',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error(`Failed to create enrichment record for ${offer.id}:`, createError)
          errors.push({
            offer_id: offer.id,
            error: `Database error: ${createError.message}`,
            retryable: true
          })
          continue
        }

        // Prepare input text for GPT-4o-mini
        const inputText = `TITRE: ${offer.title}

DESCRIPTION: ${offer.description || 'Non spécifiée'}

CODES ROME EXISTANTS: ${offer.rome_codes?.join(', ') || 'Non spécifiés'}`

        // Call GPT-4o-mini for extraction
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: inputText }
          ],
          temperature: 0.1, // Low temperature for consistent extraction
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        })

        const usage = completion.usage
        totalTokensUsed += usage?.total_tokens || 0

        if (!completion.choices[0]?.message?.content) {
          throw new Error('No response from GPT-4o-mini')
        }

        // Parse GPT response
        let extractedData
        try {
          extractedData = JSON.parse(completion.choices[0].message.content)
        } catch (parseError) {
          throw new Error(`Failed to parse GPT response as JSON: ${parseError}`)
        }

        // Validate confidence threshold
        const globalConfidence = extractedData.confidence_scores?.global || 0
        const status = globalConfidence >= validatedRequest.confidence_threshold ? 'completed' : 'low_confidence'

        // Update enrichment record with results
        const { error: updateError } = await supabase
          .from('offer_enrichment')
          .update({
            enrichment_status: status,
            skills_required: extractedData.skills_required || [],
            skills_preferred: extractedData.skills_preferred || [],
            seniority_level: extractedData.seniority_level,
            languages_detected: extractedData.languages_detected || [],
            degree_requirements: extractedData.degree_requirements || [],
            confidence_scores: extractedData.confidence_scores,
            rome_codes_suggested: extractedData.rome_codes_suggested || [],
            job_category_detected: extractedData.job_category_detected,
            tokens_used: usage?.total_tokens || 0,
            processing_time_ms: Date.now() - startTime,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', enrichmentRecord.id)

        if (updateError) {
          throw new Error(`Failed to update enrichment: ${updateError.message}`)
        }

        // Add to successful enrichments (if meets threshold or include_low_confidence)
        if (status === 'completed' || validatedRequest.include_low_confidence) {
          enrichments.push({
            id: enrichmentRecord.id,
            offer_id: offer.id,
            ...extractedData,
            enrichment_status: status,
            processed_at: new Date().toISOString()
          })
        }

        console.log(`✅ Processed offer ${offer.id} - Confidence: ${globalConfidence.toFixed(3)} - Status: ${status}`)

      } catch (offerError: any) {
        console.error(`❌ Failed to process offer ${offer.id}:`, offerError)
        
        // Mark enrichment as failed
        await supabase
          .from('offer_enrichment')
          .update({
            enrichment_status: 'failed',
            error_message: offerError.message,
            processed_at: new Date().toISOString()
          })
          .eq('offer_id', offer.id)
          .eq('enrichment_status', 'processing')

        errors.push({
          offer_id: offer.id,
          error: offerError.message,
          retryable: offerError.code === 'rate_limit_exceeded'
        })
      }

      // Rate limiting: small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const totalTime = Date.now() - startTime
    const estimatedCost = totalTokensUsed * ESTIMATED_COST_PER_TOKEN

    // Prepare response
    const response: EnrichmentResponse = {
      success: errors.length === 0,
      processed_count: enrichments.length,
      enrichments,
      errors,
      cost_estimate: {
        tokens_used: totalTokensUsed,
        estimated_cost_usd: estimatedCost
      },
      processing_stats: {
        total_time_ms: totalTime,
        avg_confidence: enrichments.length > 0 
          ? enrichments.reduce((sum, e) => sum + (e.confidence_scores?.global || 0), 0) / enrichments.length 
          : 0,
        success_rate: offersToProcess.length > 0 
          ? enrichments.filter(e => e.enrichment_status === 'completed').length / offersToProcess.length 
          : 0
      }
    }

    console.log(`🎉 Enrichment completed: ${enrichments.length}/${offersToProcess.length} successful, ${errors.length} errors`)
    console.log(`💰 Cost: $${estimatedCost.toFixed(4)}, Time: ${totalTime}ms, Tokens: ${totalTokensUsed}`)

    return NextResponse.json(EnrichmentResponseSchema.parse(response))

  } catch (error: any) {
    console.error('Enrichment API error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request format', details: error.errors },
        { status: 400 }
      )
    }

    if (error.status) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method to check enrichment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const offerIds = searchParams.get('offer_ids')?.split(',')
    
    if (!offerIds || offerIds.length === 0) {
      throw errorFactory.BAD_REQUEST('offer_ids parameter required')
    }

    const supabase = createRouteHandlerClient()
    
    const { data: enrichments, error } = await supabase
      .from('offer_enrichment')
      .select(`
        offer_id,
        enrichment_status,
        confidence_scores,
        processed_at,
        error_message
      `)
      .in('offer_id', offerIds)
      .order('processed_at', { ascending: false })

    if (error) {
      throw errorFactory.INTERNAL_ERROR(`Failed to fetch enrichments: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      enrichments: enrichments || []
    })

  } catch (error: any) {
    console.error('GET enrichment status error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}