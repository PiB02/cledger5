/**
 * Admin Access Check API
 * Supports development bypass for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess, logAdminAccess, getDevAdminStatus } from '@/lib/auth/dev-admin';

// Dynamic Clerk import with fallback for development
let clerkAuth: any = null;
try {
  const clerkModule = require('@clerk/nextjs/server');
  clerkAuth = clerkModule.auth;
} catch (error) {
  console.warn('Clerk not available, using dev bypass mode');
}

export async function POST(request: NextRequest) {
  try {
    // Get userId with fallback for dev mode
    let userId: string | null = null;
    
    if (clerkAuth) {
      try {
        const authResult = clerkAuth();
        userId = authResult?.userId || null;
      } catch (error) {
        console.warn('Clerk auth failed:', error);
      }
    }
    
    // DEVELOPMENT BYPASS: Allow admin access even without Clerk auth in dev mode
    const devStatus = getDevAdminStatus();
    if (devStatus.isDevelopment && devStatus.devAdminBypass) {
      console.log('🔓 DEV MODE: Bypassing Clerk auth requirement');
      const fakeUserId = userId || 'dev-admin-user';
      
      return NextResponse.json({
        isAdmin: true,
        bypassReason: 'DEV_ADMIN_BYPASS enabled (no Clerk auth required)',
        devMode: true,
        userId: fakeUserId
      });
    }
    
    if (!userId) {
      return NextResponse.json({ 
        isAdmin: false,
        error: 'Not authenticated' 
      });
    }

    const adminCheck = await checkAdminAccess(userId);
    
    // Log admin check (for audit trail)
    if (adminCheck.isAdmin) {
      await logAdminAccess(userId, 'admin_check_success', 'admin_interface', request);
    }

    // Include dev status in response for transparency
    const currentDevStatus = getDevAdminStatus();
    
    return NextResponse.json({
      isAdmin: adminCheck.isAdmin,
      bypassReason: adminCheck.bypassReason,
      devMode: currentDevStatus.isDevelopment && currentDevStatus.devAdminBypass,
      userId: adminCheck.userId
    });

  } catch (error: any) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { 
        isAdmin: false,
        error: error.message || 'Admin check failed',
        code: 'ADMIN_CHECK_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for dev status (development only)
export async function GET(request: NextRequest) {
  const devStatus = getDevAdminStatus();
  
  if (!devStatus.isDevelopment) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    devAdminStatus: devStatus,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}