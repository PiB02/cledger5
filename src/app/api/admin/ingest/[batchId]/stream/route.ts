import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdminAccess } from '@/lib/auth/dev-admin';
import { errorFactory } from '@/lib/errors';
import { z } from 'zod';

// Schema de validation pour l'ID de batch
const paramsSchema = z.object({
  batchId: z.string().uuid('Batch ID invalide')
});

type RouteContext = {
  params: Promise<{ batchId: string }>
};

// Store pour suivre les progressions en mémoire (en production, utiliser Redis)
// Utilisation d'un store global pour éviter les problèmes de routes dynamiques
if (!global.batchProgressStore) {
  global.batchProgressStore = new Map();
}
const batchProgressStore = global.batchProgressStore as Map<string, {
  status: 'running' | 'completed' | 'error';
  progress: number;
  stage: string;
  metrics: {
    totalFetched: number;
    totalProcessed: number;
    totalInserted: number;
    totalUpdated: number;
    totalDeduplicated: number;
    totalErrors: number;
    errors: string[];
  };
  lastUpdate: Date;
}>;

// Fonction globale pour mettre à jour le store
global.updateBatchProgress = (batchId: string, data: any) => {
  batchProgressStore.set(batchId, {
    ...data,
    lastUpdate: new Date()
  });
};

/**
 * SSE endpoint pour suivre la progression d'une ingestion
 * Format SSE : "data: {json}\n\n"
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Vérification admin
    const { userId } = auth();
    const adminCheck = await checkAdminAccess(userId);

    if (!adminCheck.isAdmin) {
      throw errorFactory.FORBIDDEN('Admin privileges required');
    }

    // Validation du batch ID
    const params = await context.params;
    const validation = paramsSchema.safeParse(params);
    
    if (!validation.success) {
      return Response.json(
        { error: 'BATCH_ID_INVALID', message: 'ID de batch invalide' },
        { status: 400 }
      );
    }
    
    const { batchId } = validation.data;
    
    // Création du stream SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Initialiser le batch dans le store s'il n'existe pas
        if (!batchProgressStore.has(batchId)) {
          batchProgressStore.set(batchId, {
            status: 'running',
            progress: 0,
            stage: 'Initialisation...',
            metrics: {
              totalFetched: 0,
              totalProcessed: 0,
              totalInserted: 0,
              totalUpdated: 0,
              totalDeduplicated: 0,
              totalErrors: 0,
              errors: []
            },
            lastUpdate: new Date()
          });
        }

        const batchInfo = batchProgressStore.get(batchId)!;
        
        // Envoi du message initial
        const initialMessage = {
          type: 'ingestion_start',
          data: {
            batchId,
            status: batchInfo.status,
            stage: batchInfo.stage,
            progress: batchInfo.progress,
            metrics: batchInfo.metrics
          },
          timestamp: new Date().toISOString()
        };
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`)
        );
        
        // Si le batch est déjà terminé, fermer le stream
        if (['completed', 'error'].includes(batchInfo.status)) {
          const finalMessage = {
            type: 'ingestion_finished',
            data: { 
              batchId,
              status: batchInfo.status,
              metrics: batchInfo.metrics
            },
            timestamp: new Date().toISOString()
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finalMessage)}\n\n`)
          );
          controller.close();
          return;
        }
        
        // Polling pour les mises à jour
        const interval = setInterval(() => {
          const currentInfo = batchProgressStore.get(batchId);
          if (!currentInfo) {
            clearInterval(interval);
            controller.close();
            return;
          }
          
          // Envoyer une mise à jour
          const progressMessage = {
            type: 'ingestion_progress',
            data: {
              batchId,
              status: currentInfo.status,
              progress: currentInfo.progress,
              stage: currentInfo.stage,
              metrics: currentInfo.metrics
            },
            timestamp: new Date().toISOString()
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(progressMessage)}\n\n`)
          );
          
          // Si terminé, fermer le stream
          if (['completed', 'error'].includes(currentInfo.status)) {
            clearInterval(interval);
            
            const completeMessage = {
              type: 'ingestion_finished',
              data: {
                batchId,
                status: currentInfo.status,
                metrics: currentInfo.metrics
              },
              timestamp: new Date().toISOString()
            };
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(completeMessage)}\n\n`)
            );
            
            controller.close();
          }
        }, 2000); // Toutes les 2 secondes
        
        // Gestion de la déconnexion client
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      }
    });
    
    // Retour de la réponse SSE
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error: any) {
    console.error('Ingestion stream error:', error);
    return Response.json(
      { 
        success: false, 
        error: error.message || 'Stream failed',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST endpoint removed - now handled by /api/admin/ingest/update-progress
// This simplifies the dynamic route and avoids Next.js routing issues
