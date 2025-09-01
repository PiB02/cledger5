import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase/route-handler'
import { errorFactory } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRole()
    
    // Fetch re-embedding activity from the view we created
    const { data: activity, error } = await supabase
      .from('v_reembedding_activity')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(50)

    if (error) {
      throw errorFactory.INTERNAL(`Failed to fetch re-embedding activity: ${error.message}`)
    }

    // Get summary stats
    const { data: summaryData, error: summaryError } = await supabase
      .from('offer_embeddings_log')
      .select('action, reason, triggered_at')
      .gte('triggered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

    let summary = {}
    if (!summaryError && summaryData) {
      summary = {
        total_events_7d: summaryData.length,
        reasons: summaryData.reduce((acc: any, item: any) => {
          acc[item.reason] = (acc[item.reason] || 0) + 1
          return acc
        }, {}),
        actions: summaryData.reduce((acc: any, item: any) => {
          acc[item.action] = (acc[item.action] || 0) + 1
          return acc
        }, {})
      }
    }

    return NextResponse.json({
      success: true,
      activity: activity || [],
      summary
    })

  } catch (error: any) {
    console.error('GET embeddings activity error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}