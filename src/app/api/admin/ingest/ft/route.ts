/**
 * GDPR-Compliant Admin France Travail Ingestion API
 * Direct implementation following the LBA pattern that works perfectly
 * Uses direct API calls instead of problematic HTTP forwarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseService } from '@/lib/supabase';
import { errorFactory } from '@/lib/errors';
import { checkAdminAccess, logAdminAccess } from '@/lib/auth/dev-admin';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Request validation schema
const IngestionParamsSchema = z.object({
  rome_codes: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  departements: z.array(z.string()).optional(),
  max_pages: z.number().min(1).max(100).default(10),
  per_page: z.number().min(1).max(150).default(150),
  type_contrat: z.array(z.string()).optional(),
  motsCles: z.string().optional(),
  dry_run: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // GDPR COMPLIANCE: Authenticated admin verification with dev bypass
    const { userId } = auth();
    const adminCheck = await checkAdminAccess(userId);

    if (!adminCheck.isAdmin) {
      // Log unauthorized access attempt
      if (userId) {
        await logAdminAccess(userId, 'admin_access_denied', 'ft_ingestion', request);
      }
      
      throw errorFactory.FORBIDDEN('Admin privileges required');
    }

    // Validate request
    const body = await request.json();
    const params = IngestionParamsSchema.parse(body);

    // Generate batch ID for progress tracking
    const { randomUUID } = await import('crypto');
    const batchId = randomUUID();

    // AUDIT LOG: Admin operation started
    await logAdminAccess(adminCheck.userId!, 'ft_ingestion_start', 'ft_ingestion', request);
    
    const supabase = createSupabaseService();
    const auditEntry = await supabase.from('audit_logs').insert({
      user_id: adminCheck.userId!,
      action: 'ft_ingestion_start',
      resource: 'ft_ingestion',
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent'),
      metadata: {
        params,
        batchId,
        dev_bypass: adminCheck.bypassReason,
        initiated_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    }).select('id').single();

    // DIRECT IMPLEMENTATION: Execute FT ingestion directly (simulation)
    const response = NextResponse.json({
      success: true,
      data: {
        batchId,
        status: 'starting',
        message: 'Ingestion France Travail lancée, connexion au flux temps réel...'
      },
      audit_id: auditEntry.data?.id,
    });

    let result = {
      success: true,
      batchId,
      totalFetched: 0,
      totalProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalDeduplicated: 0,
      totalErrors: 0,
      errors: [] as string[],
      dryRun: params.dry_run,
      status: 'running' as const,
      startTime: new Date().toISOString(),
    };

    // Helper function to send progress updates using global store
    const updateProgress = async (stage: string, progress: number) => {
      try {
        if (global.updateBatchProgress) {
          global.updateBatchProgress(batchId, {
            status: progress >= 100 ? 'completed' : 'running',
            progress,
            stage,
            metrics: {
              totalFetched: result.totalFetched,
              totalProcessed: result.totalProcessed,
              totalInserted: result.totalInserted,
              totalUpdated: result.totalUpdated,
              totalDeduplicated: result.totalDeduplicated,
              totalErrors: result.totalErrors,
              errors: result.errors
            }
          });
          console.log(`FT Progress: ${batchId} - ${progress}% - ${stage}`);
        }
      } catch (updateError) {
        console.warn('Failed to update FT progress:', updateError);
      }
    };

    // Launch real FT ingestion in background using internal API
    setImmediate(async () => {
      try {
        await updateProgress('Initialisation ingestion France Travail...', 5);
        
        // Direct FT API call using the existing client
        const { franceTravailAPI } = await import('@/lib/france-travail');
        
        // Simulate ingestion process with real API structure
        let totalFetched = 0;
        let totalProcessed = 0;
        let totalInserted = 0;
        let totalErrors = 0;
        let errors: string[] = [];

        try {
          await updateProgress('Récupération des offres France Travail...', 10);

          // Vraie ingestion avec plusieurs pages
          for (let page = 1; page <= params.max_pages; page++) {
            await updateProgress(`Traitement page ${page}/${params.max_pages}...`, 10 + (page / params.max_pages * 80));
            
            const searchResult = await franceTravailAPI.searchOffers({
              page,
              perPage: params.per_page,
              rome: params.rome_codes,
              regions: params.regions,
              departements: params.departements,
              typeContrat: params.type_contrat,
              motsCles: params.motsCles,
            });

            console.log(`🔍 Page ${page} FT result:`, {
              hasResult: Boolean(searchResult),
              hasResultats: Boolean(searchResult?.resultats),
              nbResultats: searchResult?.resultats?.length || 0,
              searchResult: searchResult ? Object.keys(searchResult) : 'null'
            });

            if (!searchResult || !searchResult.resultats || searchResult.resultats.length === 0) {
              console.log(`Page ${page} vide, arrêt de l'ingestion`);
              break;
            }

            totalFetched += searchResult.resultats.length;
            console.log(`📊 Page ${page}: ${searchResult.resultats.length} offres récupérées, total: ${totalFetched}`);
            console.log(`🔄 Début traitement des ${searchResult.resultats.length} offres de la page ${page}`);

            // Traiter chaque offre de cette page
            console.log(`📝 Processing ${searchResult.resultats.length} offers from page ${page}`);
            for (let i = 0; i < searchResult.resultats.length; i++) {
              const ftOffer = searchResult.resultats[i];
              console.log(`  📄 Processing offer ${i + 1}/${searchResult.resultats.length}: ${ftOffer.id} - ${ftOffer.intitule?.substring(0, 50)}...`);
              try {
                await processOfferFT(ftOffer, supabase, params.dry_run);
                totalProcessed++;
                totalInserted++;
                console.log(`    ✅ Offer ${ftOffer.id} processed successfully`);
              } catch (error) {
                console.log(`    ❌ Error processing offer ${ftOffer.id}:`, error);
                errors.push(`Offre ${ftOffer.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                totalErrors++;
              }
            }
            console.log(`✅ Page ${page} complètement traitée: ${totalProcessed} traitées, ${totalErrors} erreurs`);

            // Rate limiting : pause entre les pages
            if (page < params.max_pages) {
              await new Promise(resolve => setTimeout(resolve, 120)); // 120ms = respect 10 req/s
            }
          }
        } catch (error) {
          errors.push(`FT API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          totalErrors++;
        }

        const internalResult = {
          success: totalErrors === 0,
          data: {
            total_fetched: totalFetched,
            total_inserted: totalInserted,
            total_duplicates: 0,
            total_errors: totalErrors,
            errors: errors
          }
        };
        
        // Update final results
        result.totalFetched = totalFetched;
        result.totalProcessed = totalProcessed;
        result.totalInserted = totalInserted;
        result.totalErrors = totalErrors;
        result.errors = errors;

        await updateProgress('Ingestion France Travail terminée avec succès', 100);
        
        console.log(`[FT Ingestion ${batchId}] Completed:`, {
          totalFetched: result.totalFetched,
          totalProcessed: result.totalProcessed,
          totalInserted: result.totalInserted,
          totalErrors: result.totalErrors
        });

        // AUDIT LOG: Operation completed
        await supabase.from('audit_logs').update({
          metadata: {
            params,
            result: {
              ...result,
              message: 'Ingestion France Travail réelle réussie'
            },
            completed_at: new Date().toISOString(),
          }
        }).eq('id', auditEntry.data?.id);

      } catch (error) {
        console.error('FT ingestion error:', error);
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
        result.totalErrors++;
        
        try {
          await updateProgress('Erreur lors de l\'ingestion France Travail', 0);
        } catch (updateError) {
          console.warn('Failed to update FT error progress:', updateError);
        }
      }
    });
    
    return response;

  } catch (error: any) {
    console.error('Admin FT ingestion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Ingestion failed',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// GET endpoint for FT ingestion statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    const adminCheck = await checkAdminAccess(userId);

    if (!adminCheck.isAdmin) {
      throw errorFactory.FORBIDDEN('Admin privileges required');
    }

    const supabase = createSupabaseService();

    // Get France Travail statistics directly  
    const { data: stats, error } = await supabase
      .from('offers_raw')
      .select('id, fetched_at')
      .eq('source_id', 'FT')
      .order('fetched_at', { ascending: false });

    if (error) {
      throw errorFactory.INTERNAL(`Failed to fetch FT stats: ${error.message}`);
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentStats = {
      total: stats.length,
      last_24h: stats.filter(s => new Date(s.fetched_at) > last24h).length,
      last_7_days: stats.filter(s => new Date(s.fetched_at) > last7days).length,
    };

    // Get recent audit logs for FT ingestion
    const { data: recentBatches } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'ft_ingestion_start')
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
    console.error('Error fetching FT admin stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * Traite et insère une offre FT individuelle dans offers_raw
 */
async function processOfferFT(ftOffer: any, supabase: any, dryRun: boolean) {
  // Génération d'un fingerprint pour déduplication
  const { generateOfferFingerprint } = await import('@cledger5/utils');
  const fingerprint = generateOfferFingerprint({
    title: ftOffer.intitule || '',
    company: ftOffer.entreprise?.nom || '',
    location: ftOffer.lieuTravail?.commune || '',
    sourceId: ftOffer.id,
  });

  if (dryRun) {
    console.log('🔍 DRY RUN - FT Offre:', {
      id: ftOffer.id,
      title: ftOffer.intitule,
      company: ftOffer.entreprise?.nom,
      fingerprint,
    });
    return;
  }

  // Vérification des doublons par source_offer_id
  const { data: existingOffer } = await supabase
    .from('offers_raw')
    .select('id')
    .eq('source_id', 'FT')
    .eq('source_offer_id', ftOffer.id)
    .single();

  if (existingOffer) {
    console.log(`Offre FT ${ftOffer.id} déjà présente, skip`);
    return;
  }

  // Générer UUID pour l'ID - FIX CRITICAL
  const offerId = randomUUID();
  console.log(`🔑 Generated UUID for ${ftOffer.id}: ${offerId} (type: ${typeof offerId})`);

  // Insertion dans offers_raw
  const { error: insertError } = await supabase
    .from('offers_raw')
    .insert([{
      id: offerId,
      source_id: 'FT',
      source_offer_id: ftOffer.id,
      fetched_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_active: true,
      origin_url: null,
      raw: ftOffer, // Toutes les données FT en JSON
      content_sha256: Buffer.from(fingerprint, 'utf-8'),
      processed_at: null, // Sera mis à jour après traitement IA
    }]);

  if (insertError) {
    throw new Error(`Insert failed: ${insertError.message}`);
  }

  console.log(`✅ Offre FT ${ftOffer.id} insérée: ${ftOffer.intitule}`);
}