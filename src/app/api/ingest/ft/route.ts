/**
 * France Travail Ingestion API
 * Ingère des offres d'emploi depuis l'API France Travail
 * Complément de l'ingestion LBA pour un matching multi-sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteHandler } from '@/lib/supabase/route-handler';
import { franceTravailAPI, type FTSearchParams } from '@/lib/france-travail';
import { errorFactory } from '@/lib/errors';
import { generateOfferFingerprint } from '@cledger5/utils';

// Schema de validation pour les paramètres d'ingestion
const IngestionParamsSchema = z.object({
  rome_codes: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  departements: z.array(z.string()).optional(),
  max_pages: z.number().min(1).max(100).default(10),
  per_page: z.number().min(1).max(150).default(150),
  type_contrat: z.array(z.string()).optional(),
  motsCles: z.string().optional(),
  dry_run: z.boolean().default(false), // Test sans insertion
});

type IngestionResult = {
  success: boolean;
  total_fetched: number;
  total_inserted: number;
  total_duplicates: number;
  total_errors: number;
  pages_processed: number;
  errors: string[];
  batch_id?: string;
};

/**
 * POST /api/ingest/ft - Lance l'ingestion France Travail
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de sécurité admin
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET) {
      throw errorFactory.UNAUTHORIZED('Admin access required');
    }

    const body = await request.json();
    const params = IngestionParamsSchema.parse(body);

    console.log('🇫🇷 Starting France Travail ingestion with params:', params);

    const supabase = createRouteHandlerClient();
    let batchId: string | null = null;

    if (!params.dry_run) {
      // Créer un batch de traitement
      const { data: batch, error: batchError } = await supabase
        .from('batch_processing')
        .insert([{
          type: 'ft_ingestion',
          status: 'running',
          total_items: 0,
          processed_items: 0,
          created_at: new Date().toISOString(),
        }])
        .select('id')
        .single();

      if (batchError || !batch) {
        throw errorFactory.INTERNAL(`Failed to create batch: ${batchError?.message}`);
      }
      batchId = batch.id;
    }

    const result: IngestionResult = {
      success: true,
      total_fetched: 0,
      total_inserted: 0,
      total_duplicates: 0,
      total_errors: 0,
      pages_processed: 0,
      errors: [],
      batch_id: batchId || undefined,
    };

    // Construction des paramètres de recherche FT
    const searchParams: FTSearchParams = {
      page: 1,
      perPage: params.per_page,
      rome: params.rome_codes,
      motsCles: params.motsCles,
      typeContrat: params.type_contrat,
    };

    // Si régions ou départements spécifiés, on les traite séparément
    const locations = [];
    if (params.regions?.length) {
      for (const region of params.regions) {
        locations.push({ region });
      }
    }
    if (params.departements?.length) {
      for (const dept of params.departements) {
        locations.push({ departement: dept });
      }
    }
    
    // Si aucune localisation spécifiée, on fait une recherche générale
    if (locations.length === 0) {
      locations.push({});
    }

    // Ingestion pour chaque localisation
    for (const location of locations) {
      const locationParams = { ...searchParams, ...location };
      
      try {
        await ingestLocation(locationParams, params, result, supabase, batchId);
      } catch (error) {
        result.errors.push(`Location ${JSON.stringify(location)}: ${error}`);
        result.total_errors++;
      }
    }

    // Mise à jour du batch final
    if (batchId && !params.dry_run) {
      await supabase
        .from('batch_processing')
        .update({
          status: result.success ? 'completed' : 'error',
          total_items: result.total_fetched,
          processed_items: result.total_inserted,
          completed_at: new Date().toISOString(),
        })
        .eq('id', batchId);
    }

    console.log('🏁 France Travail ingestion completed:', result);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('❌ France Travail ingestion failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Ingestion failed'
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * Ingère les offres pour une localisation donnée
 */
async function ingestLocation(
  searchParams: FTSearchParams,
  params: z.infer<typeof IngestionParamsSchema>,
  result: IngestionResult,
  supabase: any,
  batchId: string | null
) {
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages && currentPage <= params.max_pages) {
    try {
      console.log(`📄 Processing page ${currentPage} for location:`, searchParams);

      const searchResult = await franceTravailAPI.searchOffers({
        ...searchParams,
        page: currentPage,
      });

      result.pages_processed++;
      result.total_fetched += searchResult.resultats.length;

      if (searchResult.resultats.length === 0) {
        hasMorePages = false;
        break;
      }

      // Traitement des offres de cette page
      for (const ftOffer of searchResult.resultats) {
        try {
          await processOffer(ftOffer, supabase, result, params.dry_run);
        } catch (error) {
          result.errors.push(`Offer ${ftOffer.id}: ${error}`);
          result.total_errors++;
        }
      }

      // Mise à jour du batch progress
      if (batchId && !params.dry_run) {
        await supabase
          .from('batch_processing')
          .update({
            processed_items: result.total_inserted,
            total_items: Math.min(searchResult.total, params.max_pages * params.per_page),
          })
          .eq('id', batchId);
      }

      // Vérifier s'il y a d'autres pages
      hasMorePages = currentPage < searchResult.nbPages && currentPage < params.max_pages;
      currentPage++;

      // Pause pour respecter le rate limiting (10 req/s max)
      await new Promise(resolve => setTimeout(resolve, 120));

    } catch (error) {
      result.errors.push(`Page ${currentPage}: ${error}`);
      result.total_errors++;
      hasMorePages = false;
    }
  }
}

/**
 * Traite et insère une offre FT individuelle
 */
async function processOffer(
  ftOffer: any,
  supabase: any,
  result: IngestionResult,
  dryRun: boolean
) {
  // Normalisation des données FT vers le format cledger5
  const normalizedOffer = {
    source_id: ftOffer.id,
    source_type: 'france_travail' as const,
    title: ftOffer.intitule,
    description: ftOffer.description,
    company_name: ftOffer.entreprise?.nom || null,
    company_siret: ftOffer.entreprise?.siret || null,
    location_name: ftOffer.lieuTravail?.commune || null,
    location_postal_code: ftOffer.lieuTravail?.codePostal || null,
    location_latitude: ftOffer.lieuTravail?.latitude || null,
    location_longitude: ftOffer.lieuTravail?.longitude || null,
    contract_type: ftOffer.typeContrat?.code || null,
    contract_duration: ftOffer.dureeTravail || null,
    salary_min: ftOffer.salaire?.minimum || null,
    salary_max: ftOffer.salaire?.maximum || null,
    salary_unit: ftOffer.salaire?.unite || null,
    rome_code: ftOffer.romeCode || null,
    experience_level: ftOffer.experience?.code || null,
    posted_at: ftOffer.dateCreation ? new Date(ftOffer.dateCreation).toISOString() : new Date().toISOString(),
    updated_at: ftOffer.dateActualisation ? new Date(ftOffer.dateActualisation).toISOString() : new Date().toISOString(),
    apply_url: null, // FT n'expose pas d'URL de candidature directe
    raw_data: ftOffer,
  };

  // Génération du fingerprint pour déduplication
  const fingerprint = generateFingerprint({
    title: normalizedOffer.title,
    company: normalizedOffer.company_name || '',
    location: normalizedOffer.location_name || '',
    sourceId: normalizedOffer.source_id,
  });

  if (dryRun) {
    console.log('🔍 DRY RUN - Would insert:', {
      source_id: normalizedOffer.source_id,
      title: normalizedOffer.title,
      company: normalizedOffer.company_name,
      fingerprint,
    });
    result.total_inserted++;
    return;
  }

  // Vérification des doublons par fingerprint
  const { data: existingOffer } = await supabase
    .from('offers_raw')
    .select('id')
    .eq('canonical_fingerprint', fingerprint)
    .single();

  if (existingOffer) {
    result.total_duplicates++;
    return;
  }

  // Insertion dans offers_raw
  const { error: insertError } = await supabase
    .from('offers_raw')
    .insert([{
      ...normalizedOffer,
      canonical_fingerprint: fingerprint,
      created_at: new Date().toISOString(),
    }]);

  if (insertError) {
    throw new Error(`Insert failed: ${insertError.message}`);
  }

  result.total_inserted++;
}

/**
 * GET /api/ingest/ft - Statistiques d'ingestion France Travail
 */
export async function GET() {
  try {
    const supabase = createRouteHandlerClient();

    // Statistiques des offres France Travail
    const { data: stats, error } = await supabase
      .from('offers_raw')
      .select('id, created_at')
      .eq('source_type', 'france_travail')
      .order('created_at', { ascending: false });

    if (error) {
      throw errorFactory.INTERNAL(`Failed to fetch FT stats: ${error.message}`);
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentStats = {
      total: stats.length,
      last_24h: stats.filter(s => new Date(s.created_at) > last24h).length,
      last_7_days: stats.filter(s => new Date(s.created_at) > last7days).length,
    };

    // Derniers batches France Travail
    const { data: recentBatches } = await supabase
      .from('batch_processing')
      .select('*')
      .eq('type', 'ft_ingestion')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        offers_stats: recentStats,
        recent_batches: recentBatches || [],
      }
    });

  } catch (error: any) {
    console.error('Error fetching FT ingestion stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch stats'
      },
      { status: error.statusCode || 500 }
    );
  }
}