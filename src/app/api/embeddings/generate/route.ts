import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase/route-handler'
import { errorFactory } from '@/lib/errors'
import { buildEmbeddingText, hashEmbeddingText } from '@cledger5/utils'
import { requireAdmin } from '@/lib/supabase/clerk'
import OpenAI from 'openai'
import { z } from 'zod'

// Request/Response schemas
const EmbeddingRequestSchema = z.object({
  offer_ids: z.array(z.string().uuid()).min(1).max(50),
  force_regenerate: z.boolean().default(false),
  batch_size: z.number().min(1).max(20).default(10)
})

const EmbeddingResponseSchema = z.object({
  success: z.boolean(),
  processed_count: z.number(),
  embeddings: z.array(z.object({
    offer_id: z.string().uuid(),
    kind: z.string(),
    embedding_text: z.string(),
    embedding_hash: z.string(),
    dimensions: z.number(),
    created_at: z.string()
  })),
  errors: z.array(z.object({
    offer_id: z.string().uuid(),
    error: z.string(),
    retryable: z.boolean()
  })),
  cost_estimate: z.object({
    tokens_used: z.number(),
    estimated_cost_usd: z.number()
  }),
  processing_stats: z.object({
    total_time_ms: z.number(),
    avg_text_length: z.number(),
    success_rate: z.number()
  })
})

type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>
type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// text-embedding-3-small pricing (per 1K tokens)
const EMBEDDING_COST_PER_1K_TOKENS = 0.00002

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication using Clerk
    await requireAdmin()

    // Parse and validate request body
    const body = await request.json()
    const validatedRequest: EmbeddingRequest = EmbeddingRequestSchema.parse(body)
    
    const supabase = createSupabaseServiceRole()
    
    // Fetch offers with enrichment data for embedding text generation
    const { data: offers, error: fetchError } = await supabase
      .from('offers')
      .select(`
        id,
        title,
        rome_codes,
        career_level,
        contract_type_code,
        work_mode_code,
        contract_start_date,
        salary_min,
        salary_max,
        salary_period,
        companies!offers_company_id_fkey (
          name
        ),
        locations!offers_location_id_fkey (
          city,
          department_code,
          region_code
        ),
        offer_enrichment!inner (
          skills_required,
          skills_preferred,
          seniority_level,
          languages_detected,
          degree_requirements,
          enrichment_status,
          confidence_scores
        )
      `)
      .in('id', validatedRequest.offer_ids)
      .eq('offer_enrichment.enrichment_status', 'completed')
    
    if (fetchError) {
      throw errorFactory.INTERNAL(`Failed to fetch offers: ${fetchError.message}`)
    }

    if (!offers || offers.length === 0) {
      throw errorFactory.NOT_FOUND('No enriched offers found for provided IDs')
    }

    // Check for existing embeddings (unless force_regenerate)
    let offersToProcess = offers
    if (!validatedRequest.force_regenerate) {
      const { data: existingEmbeddings } = await supabase
        .from('offer_embeddings')
        .select('offer_id, created_at')
        .in('offer_id', validatedRequest.offer_ids)
        .eq('kind', 'semantic')
        .not('embedding', 'is', null)

      if (existingEmbeddings && existingEmbeddings.length > 0) {
        const existingOfferIds = existingEmbeddings.map(e => e.offer_id)
        offersToProcess = offers.filter(offer => !existingOfferIds.includes(offer.id))
        
        console.log(`Skipping ${existingEmbeddings.length} offers with existing semantic embeddings`)
      }
    }

    const startTime = Date.now()
    const embeddings: any[] = []
    const errors: any[] = []
    let totalTokensUsed = 0
    let totalTextLength = 0

    // Process offers in batches
    for (let i = 0; i < offersToProcess.length; i += validatedRequest.batch_size) {
      const batch = offersToProcess.slice(i, i + validatedRequest.batch_size)
      
      try {
        console.log(`Processing embedding batch ${Math.floor(i/validatedRequest.batch_size) + 1}: ${batch.length} offers`)
        
        // Generate embedding texts for batch
        const embeddingTexts: Array<{ offer_id: string, text: string, hash: string }> = []
        
        for (const offer of batch) {
          try {
            const enrichment = Array.isArray(offer.offer_enrichment) ? offer.offer_enrichment[0] : offer.offer_enrichment
            const company = Array.isArray(offer.companies) ? offer.companies[0] : offer.companies
            const location = Array.isArray(offer.locations) ? offer.locations[0] : offer.locations
            
            // Build standardized embedding text
            const embeddingInput = {
              title_canonical: offer.title,
              rome_codes: offer.rome_codes || [],
              city: location?.city,
              department_code: location?.department_code,
              region_code: location?.region_code,
              career_level: enrichment?.seniority_level || offer.career_level,
              contract_type_code: offer.contract_type_code,
              work_mode_code: offer.work_mode_code,
              languages: enrichment?.languages_detected?.map((lang: any) => ({
                code: lang.code,
                cefr: lang.level === 'A1' ? 1 : lang.level === 'A2' ? 2 : lang.level === 'B1' ? 3 : lang.level === 'B2' ? 4 : lang.level === 'C1' ? 5 : lang.level === 'C2' ? 6 : undefined
              })) || [],
              degree_min_eqf: enrichment?.degree_requirements?.[0]?.level_eqf,
              skills_required: enrichment?.skills_required?.map((skill: any) => skill.normalized_name || skill.name) || [],
              skills_preferred: enrichment?.skills_preferred?.map((skill: any) => skill.normalized_name || skill.name) || [],
              salary_min: offer.salary_min ? Number(offer.salary_min) : undefined,
              salary_max: offer.salary_max ? Number(offer.salary_max) : undefined,
              salary_period: offer.salary_period,
              contract_start_date: offer.contract_start_date
            }

            const embeddingText = buildEmbeddingText('offer', embeddingInput)
            const embeddingHash = await hashEmbeddingText(embeddingText)
            
            embeddingTexts.push({
              offer_id: offer.id,
              text: embeddingText,
              hash: embeddingHash
            })
            
            totalTextLength += embeddingText.length
            
          } catch (textError: any) {
            console.error(`Failed to generate embedding text for offer ${offer.id}:`, textError)
            errors.push({
              offer_id: offer.id,
              error: `Text generation failed: ${textError.message}`,
              retryable: false
            })
          }
        }

        if (embeddingTexts.length === 0) {
          continue
        }

        // Generate embeddings for batch
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: embeddingTexts.map(et => et.text),
          encoding_format: 'float'
        })

        totalTokensUsed += response.usage.total_tokens

        // Store embeddings in database
        for (let j = 0; j < embeddingTexts.length; j++) {
          const embeddingData = embeddingTexts[j]
          const embedding = response.data[j]

          try {
            // Convert embedding hash from hex string to bytea
            const hashBuffer = Buffer.from(embeddingData.hash, 'hex')
            
            // Upsert embedding record
            const { data: embeddingRecord, error: upsertError } = await supabase
              .from('offer_embeddings')
              .upsert({
                offer_id: embeddingData.offer_id,
                kind: 'semantic',
                model: 'text-embedding-3-small',
                dim: embedding.embedding.length,
                embedding: `[${embedding.embedding.join(',')}]`,
                text_used_hash: hashBuffer,
                created_at: new Date().toISOString()
              }, {
                onConflict: 'offer_id,kind'
              })
              .select()
              .single()

            if (upsertError) {
              throw new Error(`Database upsert failed: ${upsertError.message}`)
            }

            embeddings.push({
              offer_id: embeddingData.offer_id,
              kind: 'semantic',
              embedding_text: embeddingData.text,
              embedding_hash: embeddingData.hash,
              dimensions: embedding.embedding.length,
              created_at: new Date().toISOString()
            })

            console.log(`✅ Generated embedding for offer ${embeddingData.offer_id} (${embeddingData.text.length} chars)`)

          } catch (dbError: any) {
            console.error(`Database error for offer ${embeddingData.offer_id}:`, dbError)
            errors.push({
              offer_id: embeddingData.offer_id,
              error: `Database error: ${dbError.message}`,
              retryable: true
            })
          }
        }

        // Rate limiting: delay between batches
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (batchError: any) {
        console.error(`Batch processing error:`, batchError)
        
        // Mark all offers in failed batch
        for (const offer of batch) {
          errors.push({
            offer_id: offer.id,
            error: `Batch processing failed: ${batchError.message}`,
            retryable: batchError.code === 'rate_limit_exceeded'
          })
        }
      }
    }

    const totalTime = Date.now() - startTime
    const estimatedCost = (totalTokensUsed / 1000) * EMBEDDING_COST_PER_1K_TOKENS

    // Prepare response
    const response: EmbeddingResponse = {
      success: errors.length === 0,
      processed_count: embeddings.length,
      embeddings,
      errors,
      cost_estimate: {
        tokens_used: totalTokensUsed,
        estimated_cost_usd: estimatedCost
      },
      processing_stats: {
        total_time_ms: totalTime,
        avg_text_length: embeddings.length > 0 ? Math.round(totalTextLength / embeddings.length) : 0,
        success_rate: offersToProcess.length > 0 ? embeddings.length / offersToProcess.length : 0
      }
    }

    console.log(`🎉 Embedding generation completed: ${embeddings.length}/${offersToProcess.length} successful, ${errors.length} errors`)
    console.log(`💰 Cost: $${estimatedCost.toFixed(6)}, Time: ${totalTime}ms, Tokens: ${totalTokensUsed}`)

    return NextResponse.json(EmbeddingResponseSchema.parse(response))

  } catch (error: any) {
    console.error('Embedding generation API error:', error)
    
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

// GET method to check embedding status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const offerIds = searchParams.get('offer_ids')?.split(',')
    
    if (!offerIds || offerIds.length === 0) {
      throw errorFactory.BAD_REQUEST('offer_ids parameter required')
    }

    const supabase = createSupabaseServiceRole()
    
    const { data: embeddings, error } = await supabase
      .from('offer_embeddings')
      .select(`
        offer_id,
        kind,
        dim,
        model,
        created_at
      `)
      .in('offer_id', offerIds)
      .not('embedding', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw errorFactory.INTERNAL(`Failed to fetch embeddings: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      embeddings: embeddings || []
    })

  } catch (error: any) {
    console.error('GET embedding status error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}