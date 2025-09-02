/**
 * Anonymous Session Cleanup Job API
 * POST /api/anonymous/cleanup
 * 
 * Automated cleanup job for expired anonymous sessions and related data.
 * Should be called periodically by cron jobs or monitoring systems.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { errorFactory } from '@/lib/errors'
import {
  cleanupExpiredSessions,
  cleanupRateLimitRecords,
  getRateLimitingStats,
} from '@/lib/anonymous-sessions'

/**
 * Validate cleanup request authorization
 * Uses admin secret or cron job authorization
 */
async function validateCleanupAuthorization(request: NextRequest): Promise<boolean> {
  // Check for admin secret
  const adminSecret = request.headers.get('x-admin-secret')
  if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
    return true
  }

  // Check for cron job authorization (Vercel, Cloudflare, etc.)
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) {
    return true
  }

  // Check for Vercel cron authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader && process.env.CRON_SECRET) {
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    if (authHeader === expectedAuth) {
      return true
    }
  }

  // Check for internal service calls (localhost only in development)
  if (process.env.NODE_ENV === 'development') {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (!forwardedFor && !realIP) {
      // Likely internal request
      return true
    }
  }

  return false
}

/**
 * POST /api/anonymous/cleanup
 * Run cleanup job for expired anonymous sessions
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authorization
    const isAuthorized = await validateCleanupAuthorization(request)
    
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Cleanup job requires admin or cron authorization',
          details: {
            required_headers: [
              'x-admin-secret (with admin secret)',
              'x-cron-secret (with cron secret)',
              'authorization: Bearer <cron-secret>'
            ]
          }
        },
        { status: 401 }
      )
    }

    console.log('Starting anonymous session cleanup job...')
    const startTime = Date.now()

    // Run cleanup operations in parallel
    const [
      sessionCleanup,
      rateLimitCleanup,
      statsBefore,
    ] = await Promise.all([
      cleanupExpiredSessions(),
      cleanupRateLimitRecords(),
      getRateLimitingStats(),
    ])

    // Get stats after cleanup
    const statsAfter = await getRateLimitingStats()

    const executionTime = Date.now() - startTime

    console.log(`Anonymous session cleanup completed in ${executionTime}ms`, {
      deleted_sessions: sessionCleanup.deletedSessions,
      deleted_rate_limit_records: rateLimitCleanup.deleted_records,
      stats_before: statsBefore,
      stats_after: statsAfter,
    })

    return NextResponse.json({
      success: true,
      message: 'Anonymous session cleanup completed successfully',
      execution_time_ms: executionTime,
      cleanup_results: {
        deleted_sessions: sessionCleanup.deletedSessions,
        deleted_rate_limit_records: rateLimitCleanup.deleted_records,
      },
      statistics: {
        before_cleanup: {
          total_sessions: statsBefore.total_sessions,
          blocked_sessions: statsBefore.blocked_sessions,
          high_usage_sessions: statsBefore.high_usage_sessions,
        },
        after_cleanup: {
          total_sessions: statsAfter.total_sessions,
          blocked_sessions: statsAfter.blocked_sessions,
          high_usage_sessions: statsAfter.high_usage_sessions,
        },
        efficiency: {
          sessions_cleaned_percentage: statsBefore.total_sessions > 0 
            ? Math.round((sessionCleanup.deletedSessions / statsBefore.total_sessions) * 100) 
            : 0,
          avg_api_calls_per_session: statsAfter.avg_api_calls_per_session,
          avg_uploads_per_session: statsAfter.avg_uploads_per_session,
        }
      },
      next_cleanup_recommendation: {
        schedule: 'Every 15-30 minutes',
        endpoint: '/api/anonymous/cleanup',
        method: 'POST',
        headers: {
          'x-cron-secret': 'your-cron-secret'
        }
      }
    })

  } catch (error: any) {
    console.error('Anonymous session cleanup failed:', error)
    
    // Handle app errors
    if (error.statusCode) {
      return NextResponse.json(
        {
          success: false,
          error: error.code || 'CLEANUP_ERROR',
          message: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      )
    }

    // Fallback error response
    return NextResponse.json(
      {
        success: false,
        error: 'CLEANUP_FAILED',
        message: 'Anonymous session cleanup job failed',
        details: {
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/anonymous/cleanup
 * Get cleanup job status and statistics (without running cleanup)
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authorization (same as POST)
    const isAuthorized = await validateCleanupAuthorization(request)
    
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Cleanup status requires admin or cron authorization'
        },
        { status: 401 }
      )
    }

    // Get current statistics without running cleanup
    const stats = await getRateLimitingStats()

    return NextResponse.json({
      success: true,
      message: 'Anonymous session statistics retrieved successfully',
      current_statistics: stats,
      cleanup_configuration: {
        session_lifetime_minutes: 60,
        cv_session_lifetime_hours: 2,
        cleanup_interval_minutes: 15,
        rate_limit_window_minutes: 60,
      },
      recommendations: {
        sessions_to_cleanup: Math.max(0, stats.total_sessions - stats.blocked_sessions),
        blocked_sessions_need_attention: stats.blocked_sessions > 10,
        high_usage_pattern_detected: stats.high_usage_sessions / Math.max(1, stats.total_sessions) > 0.1,
      }
    })

  } catch (error: any) {
    console.error('Failed to get cleanup statistics:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'STATS_RETRIEVAL_FAILED',
        message: 'Failed to retrieve cleanup statistics'
      },
      { status: 500 }
    )
  }
}