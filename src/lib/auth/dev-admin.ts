/**
 * Development Admin Access System
 * 
 * SECURITY WARNING: This module provides admin bypass for development only.
 * Must be disabled in production via NODE_ENV check.
 */

import { createSupabaseService } from '@/lib/supabase';

const isDevelopment = process.env.NODE_ENV === 'development';
const devAdminBypass = process.env.DEV_ADMIN_BYPASS === 'true';

export interface AdminCheckResult {
  isAdmin: boolean;
  bypassReason?: string;
  userId?: string;
}

/**
 * Check if user has admin access with dev bypass support
 */
export async function checkAdminAccess(userId: string | null): Promise<AdminCheckResult> {
  // Production security: strict role checking
  if (!isDevelopment || !devAdminBypass) {
    if (!userId) {
      return { isAdmin: false };
    }

    try {
      const supabase = createSupabaseService();
      const { data: user } = await supabase
        .from('app_users')
        .select('role')
        .eq('clerk_id', userId)
        .single();

      return { 
        isAdmin: user?.role === 'admin',
        userId 
      };
    } catch (error) {
      console.error('Admin check error:', error);
      return { isAdmin: false };
    }
  }

  // Development bypass: auto-admin for authenticated users
  if (userId) {
    console.log('🔓 DEV MODE: Auto-granting admin access to user', userId.slice(0, 8));
    
    // Auto-create or update admin user in dev
    try {
      await ensureDevAdminUser(userId);
    } catch (error) {
      console.warn('Failed to create dev admin user:', error);
    }

    return { 
      isAdmin: true, 
      bypassReason: 'DEV_ADMIN_BYPASS enabled',
      userId 
    };
  }

  return { isAdmin: false };
}

/**
 * Ensure user exists in app_users with admin role (dev only)
 */
async function ensureDevAdminUser(userId: string): Promise<void> {
  if (!isDevelopment || !devAdminBypass) {
    return;
  }

  try {
    const supabase = createSupabaseService();
    
    // Try to insert or update user as admin
    const { error } = await supabase
      .from('app_users')
      .upsert({
        clerk_id: userId,
        role: 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'clerk_id'
      });

    if (error) {
      console.warn('Failed to upsert dev admin user:', error);
    } else {
      console.log('✅ Dev admin user ensured for:', userId.slice(0, 8));
    }
  } catch (error) {
    console.warn('Error ensuring dev admin user:', error);
  }
}

/**
 * Get development admin status for debugging
 */
export function getDevAdminStatus() {
  return {
    isDevelopment,
    devAdminBypass,
    status: isDevelopment && devAdminBypass ? 'ACTIVE' : 'DISABLED'
  };
}

/**
 * Log admin access for audit (respects dev mode)
 */
export async function logAdminAccess(
  userId: string, 
  action: string, 
  resource: string, 
  request?: any
) {
  try {
    const supabase = createSupabaseService();
    
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: isDevelopment && devAdminBypass ? `DEV_${action}` : action,
      resource,
      ip_address: request?.ip || 'localhost',
      user_agent: request?.headers?.get('user-agent') || 'dev-client',
      metadata: {
        dev_mode: isDevelopment && devAdminBypass,
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Failed to log admin access:', error);
  }
}