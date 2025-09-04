import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase/route-handler'
import { errorFactory } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const offerId = resolvedParams.id
    
    if (!offerId) {
      throw errorFactory.BAD_REQUEST('Offer ID is required')
    }

    const supabase = createSupabaseServiceRole()

    // Get embedding text from offer_embeddings table
    const { data: embedding, error: embeddingError } = await supabase
      .from('offer_embeddings')
      .select('embedding_text')
      .eq('offer_id', offerId)
      .single()

    if (embeddingError) {
      if (embeddingError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: {
            embedding_text: null
          }
        })
      }
      console.error('Embedding text error:', embeddingError)
      throw errorFactory.INTERNAL('Database error fetching embedding text')
    }

    return NextResponse.json({
      success: true,
      data: {
        embedding_text: embedding?.embedding_text || null
      }
    })

  } catch (error) {
    console.error('Admin offer embedding text API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}