/**
 * API endpoint pour déclencher la canonicalisation des offres France Travail
 * POST /api/canonicalization/ft - Canonicalise les offres FT brutes en attente
 */

import { NextRequest, NextResponse } from 'next/server'
import { processAllPendingOffersFT } from '@/lib/canonicalization-ft'
import { errorFactory, errorResponse } from '@/lib/errors'
import { z } from 'zod'

const CanonicalizationFTRequestSchema = z.object({
  source_id: z.string().min(1, 'source_id is required'),
  admin_secret: z.string().min(1, 'admin_secret is required'),
  batch_size: z.number().int().min(1).max(500).optional().default(50),
  dry_run: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    // Parse et valide la requête
    const body = await request.json()
    const { source_id, admin_secret, batch_size, dry_run } = CanonicalizationFTRequestSchema.parse(body)
    
    // Vérification du secret admin
    const expectedSecret = process.env.ADMIN_SECRET
    if (!expectedSecret || admin_secret !== expectedSecret) {
      return errorResponse(errorFactory.UNAUTHORIZED('Invalid admin credentials'))
    }
    
    console.log(`Starting FT canonicalization for source: ${source_id}, batch size: ${batch_size}, dry_run: ${dry_run}`)
    
    if (dry_run) {
      // Mode dry run - compte seulement les offres à traiter
      const { createSupabaseService } = await import('@/lib/supabase/service')
      const supabase = createSupabaseService()
      
      const { data: rawOffers, error } = await supabase
        .from('offers_raw')
        .select('id, source_id, source_offer_id, fetched_at')
        .eq('source_id', source_id)
        .eq('source_type', 'france_travail')
        .is('processed_at', null)
        .limit(1000)
      
      if (error) {
        throw new Error(`Failed to count FT offers: ${error.message}`)
      }
      
      return NextResponse.json({
        success: true,
        message: `Dry run completed for FT source ${source_id}`,
        results: {
          source_id,
          dry_run: true,
          pendingOffers: rawOffers?.length || 0,
          estimatedBatches: Math.ceil((rawOffers?.length || 0) / batch_size),
        },
      })
    }
    
    // Démarre le processus de canonicalisation réelle
    const result = await processAllPendingOffersFT(source_id, batch_size)
    
    // Log des résultats
    console.log('FT Canonicalization results:', {
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
      message: `FT Canonicalization completed for source ${source_id}`,
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
    console.error('FT Canonicalization API error:', error)
    
    if (error instanceof z.ZodError) {
      return errorResponse(errorFactory.BAD_REQUEST('Invalid request parameters', {
        errors: error.errors,
      }))
    }
    
    return errorResponse(errorFactory.INTERNAL('FT Canonicalization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }))
  }
}

/**
 * GET /api/canonicalization/ft - Récupère le statut de la canonicalisation FT
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
    
    // Statistiques spécifiques FT
    const { data: rawStatsFT, error: rawError } = await supabase
      .from('offers_raw')
      .select('source_id, processed_at, source_type')
      .eq('source_type', 'france_travail')
    
    if (rawError) {
      throw new Error(`Failed to fetch FT raw stats: ${rawError.message}`)
    }
    
    // Statistiques des offres canoniques issues de FT
    const { data: canonicalStatsFT, error: canonicalError } = await supabase
      .from('offer_sources')
      .select('source_id, offer_id')
      .like('source_id', '%france_travail%')
    
    if (canonicalError) {
      throw new Error(`Failed to fetch FT canonical stats: ${canonicalError.message}`)
    }
    
    // Calcule les statistiques FT
    const statsBySourceFT = rawStatsFT?.reduce((acc: any, row: any) => {
      const source = row.source_id
      if (!acc[source]) {
        acc[source] = { total: 0, processed: 0, pending: 0, source_type: row.source_type }
      }
      acc[source].total++
      if (row.processed_at) {
        acc[source].processed++
      } else {
        acc[source].pending++
      }
      return acc
    }, {}) || {}
    
    // Statistiques des offres canoniques
    const canonicalBySource = canonicalStatsFT?.reduce((acc: any, row: any) => {
      const source = row.source_id
      if (!acc[source]) {
        acc[source] = 0
      }
      acc[source]++
      return acc
    }, {}) || {}
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRawOffersFT: rawStatsFT?.length || 0,
          totalCanonicalOffersFT: canonicalStatsFT?.length || 0,
          totalPendingFT: rawStatsFT?.filter(row => !row.processed_at).length || 0,
        },
        bySourceRaw: statsBySourceFT,
        bySourceCanonical: canonicalBySource,
        pipeline: {
          ingestion: rawStatsFT?.length || 0,
          canonicalization: canonicalStatsFT?.length || 0,
          pending: rawStatsFT?.filter(row => !row.processed_at).length || 0,
        },
      },
    })
    
  } catch (error) {
    console.error('FT Canonicalization status API error:', error)
    
    return errorResponse(errorFactory.INTERNAL('Failed to fetch FT canonicalization status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }))
  }
}