/**
 * Persistent Batch Tracking Service for cledger5 Ingestion
 * Replaces memory-based Map<string, BatchStatus> with database persistence
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseService } from '@/lib/supabase';

export type BatchStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type SourceType = 'lba' | 'france_travail';

export interface BatchProgress {
  total_fetched?: number;
  total_processed?: number;
  total_inserted?: number;
  total_duplicates?: number;
  total_errors?: number;
  error_messages?: string[];
  progress_data?: any;
}

export interface BatchInfo {
  id: string;
  source_type: SourceType;
  status: BatchStatus;
  batch_params: any;
  progress_data: any;
  total_fetched: number;
  total_processed: number;
  total_inserted: number;
  total_duplicates: number;
  total_errors: number;
  error_messages: string[];
  retry_count: number;
  initiated_by: string;
  audit_log_id?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export class IngestionBatchService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createSupabaseService();
  }

  /**
   * Create a new batch tracking entry
   */
  async createBatch(
    sourceType: SourceType, 
    params: any, 
    initiatedBy?: string,
    auditLogId?: string
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('ingestion_batches')
        .insert({
          source_type: sourceType,
          batch_params: params,
          status: 'pending',
          initiated_by: initiatedBy,
          audit_log_id: auditLogId,
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Failed to create batch:', error);
        throw new Error(`Failed to create batch: ${error.message}`);
      }
      
      console.log(`✅ Batch created: ${data.id} (${sourceType})`);
      return data.id;
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  /**
   * Update batch status
   */
  async updateStatus(batchId: string, status: BatchStatus): Promise<void> {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      // Set completion timestamp for final statuses
      if (['completed', 'failed', 'cancelled'].includes(status)) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('ingestion_batches')
        .update(updateData)
        .eq('id', batchId);

      if (error) {
        console.error(`Failed to update batch status to ${status}:`, error);
        throw new Error(`Failed to update batch status: ${error.message}`);
      }

      console.log(`📊 Batch ${batchId} status updated: ${status}`);
    } catch (error) {
      console.error('Error updating batch status:', error);
      throw error;
    }
  }

  /**
   * Update batch progress and statistics
   */
  async updateProgress(
    batchId: string, 
    progress: BatchProgress
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ingestion_batches')
        .update({
          ...progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (error) {
        console.error('Failed to update batch progress:', error);
        throw new Error(`Failed to update batch progress: ${error.message}`);
      }

      // Log progress update (non-blocking)
      const totalProcessed = progress.total_processed || 0;
      const totalFetched = progress.total_fetched || 0;
      if (totalFetched > 0) {
        const progressPercent = Math.round((totalProcessed / totalFetched) * 100);
        console.log(`📈 Batch ${batchId} progress: ${progressPercent}% (${totalProcessed}/${totalFetched})`);
      }
    } catch (error) {
      console.error('Error updating batch progress:', error);
      throw error;
    }
  }

  /**
   * Get batch information
   */
  async getBatchInfo(batchId: string): Promise<BatchInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('ingestion_batches')
        .select('*')
        .eq('id', batchId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        console.error('Failed to get batch info:', error);
        throw new Error(`Failed to get batch info: ${error.message}`);
      }
      
      return data as BatchInfo;
    } catch (error) {
      console.error('Error getting batch info:', error);
      throw error;
    }
  }

  /**
   * List active batches (pending or running)
   */
  async getActiveBatches(): Promise<BatchInfo[]> {
    try {
      const { data, error } = await this.supabase
        .from('ingestion_batches')
        .select('*')
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to get active batches:', error);
        throw new Error(`Failed to get active batches: ${error.message}`);
      }
      
      return (data || []) as BatchInfo[];
    } catch (error) {
      console.error('Error getting active batches:', error);
      throw error;
    }
  }

  /**
   * List recent batches with pagination
   */
  async getRecentBatches(
    limit: number = 20, 
    offset: number = 0,
    sourceType?: SourceType
  ): Promise<BatchInfo[]> {
    try {
      let query = this.supabase
        .from('ingestion_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (sourceType) {
        query = query.eq('source_type', sourceType);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to get recent batches:', error);
        throw new Error(`Failed to get recent batches: ${error.message}`);
      }
      
      return (data || []) as BatchInfo[];
    } catch (error) {
      console.error('Error getting recent batches:', error);
      throw error;
    }
  }

  /**
   * Add error message to batch
   */
  async addError(batchId: string, errorMessage: string): Promise<void> {
    try {
      // Get current error messages
      const batchInfo = await this.getBatchInfo(batchId);
      if (!batchInfo) {
        throw new Error(`Batch ${batchId} not found`);
      }

      const updatedErrors = [...(batchInfo.error_messages || []), errorMessage];

      const { error } = await this.supabase
        .from('ingestion_batches')
        .update({
          error_messages: updatedErrors,
          total_errors: updatedErrors.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (error) {
        console.error('Failed to add batch error:', error);
        throw new Error(`Failed to add batch error: ${error.message}`);
      }

      console.log(`❌ Batch ${batchId} error added: ${errorMessage}`);
    } catch (error) {
      console.error('Error adding batch error:', error);
      throw error;
    }
  }

  /**
   * Cancel a batch
   */
  async cancelBatch(batchId: string): Promise<void> {
    try {
      await this.updateStatus(batchId, 'cancelled');
      console.log(`🛑 Batch ${batchId} cancelled`);
    } catch (error) {
      console.error('Error cancelling batch:', error);
      throw error;
    }
  }

  /**
   * Complete batch with final statistics
   */
  async completeBatch(
    batchId: string, 
    finalStats: BatchProgress,
    success: boolean = true
  ): Promise<void> {
    try {
      await this.updateProgress(batchId, finalStats);
      await this.updateStatus(batchId, success ? 'completed' : 'failed');
      
      const totalInserted = finalStats.total_inserted || 0;
      const totalErrors = finalStats.total_errors || 0;
      console.log(`✅ Batch ${batchId} completed: ${totalInserted} inserted, ${totalErrors} errors`);
    } catch (error) {
      console.error('Error completing batch:', error);
      throw error;
    }
  }

  /**
   * Get batch statistics summary
   */
  async getBatchStats(sourceType?: SourceType): Promise<any> {
    try {
      let query = this.supabase
        .from('ingestion_batches')
        .select('status, total_fetched, total_inserted, total_errors, created_at');

      if (sourceType) {
        query = query.eq('source_type', sourceType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get batch stats:', error);
        throw new Error(`Failed to get batch stats: ${error.message}`);
      }

      const stats = (data || []).reduce((acc: any, batch: any) => {
        acc.total_batches += 1;
        acc.total_fetched += batch.total_fetched || 0;
        acc.total_inserted += batch.total_inserted || 0;
        acc.total_errors += batch.total_errors || 0;
        
        if (batch.status === 'completed') acc.successful_batches += 1;
        if (batch.status === 'failed') acc.failed_batches += 1;

        return acc;
      }, {
        total_batches: 0,
        successful_batches: 0,
        failed_batches: 0,
        total_fetched: 0,
        total_inserted: 0,
        total_errors: 0,
      });

      stats.success_rate = stats.total_batches > 0 
        ? Math.round((stats.successful_batches / stats.total_batches) * 100) 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting batch stats:', error);
      throw error;
    }
  }
}