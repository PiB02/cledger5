/**
 * Admin Batch Monitoring API
 * Real-time batch tracking and management for ingestion processes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseService } from '@/lib/supabase';
import { IngestionBatchService, SourceType } from '@/lib/batch/ingestion-batch-service';
import { errorFactory } from '@/lib/errors';
import { z } from 'zod';

const BatchListParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  source_type: z.enum(['lba', 'france_travail']).optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
  active_only: z.coerce.boolean().default(false),
});

async function verifyAdminAccess(userId: string | null) {
  if (!userId) {
    throw errorFactory.UNAUTHORIZED('Authentication required');
  }

  const supabase = createSupabaseService();
  const { data: user } = await supabase
    .from('app_users')
    .select('role')
    .eq('clerk_id', userId)
    .single();

  if (!user || user.role !== 'admin') {
    throw errorFactory.FORBIDDEN('Admin privileges required');
  }

  return supabase;
}

// GET /api/admin/batches - List batches with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    const supabase = await verifyAdminAccess(userId);
    
    const { searchParams } = new URL(request.url);
    const params = BatchListParamsSchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      source_type: searchParams.get('source_type'),
      status: searchParams.get('status'),
      active_only: searchParams.get('active_only'),
    });

    const batchService = new IngestionBatchService(supabase);

    let batches;
    if (params.active_only) {
      batches = await batchService.getActiveBatches();
    } else {
      // Build query with filters
      let query = supabase
        .from('ingestion_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .range(params.offset, params.offset + params.limit - 1);

      if (params.source_type) {
        query = query.eq('source_type', params.source_type);
      }

      if (params.status) {
        query = query.eq('status', params.status);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      batches = data || [];
    }

    // Get summary statistics
    const stats = await batchService.getBatchStats(params.source_type as SourceType);

    return NextResponse.json({
      success: true,
      data: {
        batches,
        stats,
        pagination: {
          limit: params.limit,
          offset: params.offset,
          total: batches.length,
        }
      }
    });

  } catch (error: any) {
    console.error('Admin batch list error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to retrieve batches',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/admin/batches/[id]/cancel - Cancel a batch
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    const supabase = await verifyAdminAccess(userId);

    const body = await request.json();
    const { action, batch_id } = body;

    if (!batch_id) {
      throw errorFactory.BAD_REQUEST('batch_id is required');
    }

    const batchService = new IngestionBatchService(supabase);

    switch (action) {
      case 'cancel':
        await batchService.cancelBatch(batch_id);
        
        // Audit log
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'batch_cancelled',
          resource: 'ingestion_batch',
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent'),
          metadata: { batch_id },
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `Batch ${batch_id} cancelled successfully`
        });

      default:
        throw errorFactory.BAD_REQUEST(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('Admin batch action error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Batch action failed',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}