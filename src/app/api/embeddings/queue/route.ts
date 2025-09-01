import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase/route-handler'
import { errorFactory } from '@/lib/errors'
import { z } from 'zod'

const QueueRequestSchema = z.object({
  batch_size: z.number().min(1).max(50).default(20),
  source_filter: z.string().optional(), // 'LBA', 'FT', etc.
  force_regenerate: z.boolean().default(false)
})

type QueueRequest = z.infer<typeof QueueRequestSchema>

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const adminSecret = request.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw errorFactory.UNAUTHORIZED('Admin access required')
    }

    const body = await request.json()
    const validatedRequest: QueueRequest = QueueRequestSchema.parse(body)
    
    const supabase = createSupabaseServiceRole()
    
    // Find offers that need embedding generation
    let query = supabase
      .from('offers')
      .select(`
        id,
        title,
        source_primary,
        created_at,
        offer_enrichment!inner (
          enrichment_status,
          confidence_scores
        )
      `)
      .eq('offer_enrichment.enrichment_status', 'completed')
      .gte('offer_enrichment.confidence_scores->global', 0.80)

    // Apply source filter if specified
    if (validatedRequest.source_filter) {
      query = query.eq('source_primary', validatedRequest.source_filter)
    }

    // Filter out offers that already have embeddings (unless force_regenerate)
    if (!validatedRequest.force_regenerate) {
      const { data: existingEmbeddings } = await supabase
        .from('offer_embeddings')
        .select('offer_id')
        .eq('kind', 'semantic')
        .not('embedding', 'is', null)

      if (existingEmbeddings && existingEmbeddings.length > 0) {
        const existingOfferIds = existingEmbeddings.map(e => e.offer_id)
        query = query.not('id', 'in', `(${existingOfferIds.map(id => `'${id}'`).join(',')})`)
      }
    }

    const { data: offersNeedingEmbedding, error: queryError } = await query
      .limit(validatedRequest.batch_size)
      .order('created_at', { ascending: false })

    if (queryError) {
      throw errorFactory.INTERNAL(`Failed to query offers: ${queryError.message}`)
    }

    if (!offersNeedingEmbedding || offersNeedingEmbedding.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No offers need embedding generation',
        processed_count: 0,
        skipped_count: 0
      })
    }

    console.log(`Found ${offersNeedingEmbedding.length} offers needing embeddings`)

    // Call the embedding generation API
    const embeddingResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/embeddings/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.ADMIN_SECRET!
      },
      body: JSON.stringify({
        offer_ids: offersNeedingEmbedding.map(offer => offer.id),
        force_regenerate: validatedRequest.force_regenerate,
        batch_size: Math.min(10, validatedRequest.batch_size) // Smaller batches for queue processing
      })
    })

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json()
      throw errorFactory.INTERNAL(`Embedding generation failed: ${errorData.error}`)
    }

    const embeddingResult = await embeddingResponse.json()

    // Return queue processing results
    return NextResponse.json({
      success: embeddingResult.success,
      message: `Processed ${embeddingResult.processed_count} offers`,
      processed_count: embeddingResult.processed_count,
      found_count: offersNeedingEmbedding.length,
      cost_estimate: embeddingResult.cost_estimate,
      processing_stats: embeddingResult.processing_stats,
      errors: embeddingResult.errors || []
    })

  } catch (error: any) {
    console.error('Embedding queue processing error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request format', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}

// GET method to get queue statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRole()
    
    // Count enriched offers without embeddings
    const { data: enrichedWithoutEmbeddings, error: countError } = await supabase
      .from('offers')
      .select(`
        id,
        source_primary,
        offer_enrichment!inner (
          enrichment_status,
          confidence_scores
        )
      `, { count: 'exact', head: true })
      .eq('offer_enrichment.enrichment_status', 'completed')
      .gte('offer_enrichment.confidence_scores->global', 0.80)

    if (countError) {
      throw errorFactory.INTERNAL(`Failed to count enriched offers: ${countError.message}`)
    }

    const totalEnriched = enrichedWithoutEmbeddings?.length || 0

    // Count existing embeddings
    const { count: existingEmbeddings, error: embeddingCountError } = await supabase
      .from('offer_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('kind', 'semantic')
      .not('embedding', 'is', null)

    if (embeddingCountError) {
      throw errorFactory.INTERNAL(`Failed to count embeddings: ${embeddingCountError.message}`)
    }

    const needsEmbedding = Math.max(0, totalEnriched - (existingEmbeddings || 0))

    // Get recent embeddings for activity
    const { data: recentEmbeddings, error: recentError } = await supabase
      .from('offer_embeddings')
      .select(`
        offer_id,
        kind,
        model,
        dim,
        created_at
      `)
      .eq('kind', 'semantic')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      throw errorFactory.INTERNAL(`Failed to fetch recent embeddings: ${recentError.message}`)
    }

    return NextResponse.json({
      success: true,
      queue_stats: {
        total_enriched_offers: totalEnriched,
        existing_embeddings: existingEmbeddings || 0,
        needs_embedding: needsEmbedding,
        completion_rate: totalEnriched > 0 ? ((existingEmbeddings || 0) / totalEnriched) : 1
      },
      recent_activity: recentEmbeddings || []
    })

  } catch (error: any) {
    console.error('GET embedding queue stats error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}