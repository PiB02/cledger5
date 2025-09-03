import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdminAccess } from '@/lib/auth/dev-admin';
import { errorFactory } from '@/lib/errors';
import { z } from 'zod';

// Schema de validation pour les données de mise à jour
const updateSchema = z.object({
  batchId: z.string().uuid('Batch ID invalide'),
  status: z.enum(['running', 'completed', 'error']),
  progress: z.number().min(0).max(100),
  stage: z.string(),
  metrics: z.object({
    totalFetched: z.number(),
    totalProcessed: z.number(),
    totalInserted: z.number(),
    totalUpdated: z.number(),
    totalDeduplicated: z.number(),
    totalErrors: z.number(),
    errors: z.array(z.string())
  })
});

/**
 * POST endpoint pour mettre à jour la progression d'une ingestion
 * Utilise un store global pour éviter les problèmes de routes dynamiques
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification admin
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET) {
      // Fallback: vérification Clerk pour dev
      const { userId } = auth();
      const adminCheck = await checkAdminAccess(userId);
      
      if (!adminCheck.isAdmin) {
        throw errorFactory.FORBIDDEN('Admin privileges required');
      }
    }

    // Parse et valide le body de la requête
    const updateData = await request.json();
    const validatedUpdate = updateSchema.parse(updateData);

    const { batchId, ...progressData } = validatedUpdate;

    // Utilise la fonction globale pour mettre à jour le store
    if (global.updateBatchProgress) {
      global.updateBatchProgress(batchId, progressData);
    } else {
      console.warn('Global batch progress store not initialized');
    }

    console.log(`Updated progress for batch ${batchId}: ${validatedUpdate.progress}% - ${validatedUpdate.stage}`);

    return Response.json({ 
      success: true,
      message: 'Progress updated successfully',
      batchId,
      progress: validatedUpdate.progress
    });

  } catch (error: any) {
    console.error('Progress update error:', error);
    
    if (error.name === 'ZodError') {
      return Response.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        success: false, 
        error: error.message || 'Update failed',
        code: error.code || 'UPDATE_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}