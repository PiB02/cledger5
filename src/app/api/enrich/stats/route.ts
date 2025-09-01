import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase/route-handler'
import { errorFactory } from '@/lib/errors'
import { z } from 'zod'

const RequestSchema = z.object({
  headers: z.object({
    'x-admin-secret': z.string().min(1),
  }).passthrough()
})

interface EnrichmentStats {
  overview: {
    total_offers: number
    enriched_offers: number
    pending_offers: number
    failed_offers: number
    success_rate: number
    avg_confidence: number
  }
  performance: {
    total_tokens_used: number
    total_cost_usd: number
    avg_processing_time_ms: number
    avg_tokens_per_offer: number
    cost_per_offer_usd: number
  }
  recent_activity: Array<{
    date: string
    offers_processed: number
    tokens_used: number
    cost_usd: number
    avg_confidence: number
  }>
  confidence_distribution: {
    high_confidence: number  // >= 0.80
    medium_confidence: number  // 0.60 - 0.79
    low_confidence: number   // < 0.60
  }
  processing_status: {
    pending: number
    processing: number
    completed: number
    failed: number
    low_confidence: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const validation = RequestSchema.parse({
      headers: Object.fromEntries(request.headers.entries())
    })

    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret || validation.headers['x-admin-secret'] !== adminSecret) {
      throw errorFactory.UNAUTHORIZED('Invalid admin secret')
    }

    const supabase = createSupabaseServiceRole()

    // 1. Statistiques générales
    const { data: overviewData, error: overviewError } = await supabase
      .from('offer_enrichment')
      .select(`
        enrichment_status,
        confidence_scores,
        tokens_used,
        processing_time_ms,
        created_at
      `)

    if (overviewError) {
      console.error('Overview error:', overviewError)
      throw errorFactory.INTERNAL('Database error fetching overview')
    }

    // 2. Calculer les métriques
    const totalOffers = overviewData.length
    const enrichedOffers = overviewData.filter(o => o.enrichment_status === 'completed').length
    const pendingOffers = overviewData.filter(o => o.enrichment_status === 'pending').length
    const failedOffers = overviewData.filter(o => o.enrichment_status === 'failed').length
    const lowConfidenceOffers = overviewData.filter(o => o.enrichment_status === 'low_confidence').length

    const successRate = totalOffers > 0 ? ((enrichedOffers + lowConfidenceOffers) / totalOffers) * 100 : 0

    // Fonction pour extraire la confiance moyenne depuis JSONB confidence_scores
    const getConfidenceFromScores = (confidenceScores: any): number => {
      if (!confidenceScores) return 0
      if (typeof confidenceScores === 'number') return confidenceScores
      if (typeof confidenceScores === 'object') {
        // Si c'est un objet, calculer la moyenne des valeurs
        const values = Object.values(confidenceScores).filter(v => typeof v === 'number') as number[]
        return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
      }
      return 0
    }

    const completedOffers = overviewData.filter(o => 
      o.enrichment_status === 'completed' && o.confidence_scores !== null
    )
    
    const avgConfidence = completedOffers.length > 0 
      ? completedOffers.reduce((sum, o) => sum + getConfidenceFromScores(o.confidence_scores), 0) / completedOffers.length
      : 0

    // 3. Métriques de performance
    const offersWithMetrics = overviewData.filter(o => 
      o.tokens_used !== null && o.processing_time_ms !== null
    )
    
    const totalTokensUsed = offersWithMetrics.reduce((sum, o) => sum + (o.tokens_used || 0), 0)
    const totalCostUSD = totalTokensUsed * 0.00000015 // $0.15 per 1M tokens for GPT-4o-mini
    const avgProcessingTime = offersWithMetrics.length > 0
      ? offersWithMetrics.reduce((sum, o) => sum + (o.processing_time_ms || 0), 0) / offersWithMetrics.length
      : 0
    const avgTokensPerOffer = offersWithMetrics.length > 0
      ? totalTokensUsed / offersWithMetrics.length
      : 0
    const costPerOfferUSD = offersWithMetrics.length > 0
      ? totalCostUSD / offersWithMetrics.length
      : 0

    // 4. Distribution de confidence
    const highConfidence = completedOffers.filter(o => getConfidenceFromScores(o.confidence_scores) >= 0.80).length
    const mediumConfidence = completedOffers.filter(o => {
      const score = getConfidenceFromScores(o.confidence_scores)
      return score >= 0.60 && score < 0.80
    }).length
    const lowConfidenceCount = completedOffers.filter(o => getConfidenceFromScores(o.confidence_scores) < 0.60).length

    // 5. Activité récente (7 derniers jours)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentOffers = overviewData.filter(o => 
      new Date(o.created_at) >= sevenDaysAgo
    )

    // Grouper par jour
    const activityByDay = new Map<string, {
      offers_processed: number
      tokens_used: number
      cost_usd: number
      confidences: number[]
    }>()

    recentOffers.forEach(offer => {
      const date = new Date(offer.created_at).toISOString().split('T')[0]
      
      if (!activityByDay.has(date)) {
        activityByDay.set(date, {
          offers_processed: 0,
          tokens_used: 0,
          cost_usd: 0,
          confidences: []
        })
      }
      
      const dayData = activityByDay.get(date)!
      dayData.offers_processed++
      dayData.tokens_used += offer.tokens_used || 0
      dayData.cost_usd += (offer.tokens_used || 0) * 0.00000015
      
      const confidence = getConfidenceFromScores(offer.confidence_scores)
      if (confidence > 0) {
        dayData.confidences.push(confidence)
      }
    })

    const recentActivity = Array.from(activityByDay.entries()).map(([date, data]) => ({
      date,
      offers_processed: data.offers_processed,
      tokens_used: data.tokens_used,
      cost_usd: data.cost_usd,
      avg_confidence: data.confidences.length > 0
        ? data.confidences.reduce((sum, c) => sum + c, 0) / data.confidences.length
        : 0
    })).sort((a, b) => b.date.localeCompare(a.date))

    // 6. Statuts de traitement actuels
    const processingStatus = {
      pending: pendingOffers,
      processing: overviewData.filter(o => o.enrichment_status === 'processing').length,
      completed: enrichedOffers,
      failed: failedOffers,
      low_confidence: lowConfidenceOffers
    }

    const stats: EnrichmentStats = {
      overview: {
        total_offers: totalOffers,
        enriched_offers: enrichedOffers,
        pending_offers: pendingOffers,
        failed_offers: failedOffers,
        success_rate: Math.round(successRate * 100) / 100,
        avg_confidence: Math.round(avgConfidence * 1000) / 1000
      },
      performance: {
        total_tokens_used: totalTokensUsed,
        total_cost_usd: Math.round(totalCostUSD * 100000) / 100000, // 5 decimales
        avg_processing_time_ms: Math.round(avgProcessingTime),
        avg_tokens_per_offer: Math.round(avgTokensPerOffer),
        cost_per_offer_usd: Math.round(costPerOfferUSD * 100000) / 100000
      },
      recent_activity: recentActivity,
      confidence_distribution: {
        high_confidence: highConfidence,
        medium_confidence: mediumConfidence,
        low_confidence: lowConfidenceCount
      },
      processing_status: processingStatus
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Enrichment stats error:', error)
    
    if (error.name === 'ZodError') {
      throw errorFactory.BAD_REQUEST('Invalid request format')
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}