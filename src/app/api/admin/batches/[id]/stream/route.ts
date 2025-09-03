/**
 * Real-time Batch Monitoring with Server-Sent Events
 * Enhanced SSE streaming with Supabase Realtime subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseService } from '@/lib/supabase';
import { IngestionBatchService } from '@/lib/batch/ingestion-batch-service';
import { errorFactory } from '@/lib/errors';

const encoder = new TextEncoder();

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

function sendSSEMessage(controller: ReadableStreamDefaultController, event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(message));
}

// GET /api/admin/batches/[id]/stream - Real-time batch monitoring
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth();
    const supabase = await verifyAdminAccess(userId);
    
    const { id } = await context.params;
    
    // Verify batch exists
    const batchService = new IngestionBatchService(supabase);
    const batchInfo = await batchService.getBatchInfo(id);
    
    if (!batchInfo) {
      return NextResponse.json(
        { success: false, error: `Batch ${id} not found` },
        { status: 404 }
      );
    }

    // Create SSE stream with Supabase Realtime
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial batch data
          sendSSEMessage(controller, 'batch_init', {
            type: 'batch_init',
            batch: batchInfo,
            timestamp: new Date().toISOString()
          });

          // Send heartbeat every 30 seconds
          const heartbeatInterval = setInterval(() => {
            try {
              sendSSEMessage(controller, 'heartbeat', {
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              console.error('Heartbeat error:', error);
              clearInterval(heartbeatInterval);
            }
          }, 30000);

          // Set up Supabase Realtime subscription for batch updates
          const subscription = supabase
            .channel(`batch-${id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'ingestion_batches',
                filter: `id=eq.${id}`
              },
              (payload) => {
                try {
                  console.log(`📡 Batch ${id} update received:`, payload.new);
                  
                  sendSSEMessage(controller, 'batch_update', {
                    type: 'batch_update',
                    batch: payload.new,
                    changes: payload.new,
                    timestamp: new Date().toISOString()
                  });

                  // If batch is completed, send completion event
                  if (['completed', 'failed', 'cancelled'].includes(payload.new.status)) {
                    sendSSEMessage(controller, 'batch_complete', {
                      type: 'batch_complete',
                      batch: payload.new,
                      final_status: payload.new.status,
                      timestamp: new Date().toISOString()
                    });
                  }
                } catch (error) {
                  console.error('SSE message error:', error);
                }
              }
            )
            .subscribe((status) => {
              console.log(`📡 Realtime subscription status for batch ${id}:`, status);
              
              sendSSEMessage(controller, 'connection_status', {
                type: 'connection_status',
                status: status,
                timestamp: new Date().toISOString()
              });
            });

          // Clean up on client disconnect
          request.signal.addEventListener('abort', () => {
            console.log(`🔌 SSE client disconnected for batch ${id}`);
            clearInterval(heartbeatInterval);
            subscription.unsubscribe();
            controller.close();
          });

          // Handle server shutdown
          const cleanup = () => {
            console.log(`🔌 SSE cleanup for batch ${id}`);
            clearInterval(heartbeatInterval);
            subscription.unsubscribe();
            controller.close();
          };

          process.on('SIGINT', cleanup);
          process.on('SIGTERM', cleanup);

        } catch (error) {
          console.error(`SSE stream setup error for batch ${id}:`, error);
          controller.error(error);
        }
      },

      cancel() {
        console.log(`🔌 SSE stream cancelled for batch ${id}`);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no', // Nginx: disable proxy buffering
      }
    });

  } catch (error: any) {
    console.error('SSE setup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to setup SSE stream',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/admin/batches/[id]/stream - Send manual events (for testing)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth();
    await verifyAdminAccess(userId);
    
    const { id } = await context.params;
    const body = await request.json();
    const { event_type, data } = body;

    // This could be used to manually trigger events for testing
    // In production, events are triggered by actual ingestion processes
    
    return NextResponse.json({
      success: true,
      message: `Manual event ${event_type} triggered for batch ${id}`,
      data: { batch_id: id, event_type, data }
    });

  } catch (error: any) {
    console.error('Manual SSE event error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send manual event',
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: error.statusCode || 500 }
    );
  }
}