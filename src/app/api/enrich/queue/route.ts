import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase/route-handler'
import { errorFactory } from '@/lib/errors'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_SECRET) {
      throw errorFactory.UNAUTHORIZED('Invalid admin secret')
    }

    const supabase = createSupabaseServiceRole()
    
    // Récupérer les offres en attente d'enrichissement (max 20 par batch)
    const { data: pendingOffers, error: fetchError } = await supabase
      .from('offer_enrichment')
      .select(`
        offer_id,
        offers!inner(
          id,
          title,
          description,
          rome_codes,
          career_level,
          created_at
        )
      `)
      .eq('enrichment_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20)
    
    if (fetchError) {
      throw errorFactory.INTERNAL(`Failed to fetch pending offers: ${fetchError.message}`)
    }

    if (!pendingOffers || pendingOffers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending offers to process',
        processed: 0
      })
    }

    console.log(`🤖 Processing ${pendingOffers.length} pending offers for AI enrichment`)
    
    let processed = 0
    let successful = 0
    let failed = 0

    // Traiter chaque offre
    for (const pending of pendingOffers) {
      try {
        const offer = pending.offers
        
        // Marquer comme "processing"
        await supabase
          .from('offer_enrichment')
          .update({
            enrichment_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('offer_id', offer.id)

        // Appeler GPT-4o-mini pour l'enrichissement
        const prompt = `Analyze this job offer and extract structured information:

Title: ${offer.title}
Description: ${offer.description || 'No description'}
ROME codes: ${offer.rome_codes?.join(', ') || 'None'}

Extract:
1. Required skills (with confidence 0-1)
2. Seniority level (intern, junior, mid, senior, lead, manager)  
3. Languages detected (with CEFR levels)
4. Degree requirements (with EQF levels)

Return JSON format:
{
  "skills_required": [{"name": "skill", "category": "technical", "confidence": 0.9}],
  "seniority_level": "mid", 
  "languages_detected": [{"language": "French", "level": "C1", "confidence": 0.8}],
  "degree_requirements": [{"level": "Bachelor", "eqf_level": 6, "confidence": 0.7}],
  "confidence_scores": {"skills": 0.85, "seniority": 0.90, "languages": 0.75, "degrees": 0.70, "global": 0.80}
}`

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        })

        const aiResponse = completion.choices[0]?.message?.content
        const tokensUsed = completion.usage?.total_tokens || 0
        
        if (!aiResponse) {
          throw new Error('No AI response received')
        }

        // Parser la réponse JSON
        const enrichment = JSON.parse(aiResponse)
        const globalConfidence = enrichment.confidence_scores?.global || 0
        
        // Déterminer le statut basé sur la confiance
        const status = globalConfidence >= 0.80 ? 'completed' : 'low_confidence'
        
        // Sauvegarder l'enrichissement
        const { error: updateError } = await supabase
          .from('offer_enrichment')
          .update({
            enrichment_status: status,
            seniority_level: enrichment.seniority_level,
            confidence_scores: enrichment.confidence_scores,
            skills_required: enrichment.skills_required || [],
            languages_detected: enrichment.languages_detected || [],
            degree_requirements: enrichment.degree_requirements || [],
            tokens_used: tokensUsed,
            processing_time_ms: 1000, // Approximation
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('offer_id', offer.id)

        if (updateError) {
          throw new Error(`Failed to save enrichment: ${updateError.message}`)
        }

        console.log(`✅ Enriched offer ${offer.id} - Confidence: ${globalConfidence} - Status: ${status}`)
        successful++
        
      } catch (error) {
        console.error(`❌ Failed to enrich offer ${pending.offer_id}:`, error)
        
        // Marquer comme failed avec message d'erreur
        await supabase
          .from('offer_enrichment')
          .update({
            enrichment_status: 'failed',
            error_msg: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('offer_id', pending.offer_id)
        
        failed++
      }
      
      processed++
    }

    const response = {
      success: true,
      processed,
      successful,
      failed,
      message: `Processed ${processed} offers: ${successful} successful, ${failed} failed`
    }

    console.log(`🎉 Queue processing completed: ${response.message}`)
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Queue processing error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Queue processing failed',
        processed: 0
      },
      { status: error.statusCode || 500 }
    )
  }
}