/**
 * GDPR-Compliant Admin LBA Ingestion API
 * Uses Clerk authentication instead of exposed credentials
 * Implements audit trails and proper access controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseService } from '@/lib/supabase';
import { errorFactory } from '@/lib/errors';
import { checkAdminAccess, logAdminAccess } from '@/lib/auth/dev-admin';
import { z } from 'zod';
import crypto from 'crypto';

// Request validation schema (same as original)
const IngestRequestSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(), 
  limit: z.number().min(1).max(10000).default(1000),
  perPage: z.number().min(10).max(500).default(100),
  departments: z.array(z.string()).optional(),
  romeCodes: z.array(z.string()).default(['M1805']),
  dryRun: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // GDPR COMPLIANCE: Authenticated admin verification with dev bypass
    const { userId } = auth();
    const adminCheck = await checkAdminAccess(userId);

    if (!adminCheck.isAdmin) {
      // Log unauthorized access attempt
      if (userId) {
        await logAdminAccess(userId, 'admin_access_denied', 'lba_ingestion', request);
      }
      
      throw errorFactory.FORBIDDEN('Admin privileges required');
    }

    // Validate request
    const body = await request.json();
    const params = IngestRequestSchema.parse(body);

    // Generate batch ID for progress tracking
    const { randomUUID } = await import('crypto');
    const batchId = randomUUID();

    // AUDIT LOG: Admin operation started
    await logAdminAccess(adminCheck.userId!, 'lba_ingestion_start', 'lba_ingestion', request);
    
    const supabase = createSupabaseService();
    const auditEntry = await supabase.from('audit_logs').insert({
      user_id: adminCheck.userId!,
      action: 'lba_ingestion_start', 
      resource: 'lba_ingestion',
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

    // DIRECT IMPLEMENTATION: Call LBA API directly to bypass middleware issues
    const { LBAClient } = await import('@cledger5/api-clients');
    const { generateOfferFingerprint } = await import('@cledger5/utils');
    const cryptoModule = await import('crypto');

    // Verify LBA API configuration
    const lbaApiKey = process.env.LBA_ACCESS_TOKEN;
    if (!lbaApiKey) {
      throw errorFactory.INTERNAL_ERROR('LBA API key not configured');
    }

    // Initialize LBA client
    const lbaClient = new LBAClient({
      apiKey: lbaApiKey,
    });

    // Retourner immédiatement le batchId pour permettre la connexion SSE
    const response = NextResponse.json({
      success: true,
      data: {
        batchId,
        status: 'starting',
        message: 'Ingestion lancée, connexion au flux temps réel...'
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
      dryRun: params.dryRun,
      status: 'running' as const,
      startTime: new Date().toISOString(),
    };

    // Fonction helper pour envoyer les mises à jour de progression
    // SOLUTION: Utiliser directement le store global au lieu des endpoints HTTP
    const updateProgress = async (stage: string, progress: number) => {
      try {
        // Mise à jour directe du store global
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
          console.log(`Progress updated directly: ${batchId} - ${progress}% - ${stage}`);
        } else {
          console.warn('Global batch progress store not available');
        }
      } catch (updateError) {
        console.warn('Failed to update progress:', updateError);
      }
    };

    // Lancer l'ingestion en arrière-plan
    setImmediate(async () => {
      try {
      // Ensure partition exists for non-dry runs
      if (!params.dryRun) {
        try {
          const { data: partitionResult } = await supabase
            .rpc('ensure_offers_raw_partition', { target_date: new Date().toISOString() });
          console.log('Partition check:', partitionResult);
        } catch (partitionError) {
          console.warn('Failed to ensure partition exists:', partitionError);
        }
      }

      // Fetch offers from LBA API
      const searchParams = {
        from: params.from,
        to: params.to,
        departments: params.departments,
        romeCodes: params.romeCodes,
        per_page: params.perPage,
      };

        // Mise à jour initiale
        await updateProgress('Récupération des données depuis LBA...', 5);

        let processedCount = 0;
        let fetchedBatches = 0;
        
        for await (const offers of lbaClient.fetchAllOffers(searchParams)) {
          fetchedBatches++;
          result.totalFetched += offers.length;
          
          // Mise à jour progression après chaque batch récupéré
          const fetchProgress = Math.min(20 + (fetchedBatches * 15), 50);
          await updateProgress(`Récupéré ${result.totalFetched} offres...`, fetchProgress);

          for (const lbaOffer of offers) {
            try {
              // Map to canonical format
              const canonicalOffer = lbaClient.mapToCanonical(lbaOffer);
              
              // Calculate content hash
              const contentHash = cryptoModule.createHash('sha256').update(JSON.stringify(lbaOffer)).digest('hex');
              
              if (!params.dryRun) {
                // Check for existing offer first
                const { data: existingOffer } = await supabase
                  .from('offers_raw')
                  .select('id')
                  .eq('source_id', 'LBA')
                  .eq('source_offer_id', canonicalOffer.external_id)
                  .single();

                if (existingOffer) {
                  // Duplicate found, update last_seen_at
                  const { error: updateError } = await supabase
                    .from('offers_raw')
                    .update({ 
                      last_seen_at: new Date().toISOString(),
                      raw: lbaOffer // Update with latest data
                    })
                    .eq('id', existingOffer.id);
                    
                  if (updateError) {
                    console.error('Error updating existing offer:', updateError);
                    result.errors.push(`Update error for ${canonicalOffer.external_id}`);
                    result.totalErrors++;
                    continue;
                  }
                  
                  result.totalDeduplicated++;
                  console.log(`🔄 LBA Offer ${canonicalOffer.external_id} already exists (duplicate)`);
                } else {
                  // New offer, insert it
                  const now = new Date().toISOString();
                  const { error: rawError } = await supabase
                    .from('offers_raw')
                    .insert({
                      id: crypto.randomUUID(),
                      source_id: 'LBA',
                      source_offer_id: canonicalOffer.external_id,
                      fetched_at: now,
                      last_seen_at: now,
                      is_active: true,
                      origin_url: null,
                      raw: lbaOffer,
                      content_sha256: Buffer.from(contentHash, 'hex'),
                    });
                  
                  if (rawError) {
                    console.error('Error saving raw offer:', rawError);
                    result.errors.push(`Raw save error for ${canonicalOffer.external_id}`);
                    result.totalErrors++;
                    continue;
                  }
                  
                  result.totalInserted++;
                  console.log(`✅ LBA Offer ${canonicalOffer.external_id} inserted successfully`);
                }
              } else {
                result.totalInserted++;
              }
              
              result.totalProcessed++;
              
              // Mise à jour progression toutes les 50 offres traitées
              if (result.totalProcessed % 50 === 0) {
                const processingProgress = Math.min(50 + ((result.totalProcessed / params.limit) * 40), 90);
                await updateProgress(
                  `Traitement: ${result.totalProcessed}/${result.totalFetched} offres`,
                  processingProgress
                );
              }
            } catch (error) {
              console.error('Error processing offer:', error);
              result.errors.push(`Processing error: ${error}`);
              result.totalErrors++;
            }
          }

          // Limit check
          if (result.totalFetched >= params.limit) {
            await updateProgress('Limite atteinte, finalisation...', 95);
            break;
          }
        }

        // Finalisation de l'ingestion
        await updateProgress('Ingestion terminée avec succès', 100);
        
        console.log(`[LBA Ingestion ${batchId}] Completed:`, {
          totalFetched: result.totalFetched,
          totalProcessed: result.totalProcessed,
          totalInserted: result.totalInserted,
          totalErrors: result.totalErrors
        });

      } catch (error) {
        console.error('LBA ingestion error:', error);
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
        result.totalErrors++;
        
        // Notification d'erreur
        try {
          await updateProgress('Erreur lors de l\'ingestion', 0);
        } catch (updateError) {
          console.warn('Failed to update error progress:', updateError);
        }
      }
    });
    
    return response;

  } catch (error: any) {
    console.error('Admin LBA ingestion error:', error);
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

// GET endpoint for ingestion status (admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    const adminCheck = await checkAdminAccess(userId);

    if (!adminCheck.isAdmin) {
      throw errorFactory.FORBIDDEN('Admin privileges required');
    }

    // Forward to internal API
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const internalResponse = await fetch(`${baseUrl}/api/ingest/lba`, {
      method: 'GET',
      headers: {
        'x-admin-secret': process.env.ADMIN_SECRET!,
      },
    });

    const result = await internalResponse.json();

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}