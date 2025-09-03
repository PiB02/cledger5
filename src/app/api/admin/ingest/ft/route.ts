/**
 * GDPR-Compliant Admin France Travail Ingestion API
 * Uses Clerk authentication instead of exposed credentials
 * Implements audit trails and proper access controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseService } from '@/lib/supabase';
import { errorFactory } from '@/lib/errors';
import { checkAdminAccess, logAdminAccess } from '@/lib/auth/dev-admin';
import { z } from 'zod';

// Request validation schema (same as original)
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
        dev_bypass: adminCheck.bypassReason,
        initiated_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    }).select('id').single();

    // Forward to internal ingestion API with server-side secret
    const internalResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ingest/ft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.ADMIN_SECRET!,
        'x-audit-log-id': auditEntry.data?.id || '',
        'x-admin-user': userId,
      },
      body: JSON.stringify(params),
    });

    const result = await internalResponse.json();

    // AUDIT LOG: Operation completed
    await supabase.from('audit_logs').update({
      metadata: {
        params,
        result,
        completed_at: new Date().toISOString(),
      }
    }).eq('id', auditEntry.data?.id);

    if (!internalResponse.ok) {
      throw new Error(result.error || 'Ingestion failed');
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      audit_id: auditEntry.data?.id,
    });

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

// GET endpoint for ingestion status (admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    const adminCheck = await checkAdminAccess(userId);

    if (!adminCheck.isAdmin) {
      throw errorFactory.FORBIDDEN('Admin privileges required');
    }

    // Forward to internal API
    const internalResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ingest/ft`, {
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