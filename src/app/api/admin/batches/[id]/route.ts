/**
 * Individual Batch Management API
 * Get details, cancel, and manage specific ingestion batches
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseService } from '@/lib/supabase';
import { IngestionBatchService } from '@/lib/batch/ingestion-batch-service';
import { errorFactory } from '@/lib/errors';

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

// GET /api/admin/batches/[id] - Get batch details
export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth();
    const supabase = await verifyAdminAccess(userId);
    
    const { id } = await context.params;
    const batchService = new IngestionBatchService(supabase);
    
    const batchInfo = await batchService.getBatchInfo(id);
    
    if (!batchInfo) {
      throw errorFactory.NOT_FOUND(`Batch ${id} not found`);
    }

    return NextResponse.json({
      success: true,
      data: batchInfo
    });

  } catch (error: any) {
    console.error('Get batch details error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get batch details',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// PATCH /api/admin/batches/[id] - Update batch (cancel, retry)
export async function PATCH(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth();
    const supabase = await verifyAdminAccess(userId);
    
    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    const batchService = new IngestionBatchService(supabase);
    
    // Verify batch exists
    const batchInfo = await batchService.getBatchInfo(id);
    if (!batchInfo) {
      throw errorFactory.NOT_FOUND(`Batch ${id} not found`);
    }

    switch (action) {
      case 'cancel':
        if (!['pending', 'running'].includes(batchInfo.status)) {
          throw errorFactory.BAD_REQUEST(`Cannot cancel batch in ${batchInfo.status} status`);
        }
        
        await batchService.cancelBatch(id);
        
        // Audit log
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'batch_cancelled',
          resource: 'ingestion_batch',
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent'),
          metadata: { 
            batch_id: id, 
            previous_status: batchInfo.status,
            source_type: batchInfo.source_type 
          },
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `Batch ${id} cancelled successfully`,
          data: { ...batchInfo, status: 'cancelled' }
        });

      case 'retry':
        if (batchInfo.status !== 'failed') {
          throw errorFactory.BAD_REQUEST(`Cannot retry batch in ${batchInfo.status} status`);
        }

        // Create new batch with same parameters
        const newBatchId = await batchService.createBatch(
          batchInfo.source_type,
          batchInfo.batch_params,
          userId
        );

        // Audit log
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'batch_retried',
          resource: 'ingestion_batch',
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent'),
          metadata: { 
            original_batch_id: id,
            new_batch_id: newBatchId,
            source_type: batchInfo.source_type 
          },
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `Batch retry initiated`,
          data: { 
            original_batch_id: id, 
            new_batch_id: newBatchId 
          }
        });

      default:
        throw errorFactory.BAD_REQUEST(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('Batch update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update batch',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// DELETE /api/admin/batches/[id] - Delete batch (completed/failed only)
export async function DELETE(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth();
    const supabase = await verifyAdminAccess(userId);
    
    const { id } = await context.params;
    const batchService = new IngestionBatchService(supabase);
    
    // Verify batch exists and can be deleted
    const batchInfo = await batchService.getBatchInfo(id);
    if (!batchInfo) {
      throw errorFactory.NOT_FOUND(`Batch ${id} not found`);
    }

    if (['pending', 'running'].includes(batchInfo.status)) {
      throw errorFactory.BAD_REQUEST(`Cannot delete active batch. Cancel first.`);
    }

    // Delete batch record
    const { error } = await supabase
      .from('ingestion_batches')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete batch: ${error.message}`);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'batch_deleted',
      resource: 'ingestion_batch',
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent'),
      metadata: { 
        batch_id: id,
        status: batchInfo.status,
        source_type: batchInfo.source_type,
        total_processed: batchInfo.total_processed 
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Batch ${id} deleted successfully`
    });

  } catch (error: any) {
    console.error('Delete batch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete batch',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}