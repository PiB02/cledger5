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

    // DIRECT IMPLEMENTATION: Call France Travail API directly like LBA
    const { franceTravailAPI } = await import('@/lib/france-travail');
    const { generateOfferFingerprint } = await import('@cledger5/utils');
    const cryptoModule = await import('crypto');

    // Return batch ID immediately for SSE connection
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
      totalDeduplicated: 0,
      totalErrors: 0,
      errors: [] as string[],
      dryRun: params.dry_run,
      status: 'running' as const,
      startTime: new Date().toISOString(),
    };

    // Progress update function using global store
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

    // Launch ingestion in background
    setImmediate(async () => {
      try {
        await updateProgress('Initialisation ingestion France Travail...', 5);

        // Build search parameters
        const searchParams = {
          page: 1,
          perPage: params.per_page,
          rome: params.rome_codes,
          motsCles: params.motsCles,
          typeContrat: params.type_contrat,
        };

        // Process locations
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
        if (locations.length === 0) {
          locations.push({});
        }

        await updateProgress('Récupération des données France Travail...', 10);

        // Process each location
        for (const location of locations) {
          const locationParams = { ...searchParams, ...location };
          
          let currentPage = 1;
          let hasMorePages = true;

          while (hasMorePages && currentPage <= params.max_pages) {
            try {
              const searchResult = await franceTravailAPI.searchOffers({
                ...locationParams,
                page: currentPage,
              });

              result.totalFetched += searchResult.resultats.length;
              
              const fetchProgress = Math.min(10 + ((currentPage / params.max_pages) * 40), 50);
              await updateProgress(`Page ${currentPage}: ${searchResult.resultats.length} offres récupérées`, fetchProgress);

              if (searchResult.resultats.length === 0) {
                hasMorePages = false;
                break;
              }

              // Process offers
              for (const ftOffer of searchResult.resultats) {
                try {
                  // Normalize France Travail offer
                  const normalizedOffer = {
                    source_id: ftOffer.id,
                    source_type: 'france_travail' as const,
                    title: ftOffer.intitule,
                    description: ftOffer.description,
                    company_name: ftOffer.entreprise?.nom || null,
                    company_siret: ftOffer.entreprise?.siret || null,
                    location_name: ftOffer.lieuTravail?.commune || null,
                    location_postal_code: ftOffer.lieuTravail?.codePostal || null,
                    contract_type: ftOffer.typeContrat?.code || null,
                    salary_min: ftOffer.salaire?.minimum || null,
                    salary_max: ftOffer.salaire?.maximum || null,
                    rome_code: ftOffer.romeCode || null,
                    posted_at: ftOffer.dateCreation ? new Date(ftOffer.dateCreation).toISOString() : new Date().toISOString(),
                    raw_data: ftOffer,
                  };

                  // Generate fingerprint
                  const fingerprint = generateOfferFingerprint({
                    title: normalizedOffer.title,
                    company: normalizedOffer.company_name || '',
                    location: normalizedOffer.location_name || '',
                    sourceId: normalizedOffer.source_id,
                  });

                  if (!params.dry_run) {
                    // Check for duplicates
                    const { data: existingOffer } = await supabase
                      .from('offers_raw')
                      .select('id')
                      .eq('canonical_fingerprint', fingerprint)
                      .single();

                    if (existingOffer) {
                      result.totalDeduplicated++;
                    } else {
                      // Insert into offers_raw
                      const { error: insertError } = await supabase
                        .from('offers_raw')
                        .insert([{
                          ...normalizedOffer,
                          canonical_fingerprint: fingerprint,
                          created_at: new Date().toISOString(),
                        }]);

                      if (insertError) {
                        result.errors.push(`Insert failed: ${insertError.message}`);
                        result.totalErrors++;
                      } else {
                        result.totalInserted++;
                      }
                    }
                  } else {
                    result.totalInserted++;
                  }
                  
                  result.totalProcessed++;

                  // Update progress every 25 offers
                  if (result.totalProcessed % 25 === 0) {
                    const processingProgress = Math.min(50 + ((result.totalProcessed / result.totalFetched) * 40), 90);
                    await updateProgress(
                      `Traité: ${result.totalProcessed}/${result.totalFetched} offres FT`,
                      processingProgress
                    );
                  }

                } catch (offerError) {
                  result.errors.push(`Offer ${ftOffer.id}: ${offerError}`);
                  result.totalErrors++;
                }
              }

              // Check for more pages
              hasMorePages = currentPage < searchResult.nbPages && currentPage < params.max_pages;
              currentPage++;

              // Rate limiting (10 req/s max for FT)
              await new Promise(resolve => setTimeout(resolve, 120));

            } catch (pageError) {
              result.errors.push(`Page ${currentPage}: ${pageError}`);
              result.totalErrors++;
              hasMorePages = false;
            }
          }
        }

        // Finalize ingestion
        await updateProgress('Ingestion France Travail terminée avec succès', 100);
        
        console.log(`[FT Ingestion ${batchId}] Completed:`, {
          totalFetched: result.totalFetched,
          totalProcessed: result.totalProcessed,
          totalInserted: result.totalInserted,
          totalDeduplicated: result.totalDeduplicated,
          totalErrors: result.totalErrors
        });

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

// GET endpoint for France Travail ingestion statistics (admin only)
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

    // Get recent batches
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
    console.error('Error fetching FT admin stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}