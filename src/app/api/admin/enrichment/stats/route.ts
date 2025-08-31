import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'
import { AdminEnrichmentStatsSchema, type AdminEnrichmentStats } from '@cledger5/types'
import { errorFactory } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const adminSecret = request.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw errorFactory.UNAUTHORIZED('Admin access required')
    }

    const supabase = createRouteHandlerClient()

    // Get overview statistics
    const { data: offerCounts, error: offerError } = await supabase
      .rpc('get_enrichment_overview')
      .single()
    
    if (offerError) {
      console.error('Error fetching offer overview:', offerError)
      // Fallback to manual queries if RPC doesn't exist yet
    }

    // Manual queries for now (until we create the RPC functions)
    
    // Total offers count
    const { count: totalOffers, error: totalError } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) throw new Error(`Failed to count offers: ${totalError.message}`)

    // Enriched offers count
    const { count: enrichedOffers, error: enrichedError } = await supabase
      .from('offer_enrichment')
      .select('*', { count: 'exact', head: true })
      .eq('enrichment_status', 'completed')
    
    if (enrichedError) throw new Error(`Failed to count enriched offers: ${enrichedError.message}`)

    // Status breakdown
    const { data: statusBreakdown, error: statusError } = await supabase
      .from('offer_enrichment')
      .select('enrichment_status')
      .not('enrichment_status', 'is', null)

    if (statusError) throw new Error(`Failed to get status breakdown: ${statusError.message}`)

    const statusCounts = {
      completed: statusBreakdown?.filter(s => s.enrichment_status === 'completed').length || 0,
      processing: statusBreakdown?.filter(s => s.enrichment_status === 'processing').length || 0,
      failed: statusBreakdown?.filter(s => s.enrichment_status === 'failed').length || 0,
      low_confidence: statusBreakdown?.filter(s => s.enrichment_status === 'low_confidence').length || 0
    }

    // Cost tracking - sum tokens and calculate costs
    const { data: costData, error: costError } = await supabase
      .from('offer_enrichment')
      .select('tokens_used, confidence_scores')
      .not('tokens_used', 'is', null)

    if (costError) throw new Error(`Failed to get cost data: ${costError.message}`)

    const totalTokens = costData?.reduce((sum, row) => sum + (row.tokens_used || 0), 0) || 0
    const totalCost = totalTokens * 0.00000015 // GPT-4o-mini pricing
    const avgCostPerOffer = enrichedOffers && enrichedOffers > 0 ? totalCost / enrichedOffers : 0
    
    // Average confidence from completed enrichments
    const completedConfidences = costData?.filter(row => row.confidence_scores?.global).map(row => row.confidence_scores.global) || []
    const avgConfidence = completedConfidences.length > 0 
      ? completedConfidences.reduce((sum, conf) => sum + conf, 0) / completedConfidences.length 
      : 0

    // Performance metrics (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recent24h, error: recentError } = await supabase
      .from('offer_enrichment')
      .select('processing_time_ms, enrichment_status')
      .gte('processed_at', yesterday)
    
    if (recentError) throw new Error(`Failed to get recent performance: ${recentError.message}`)

    const avgProcessingTime = recent24h && recent24h.length > 0
      ? recent24h.reduce((sum, row) => sum + (row.processing_time_ms || 0), 0) / recent24h.length
      : 0

    const successRate24h = recent24h && recent24h.length > 0
      ? recent24h.filter(row => row.enrichment_status === 'completed').length / recent24h.length
      : 0

    // Skill categories breakdown
    const { data: skillsData, error: skillsError } = await supabase
      .from('offer_enrichment')
      .select('skills_required, skills_preferred, confidence_scores')
      .eq('enrichment_status', 'completed')
      .not('skills_required', 'is', null)

    if (skillsError) throw new Error(`Failed to get skills data: ${skillsError.message}`)

    const skillCategories: { [key: string]: { count: number, confidenceSum: number } } = {}
    
    skillsData?.forEach(row => {
      const allSkills = [...(row.skills_required || []), ...(row.skills_preferred || [])]
      const confidence = row.confidence_scores?.skills || 0
      
      allSkills.forEach(skill => {
        const category = skill.category || 'unknown'
        if (!skillCategories[category]) {
          skillCategories[category] = { count: 0, confidenceSum: 0 }
        }
        skillCategories[category].count++
        skillCategories[category].confidenceSum += confidence
      })
    })

    const skillCategoriesArray = Object.entries(skillCategories).map(([category, data]) => ({
      category,
      count: data.count,
      confidence_avg: data.count > 0 ? data.confidenceSum / data.count : 0
    }))

    // Check for active batches (simplified - would need batch tracking table)
    const activeBatches = statusCounts.processing > 0 ? 1 : 0

    const stats: AdminEnrichmentStats = {
      overview: {
        total_offers: totalOffers || 0,
        enriched_offers: enrichedOffers || 0,
        enrichment_rate: totalOffers && totalOffers > 0 ? (enrichedOffers || 0) / totalOffers : 0,
        avg_confidence: avgConfidence
      },
      status_breakdown: statusCounts,
      cost_tracking: {
        total_tokens_used: totalTokens,
        total_cost_usd: totalCost,
        avg_cost_per_offer: avgCostPerOffer,
        monthly_budget_used: 0.75 // TODO: Calculate from actual monthly spending
      },
      performance_metrics: {
        avg_processing_time_ms: avgProcessingTime,
        success_rate_24h: successRate24h,
        latest_batch_id: undefined, // TODO: Track batch IDs
        active_batches: activeBatches
      },
      skill_categories: skillCategoriesArray.slice(0, 10) // Top 10 categories
    }

    return NextResponse.json(AdminEnrichmentStatsSchema.parse(stats))

  } catch (error: any) {
    console.error('Admin enrichment stats error:', error)
    
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