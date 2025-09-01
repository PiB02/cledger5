import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase/route-handler'
import { errorFactory } from '@/lib/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = params.id
    
    if (!offerId) {
      throw errorFactory.BAD_REQUEST('Offer ID is required')
    }

    // Verify admin secret
    const adminSecret = request.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw errorFactory.UNAUTHORIZED('Invalid admin secret')
    }

    const supabase = createSupabaseServiceRole()

    // Check if offer exists
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('id, title')
      .eq('id', offerId)
      .single()

    if (offerError) {
      if (offerError.code === 'PGRST116') {
        throw errorFactory.NOT_FOUND('Offer not found')
      }
      console.error('Offer check error:', offerError)
      throw errorFactory.INTERNAL('Database error checking offer')
    }

    // Check current enrichment status
    const { data: enrichment, error: enrichmentError } = await supabase
      .from('offer_enrichment')
      .select('enrichment_status, processed_at, retry_count')
      .eq('offer_id', offerId)
      .maybeSingle()

    if (enrichmentError) {
      console.error('Enrichment check error:', enrichmentError)
      throw errorFactory.INTERNAL('Database error checking enrichment status')
    }

    // If no enrichment record exists, create one
    if (!enrichment) {
      const { error: insertError } = await supabase
        .from('offer_enrichment')
        .insert({
          offer_id: offerId,
          enrichment_status: 'pending',
          parse_status: 'todo',
          enrichment_version: '1.0',
          model_used: 'gpt-4o-mini',
          retry_count: 0
        })

      if (insertError) {
        console.error('Enrichment insert error:', insertError)
        throw errorFactory.INTERNAL('Failed to create enrichment record')
      }
    } else {
      // Update existing record to reset for re-processing
      const { error: updateError } = await supabase
        .from('offer_enrichment')
        .update({
          enrichment_status: 'pending',
          processed_at: null,
          error_msg: null,
          retry_count: (enrichment.retry_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('offer_id', offerId)

      if (updateError) {
        console.error('Enrichment update error:', updateError)
        throw errorFactory.INTERNAL('Failed to update enrichment record')
      }
    }

    // Trigger the enrichment by calling the queue API
    try {
      const queueResponse = await fetch(`${request.nextUrl.origin}/api/enrich/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify({
          limit: 1, // Only process this specific offer
          offer_ids: [offerId] // Specific offer filter
        })
      })

      const queueResult = await queueResponse.json()
      
      if (!queueResponse.ok || !queueResult.success) {
        console.error('Queue API error:', queueResult)
        throw errorFactory.INTERNAL('Failed to trigger enrichment queue')
      }

      return NextResponse.json({
        success: true,
        data: {
          offer_id: offerId,
          offer_title: offer.title,
          enrichment_triggered: true,
          queue_result: queueResult.data
        }
      })

    } catch (queueError) {
      console.error('Queue call error:', queueError)
      
      // If queue fails, we should revert the status
      await supabase
        .from('offer_enrichment')
        .update({
          enrichment_status: 'failed',
          error_msg: 'Failed to trigger enrichment queue',
          updated_at: new Date().toISOString()
        })
        .eq('offer_id', offerId)

      throw errorFactory.INTERNAL('Failed to trigger enrichment processing')
    }

  } catch (error) {
    console.error('Admin offer enrich API error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Offer not found') {
        return NextResponse.json({
          success: false,
          error: 'Offer not found'
        }, { status: 404 })
      }
      
      if (error.message === 'Invalid admin secret') {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized'
        }, { status: 401 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}