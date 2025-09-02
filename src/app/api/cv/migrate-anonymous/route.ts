import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/cv/migrate-anonymous
 * Migrates anonymous CV session data to authenticated user account
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionToken, cvSessionId } = body;

    if (!sessionToken || !cvSessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: sessionToken and cvSessionId' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseAdmin();

    // Start transaction
    const { data, error } = await supabase.rpc('migrate_anonymous_cv_to_user', {
      p_session_token: sessionToken,
      p_cv_session_id: cvSessionId,
      p_user_id: userId
    });

    if (error) {
      console.error('Migration failed:', error);
      return NextResponse.json(
        { success: false, error: 'Migration failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Anonymous CV data successfully migrated to user account',
      data: data
    });

  } catch (error) {
    console.error('Migrate anonymous CV error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}