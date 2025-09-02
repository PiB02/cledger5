/**
 * Anonymous Session Rate Limiting Service
 * 
 * Comprehensive rate limiting and abuse prevention for anonymous users.
 * Includes configurable limits, blocking mechanisms, and analytics tracking.
 */

import { createSupabaseAdmin } from '@/lib/supabase/server'
import { errorFactory } from '@/lib/errors'
import {
  ANONYMOUS_SESSION_CONSTANTS,
  RateLimitConfig,
} from '@cledger5/types'

// ============================================================================
// Rate Limit Configuration
// ============================================================================

/**
 * Default rate limiting configuration
 * Can be overridden by environment variables or database settings
 */
const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  max_uploads_per_session: ANONYMOUS_SESSION_CONSTANTS.MAX_UPLOADS_PER_SESSION,
  max_api_calls_per_hour: ANONYMOUS_SESSION_CONSTANTS.MAX_API_CALLS_PER_HOUR,
  upload_window_minutes: ANONYMOUS_SESSION_CONSTANTS.RATE_LIMIT_WINDOW_MINUTES,
  block_duration_minutes: ANONYMOUS_SESSION_CONSTANTS.BLOCK_DURATION_MINUTES,
  cleanup_interval_minutes: ANONYMOUS_SESSION_CONSTANTS.CLEANUP_INTERVAL_MINUTES,
}

/**
 * Get rate limit configuration (can be extended to read from env/database)
 */
function getRateLimitConfig(): RateLimitConfig {
  return {
    max_uploads_per_session: parseInt(process.env.ANONYMOUS_MAX_UPLOADS_PER_SESSION || String(DEFAULT_RATE_LIMIT_CONFIG.max_uploads_per_session)),
    max_api_calls_per_hour: parseInt(process.env.ANONYMOUS_MAX_API_CALLS_PER_HOUR || String(DEFAULT_RATE_LIMIT_CONFIG.max_api_calls_per_hour)),
    upload_window_minutes: parseInt(process.env.ANONYMOUS_UPLOAD_WINDOW_MINUTES || String(DEFAULT_RATE_LIMIT_CONFIG.upload_window_minutes)),
    block_duration_minutes: parseInt(process.env.ANONYMOUS_BLOCK_DURATION_MINUTES || String(DEFAULT_RATE_LIMIT_CONFIG.block_duration_minutes)),
    cleanup_interval_minutes: parseInt(process.env.ANONYMOUS_CLEANUP_INTERVAL_MINUTES || String(DEFAULT_RATE_LIMIT_CONFIG.cleanup_interval_minutes)),
  }
}

// ============================================================================
// Rate Limit Tracking
// ============================================================================

/**
 * Initialize or update rate limiting window for a session
 */
export async function initializeRateLimitWindow(sessionId: string): Promise<void> {
  const supabaseAdmin = await createSupabaseAdmin()
  const config = getRateLimitConfig()
  
  const windowStart = new Date()
  const windowDuration = `${config.upload_window_minutes} minutes`

  // Use upsert to either create new window or update existing one if needed
  const { error } = await supabaseAdmin
    .from('anonymous_session_rate_limits')
    .upsert({
      anonymous_session_id: sessionId,
      window_start: windowStart.toISOString(),
      window_duration: windowDuration,
      api_calls_count: 0,
      upload_attempts: 0,
      max_api_calls: config.max_api_calls_per_hour,
      max_uploads: config.max_uploads_per_session,
      is_blocked: false,
      blocked_until: null,
      block_reason: null,
    }, {
      onConflict: 'anonymous_session_id',
      ignoreDuplicates: false
    })

  if (error) {
    console.error('Failed to initialize rate limit window:', error)
    throw errorFactory.INTERNAL('Failed to initialize rate limiting')
  }
}

/**
 * Check if session is within rate limits
 */
export async function checkRateLimit(
  sessionId: string,
  operation: 'api_call' | 'upload'
): Promise<{
  allowed: boolean
  reason?: string
  retryAfter?: number
  currentCounts: {
    apiCalls: number
    uploads: number
  }
  limits: {
    maxApiCalls: number
    maxUploads: number
  }
}> {
  const supabaseAdmin = await createSupabaseAdmin()
  const config = getRateLimitConfig()

  // Get current rate limit status
  const { data: rateLimit, error } = await supabaseAdmin
    .from('anonymous_session_rate_limits')
    .select('*')
    .eq('anonymous_session_id', sessionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      // Initialize rate limiting for new session
      await initializeRateLimitWindow(sessionId)
      return {
        allowed: true,
        currentCounts: { apiCalls: 0, uploads: 0 },
        limits: { maxApiCalls: config.max_api_calls_per_hour, maxUploads: config.max_uploads_per_session }
      }
    }
    console.error('Failed to check rate limit:', error)
    throw errorFactory.INTERNAL('Failed to check rate limits')
  }

  // Check if currently blocked
  if (rateLimit.is_blocked && rateLimit.blocked_until) {
    const blockedUntil = new Date(rateLimit.blocked_until)
    if (blockedUntil > new Date()) {
      const retryAfter = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000)
      return {
        allowed: false,
        reason: `Blocked until ${blockedUntil.toISOString()}: ${rateLimit.block_reason}`,
        retryAfter,
        currentCounts: { apiCalls: rateLimit.api_calls_count, uploads: rateLimit.upload_attempts },
        limits: { maxApiCalls: rateLimit.max_api_calls, maxUploads: rateLimit.max_uploads }
      }
    } else {
      // Block has expired, unblock the session
      await unblockSession(sessionId)
    }
  }

  // Check if we need to reset the window (time-based)
  const windowStart = new Date(rateLimit.window_start)
  const windowDurationMs = config.upload_window_minutes * 60 * 1000
  const windowEnd = new Date(windowStart.getTime() + windowDurationMs)
  
  if (new Date() > windowEnd) {
    // Reset the window
    await initializeRateLimitWindow(sessionId)
    return {
      allowed: true,
      currentCounts: { apiCalls: 0, uploads: 0 },
      limits: { maxApiCalls: config.max_api_calls_per_hour, maxUploads: config.max_uploads_per_session }
    }
  }

  // Check specific operation limits
  let currentCount: number
  let maxCount: number

  if (operation === 'api_call') {
    currentCount = rateLimit.api_calls_count
    maxCount = rateLimit.max_api_calls
  } else { // upload
    currentCount = rateLimit.upload_attempts
    maxCount = rateLimit.max_uploads
  }

  const wouldExceedLimit = currentCount >= maxCount

  return {
    allowed: !wouldExceedLimit,
    reason: wouldExceedLimit ? `${operation} limit exceeded (${currentCount}/${maxCount})` : undefined,
    retryAfter: wouldExceedLimit ? Math.ceil((windowEnd.getTime() - Date.now()) / 1000) : undefined,
    currentCounts: { apiCalls: rateLimit.api_calls_count, uploads: rateLimit.upload_attempts },
    limits: { maxApiCalls: rateLimit.max_api_calls, maxUploads: rateLimit.max_uploads }
  }
}

/**
 * Increment rate limit counter for a specific operation
 */
export async function incrementRateLimit(
  sessionId: string,
  operation: 'api_call' | 'upload'
): Promise<void> {
  const supabaseAdmin = await createSupabaseAdmin()

  const updateField = operation === 'api_call' ? 'api_calls_count' : 'upload_attempts'
  
  // First get current count, then increment
  const { data: currentLimit } = await supabaseAdmin
    .from('anonymous_session_rate_limits')
    .select(updateField)
    .eq('anonymous_session_id', sessionId)
    .single()
  
  const currentCount = currentLimit?.[updateField] || 0
  
  const { error } = await supabaseAdmin
    .from('anonymous_session_rate_limits')
    .update({
      [updateField]: currentCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('anonymous_session_id', sessionId)

  if (error) {
    console.error(`Failed to increment ${operation} counter:`, error)
    throw errorFactory.INTERNAL('Failed to update rate limit counters')
  }
}

/**
 * Block a session for suspicious activity
 */
export async function blockSession(
  sessionId: string,
  reason: string,
  blockDurationMinutes?: number
): Promise<void> {
  const supabaseAdmin = await createSupabaseAdmin()
  const config = getRateLimitConfig()
  
  const duration = blockDurationMinutes || config.block_duration_minutes
  const blockedUntil = new Date(Date.now() + duration * 60 * 1000)

  const { error } = await supabaseAdmin
    .from('anonymous_session_rate_limits')
    .update({
      is_blocked: true,
      blocked_until: blockedUntil.toISOString(),
      block_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('anonymous_session_id', sessionId)

  if (error) {
    console.error('Failed to block session:', error)
    throw errorFactory.INTERNAL('Failed to block session')
  }

  // Also mark the main session with security flags
  await supabaseAdmin
    .from('anonymous_sessions')
    .update({
      security_flags: {
        blocked_at: new Date().toISOString(),
        block_reason: reason,
        blocked_until: blockedUntil.toISOString()
      },
    })
    .eq('id', sessionId)

  console.log(`Blocked anonymous session ${sessionId} for: ${reason} (until: ${blockedUntil.toISOString()})`)
}

/**
 * Unblock a previously blocked session
 */
export async function unblockSession(sessionId: string): Promise<void> {
  const supabaseAdmin = await createSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('anonymous_session_rate_limits')
    .update({
      is_blocked: false,
      blocked_until: null,
      block_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('anonymous_session_id', sessionId)

  if (error) {
    console.error('Failed to unblock session:', error)
    throw errorFactory.INTERNAL('Failed to unblock session')
  }

  console.log(`Unblocked anonymous session ${sessionId}`)
}

// ============================================================================
// Abuse Detection
// ============================================================================

/**
 * Analyze session behavior for potential abuse patterns
 */
export async function analyzeSessionBehavior(sessionId: string): Promise<{
  riskScore: number
  riskFactors: string[]
  recommendedAction: 'allow' | 'warn' | 'block'
}> {
  const supabaseAdmin = await createSupabaseAdmin()

  // Get session info and rate limit data
  const [sessionResult, rateLimitResult] = await Promise.all([
    supabaseAdmin
      .from('anonymous_sessions')
      .select('*')
      .eq('id', sessionId)
      .single(),
    supabaseAdmin
      .from('anonymous_session_rate_limits')
      .select('*')
      .eq('anonymous_session_id', sessionId)
      .single()
  ])

  if (sessionResult.error || rateLimitResult.error) {
    console.error('Failed to analyze session behavior:', sessionResult.error || rateLimitResult.error)
    return { riskScore: 0, riskFactors: [], recommendedAction: 'allow' }
  }

  const session = sessionResult.data
  const rateLimit = rateLimitResult.data

  const riskFactors: string[] = []
  let riskScore = 0

  // Check upload attempt patterns
  if (session.upload_attempts >= session.max_upload_attempts) {
    riskScore += 30
    riskFactors.push('exceeded_upload_limit')
  }

  // Check API call patterns
  if (rateLimit.api_calls_count > rateLimit.max_api_calls * 0.8) {
    riskScore += 20
    riskFactors.push('high_api_usage')
  }

  // Check session creation patterns (rapid session creation might indicate automation)
  const sessionAge = Date.now() - new Date(session.created_at).getTime()
  const sessionAgeMinutes = sessionAge / (1000 * 60)
  
  if (sessionAgeMinutes < 5 && session.upload_attempts > 1) {
    riskScore += 25
    riskFactors.push('rapid_uploads')
  }

  // Check security flags
  if (session.security_flags) {
    const flags = session.security_flags as Record<string, unknown>
    if (flags.ip_mismatch) {
      riskScore += 40
      riskFactors.push('ip_inconsistency')
    }
    if (flags.user_agent_mismatch) {
      riskScore += 30
      riskFactors.push('user_agent_inconsistency')
    }
  }

  // Check retry patterns in CV sessions
  const { data: cvSessions } = await supabaseAdmin
    .from('anonymous_cv_sessions')
    .select('retry_count')
    .eq('anonymous_session_id', sessionId)

  if (cvSessions) {
    const totalRetries = cvSessions.reduce((sum, session) => sum + session.retry_count, 0)
    if (totalRetries > 3) {
      riskScore += 20
      riskFactors.push('excessive_retries')
    }
  }

  // Determine recommended action based on risk score
  let recommendedAction: 'allow' | 'warn' | 'block'
  if (riskScore >= 70) {
    recommendedAction = 'block'
  } else if (riskScore >= 40) {
    recommendedAction = 'warn'
  } else {
    recommendedAction = 'allow'
  }

  return {
    riskScore,
    riskFactors,
    recommendedAction
  }
}

/**
 * Apply automated abuse prevention measures
 */
export async function applyAbusePreventionMeasures(sessionId: string): Promise<{
  action_taken: string
  risk_score: number
  details: string
}> {
  const analysis = await analyzeSessionBehavior(sessionId)

  switch (analysis.recommendedAction) {
    case 'block':
      await blockSession(
        sessionId,
        `Automated block: Risk score ${analysis.riskScore} (${analysis.riskFactors.join(', ')})`,
        30 // 30 minutes block
      )
      return {
        action_taken: 'blocked',
        risk_score: analysis.riskScore,
        details: `Session blocked for 30 minutes due to: ${analysis.riskFactors.join(', ')}`
      }

    case 'warn':
      // Log warning but don't block
      console.warn(`Anonymous session ${sessionId} flagged for suspicious behavior:`, {
        riskScore: analysis.riskScore,
        riskFactors: analysis.riskFactors
      })
      return {
        action_taken: 'warned',
        risk_score: analysis.riskScore,
        details: `Session flagged but allowed: ${analysis.riskFactors.join(', ')}`
      }

    default:
      return {
        action_taken: 'allowed',
        risk_score: analysis.riskScore,
        details: 'Session behavior within normal parameters'
      }
  }
}

// ============================================================================
// Cleanup and Maintenance
// ============================================================================

/**
 * Clean up expired rate limit records
 */
export async function cleanupRateLimitRecords(): Promise<{ deleted_records: number }> {
  const supabaseAdmin = await createSupabaseAdmin()
  const config = getRateLimitConfig()

  // Delete rate limit records older than twice the window duration
  const cutoffTime = new Date(Date.now() - (config.upload_window_minutes * 2 * 60 * 1000))

  const { error, count } = await supabaseAdmin
    .from('anonymous_session_rate_limits')
    .delete()
    .lt('window_start', cutoffTime.toISOString())

  if (error) {
    console.error('Failed to clean up rate limit records:', error)
    throw errorFactory.INTERNAL('Failed to clean up rate limit records')
  }

  return { deleted_records: count || 0 }
}

/**
 * Get rate limiting statistics for monitoring
 */
export async function getRateLimitingStats(): Promise<{
  total_sessions: number
  blocked_sessions: number
  high_usage_sessions: number
  avg_api_calls_per_session: number
  avg_uploads_per_session: number
  cleanup_stats: {
    last_cleanup: string | null
    records_cleaned: number
  }
}> {
  const supabaseAdmin = await createSupabaseAdmin()

  const [sessionStats, rateLimitStats] = await Promise.all([
    supabaseAdmin
      .from('anonymous_sessions')
      .select('upload_attempts', { count: 'exact' }),
    supabaseAdmin
      .from('anonymous_session_rate_limits')
      .select('api_calls_count, upload_attempts, is_blocked', { count: 'exact' })
  ])

  const totalSessions = sessionStats.count || 0
  const totalRateRecords = rateLimitStats.count || 0
  
  const blockedSessions = rateLimitStats.data?.filter(r => r.is_blocked).length || 0
  const highUsageSessions = rateLimitStats.data?.filter(r => 
    r.api_calls_count > 50 || r.upload_attempts > 2
  ).length || 0

  const totalApiCalls = rateLimitStats.data?.reduce((sum, r) => sum + r.api_calls_count, 0) || 0
  const totalUploads = sessionStats.data?.reduce((sum, s) => sum + s.upload_attempts, 0) || 0

  return {
    total_sessions: totalSessions,
    blocked_sessions: blockedSessions,
    high_usage_sessions: highUsageSessions,
    avg_api_calls_per_session: totalRateRecords > 0 ? totalApiCalls / totalRateRecords : 0,
    avg_uploads_per_session: totalSessions > 0 ? totalUploads / totalSessions : 0,
    cleanup_stats: {
      last_cleanup: null, // Would need to track this in a separate table
      records_cleaned: 0   // Would need to track this in a separate table
    }
  }
}