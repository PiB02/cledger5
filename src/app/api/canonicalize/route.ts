/**
 * API endpoint pour déclencher la canonicalisation des offres
 * POST /api/canonicalize - Canonicalise les offres brutes en attente
 */

import { NextRequest, NextResponse } from 'next/server'
import { processAllPendingOffers } from '@/lib/canonicalization'
import { errorFactory, errorResponse } from '@/lib/errors'
import { z } from 'zod'

const CanonicalizationRequestSchema = z.object({
  source_id: z.string().min(1, 'source_id is required'),
  admin_secret: z.string().min(1, 'admin_secret is required'),
  batch_size: z.number().int().min(1).max(500).optional().default(50),
})

export async function POST(request: NextRequest) {
  try {
    // Parse et valide la requête
    const body = await request.json()
    const { source_id, admin_secret, batch_size } = CanonicalizationRequestSchema.parse(body)
    
    // Vérification du secret admin
    const expectedSecret = process.env.ADMIN_SECRET
    if (!expectedSecret || admin_secret !== expectedSecret) {
      return errorResponse(errorFactory.UNAUTHORIZED('Invalid admin credentials'))
    }
    
    console.log(`Starting canonicalization for source: ${source_id}, batch size: ${batch_size}`)
    
    // Démarre le processus de canonicalisation
    const result = await processAllPendingOffers(source_id, batch_size)
    
    // Log des résultats
    console.log('Canonicalization results:', {
      source_id,
      totalProcessed: result.totalProcessed,
      totalInserted: result.totalInserted,
      totalUpdated: result.totalUpdated,
      totalSkipped: result.totalSkipped,
      errorCount: result.totalErrors.length,
    })
    
    // Retourne les résultats
    return NextResponse.json({
      success: true,
      message: `Canonicalization completed for source ${source_id}`,
      results: {
        source_id,
        processed: result.totalProcessed,
        inserted: result.totalInserted,
        updated: result.totalUpdated,
        skipped: result.totalSkipped,
        errors: result.totalErrors.slice(0, 10), // Limite les erreurs affichées
        errorCount: result.totalErrors.length,
      },
    })
    
  } catch (error) {
    console.error('Canonicalization API error:', error)
    
    if (error instanceof z.ZodError) {
      return errorResponse(errorFactory.BAD_REQUEST('Invalid request parameters', {
        errors: error.errors,
      }))
    }
    
    return errorResponse(errorFactory.INTERNAL('Canonicalization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }))
  }
}

/**
 * GET /api/canonicalize - Récupère le statut de la canonicalisation
 */
export async function GET(request: NextRequest) {
  try {
    // Vérification du secret admin
    const adminSecret = request.nextUrl.searchParams.get('admin_secret')
    const expectedSecret = process.env.ADMIN_SECRET
    
    if (!adminSecret || !expectedSecret || adminSecret !== expectedSecret) {
      return errorResponse(errorFactory.UNAUTHORIZED('Invalid admin credentials'))
    }
    
    // Import du client Supabase ici pour éviter les erreurs de build
    const { createSupabaseService } = await import('@/lib/supabase/service')
    const supabase = createSupabaseService()
    
    // Statistiques par source
    const { data: rawStats, error: rawError } = await supabase
      .from('offers_raw')
      .select('source_id, processed_at')
    
    if (rawError) {
      throw new Error(`Failed to fetch raw stats: ${rawError.message}`)
    }
    
    const { data: offerStats, error: offerError } = await supabase
      .from('offers')
      .select('id')
    
    if (offerError) {
      throw new Error(`Failed to fetch offer stats: ${offerError.message}`)
    }
    
    // Calcule les statistiques
    const statsBySource = rawStats?.reduce((acc: any, row: any) => {
      const source = row.source_id
      if (!acc[source]) {
        acc[source] = { total: 0, processed: 0, pending: 0 }
      }
      acc[source].total++
      if (row.processed_at) {
        acc[source].processed++
      } else {
        acc[source].pending++
      }
      return acc
    }, {}) || {}
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRawOffers: rawStats?.length || 0,
          totalCanonicalOffers: offerStats?.length || 0,
          totalPending: rawStats?.filter(row => !row.processed_at).length || 0,
        },
        bySource: statsBySource,
      },
    })
    
  } catch (error) {
    console.error('Canonicalization status API error:', error)
    
    return errorResponse(errorFactory.INTERNAL('Failed to fetch canonicalization status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }))
  }
}