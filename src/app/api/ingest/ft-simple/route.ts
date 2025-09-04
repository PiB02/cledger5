/**
 * France Travail Ingestion API - Version Simplifiée
 * Version de test pour contourner les problèmes de compilation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseService } from '@/lib/supabase/service'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Vérification de sécurité admin
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 401 })
    }

    const body = await request.json()
    const { limit = 10, dry_run = false } = body

    console.log(`Starting simple FT ingestion: limit=${limit}, dry_run=${dry_run}`)

    // 1. Obtenir un token OAuth2
    const tokenResponse = await fetch('https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.FT_CLIENT_ID!,
        client_secret: process.env.FT_CLIENT_SECRET!,
        scope: process.env.FT_SCOPE!,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`OAuth2 failed: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()

    // 2. Rechercher des offres
    const searchResponse = await fetch(`https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?range=0-${limit - 1}`, {
      method: 'GET',
      headers: {
        'Authorization': `${tokenData.token_type} ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    })

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    const offers = searchData.resultats || []

    if (dry_run) {
      return NextResponse.json({
        success: true,
        message: `Dry run completed`,
        results: {
          offers_found: offers.length,
          sample_offer: offers[0] ? {
            id: offers[0].id,
            title: offers[0].intitule,
            company: offers[0].entreprise?.nom,
          } : null,
        },
      })
    }

    // 3. Insérer les offres dans offers_raw
    const supabase = createSupabaseService()
    let inserted = 0
    const errors: string[] = []

    for (const offer of offers) {
      try {
        const offerId = randomUUID()
        
        const { error } = await supabase
          .from('offers_raw')
          .insert({
            id: offerId,
            source_id: 'FRANCE_TRAVAIL',
            source_offer_id: offer.id,
            raw_data: offer,
            fetched_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            is_active: true,
          })
        
        if (error) {
          errors.push(`Failed to insert offer ${offer.id}: ${error.message}`)
        } else {
          inserted++
        }
      } catch (error) {
        errors.push(`Error processing offer ${offer.id}: ${error}`)
      }
    }

    console.log(`Simple FT ingestion complete: ${inserted} inserted, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      message: `Ingestion completed`,
      results: {
        total_fetched: offers.length,
        total_inserted: inserted,
        total_errors: errors.length,
        errors: errors.slice(0, 5), // Limite les erreurs affichées
      },
    })

  } catch (error) {
    console.error('Simple FT ingestion failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Ingestion failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}