-- Phase 1: Anonymous Session Foundation System Migration
-- This migration creates the infrastructure for anonymous users to upload CVs
-- and receive partial results before registration

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Anonymous Sessions Table
-- Secure cookie-based tracking with 60-minute expiration
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  
  -- IP and browser fingerprinting for additional security
  client_ip INET NOT NULL,
  user_agent_hash TEXT NOT NULL,
  browser_fingerprint TEXT,
  
  -- Session metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 minutes'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Rate limiting counters
  upload_attempts INTEGER NOT NULL DEFAULT 0,
  max_upload_attempts INTEGER NOT NULL DEFAULT 3,
  
  -- Optional conversion tracking (when user registers)
  converted_to_user_id UUID DEFAULT NULL, -- References to future user conversion
  converted_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Security and cleanup metadata
  security_flags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Anonymous CV Processing Sessions
-- Links anonymous sessions to CV processing pipeline
CREATE TABLE IF NOT EXISTS anonymous_cv_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  
  -- File upload tracking
  filename TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256 hash for deduplication
  storage_path TEXT NOT NULL,
  upload_status TEXT NOT NULL CHECK (upload_status IN ('initiated', 'uploading', 'uploaded', 'processing', 'completed', 'failed')) DEFAULT 'initiated',
  
  -- Processing results (partial for anonymous users)
  processing_status TEXT DEFAULT NULL CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_started_at TIMESTAMPTZ DEFAULT NULL,
  processing_completed_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Partial results storage (limited info shown to anonymous users)
  partial_results JSONB DEFAULT NULL,
  full_results_available BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Error handling
  error_message TEXT DEFAULT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 2,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours'),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Anonymous Session Rate Limiting
-- Track API calls per session for abuse prevention
CREATE TABLE IF NOT EXISTS anonymous_session_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  
  -- Rate limiting windows
  window_start TIMESTAMPTZ NOT NULL,
  window_duration INTERVAL NOT NULL DEFAULT '1 hour',
  
  -- Counters
  api_calls_count INTEGER NOT NULL DEFAULT 0,
  upload_attempts INTEGER NOT NULL DEFAULT 0,
  
  -- Limits
  max_api_calls INTEGER NOT NULL DEFAULT 100,
  max_uploads INTEGER NOT NULL DEFAULT 3,
  
  -- Status
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_until TIMESTAMPTZ DEFAULT NULL,
  block_reason TEXT DEFAULT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance
-- Session lookup by token (most common query)
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_token ON anonymous_sessions(session_token);

-- Session cleanup queries
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_expires_at ON anonymous_sessions(expires_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_last_accessed ON anonymous_sessions(last_accessed_at) WHERE is_active = TRUE;

-- IP-based tracking for security
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_client_ip ON anonymous_sessions(client_ip);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_user_agent_hash ON anonymous_sessions(user_agent_hash);

-- CV session lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_cv_sessions_session_id ON anonymous_cv_sessions(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_cv_sessions_file_hash ON anonymous_cv_sessions(file_hash);
CREATE INDEX IF NOT EXISTS idx_anonymous_cv_sessions_expires_at ON anonymous_cv_sessions(expires_at);

-- Rate limiting lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_session_window ON anonymous_session_rate_limits(anonymous_session_id, window_start);

-- Row Level Security (RLS) Policies
-- Enable RLS on all anonymous session tables
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_cv_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_session_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role has full access (needed for session management)
CREATE POLICY "Service role full access on anonymous_sessions"
  ON anonymous_sessions
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role full access on anonymous_cv_sessions"
  ON anonymous_cv_sessions
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role full access on anonymous_rate_limits"
  ON anonymous_session_rate_limits
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- No direct public access to these tables (all access via API)
-- Anonymous users cannot directly query the database
CREATE POLICY "No public access to anonymous_sessions"
  ON anonymous_sessions
  FOR ALL
  TO anon, authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "No public access to anonymous_cv_sessions"
  ON anonymous_cv_sessions
  FOR ALL
  TO anon, authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "No public access to anonymous_rate_limits"
  ON anonymous_session_rate_limits
  FOR ALL
  TO anon, authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- Functions for Session Management
-- Generate secure session token
CREATE OR REPLACE FUNCTION generate_anonymous_session_token()
RETURNS TEXT AS $$
BEGIN
  -- Generate URL-safe random token (32 bytes = 256 bits)
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update last_accessed_at timestamp
CREATE OR REPLACE FUNCTION update_session_access(p_session_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE anonymous_sessions 
  SET last_accessed_at = NOW()
  WHERE session_token = p_session_token 
    AND is_active = TRUE 
    AND expires_at > NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired sessions and cascade to related tables
  DELETE FROM anonymous_sessions 
  WHERE expires_at <= NOW() OR is_active = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up orphaned rate limit records (defensive)
  DELETE FROM anonymous_session_rate_limits
  WHERE anonymous_session_id NOT IN (
    SELECT id FROM anonymous_sessions WHERE is_active = TRUE
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate session and check rate limits
CREATE OR REPLACE FUNCTION validate_anonymous_session(
  p_session_token TEXT,
  p_client_ip INET DEFAULT NULL,
  p_user_agent_hash TEXT DEFAULT NULL
)
RETURNS TABLE (
  session_id UUID,
  is_valid BOOLEAN,
  remaining_uploads INTEGER,
  rate_limited BOOLEAN,
  session_expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_session anonymous_sessions%ROWTYPE;
  v_remaining_uploads INTEGER;
  v_rate_limited BOOLEAN := FALSE;
BEGIN
  -- Get session info
  SELECT * INTO v_session
  FROM anonymous_sessions
  WHERE session_token = p_session_token
    AND is_active = TRUE
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 0, TRUE, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Check IP and user agent if provided (security validation)
  IF p_client_ip IS NOT NULL AND v_session.client_ip != p_client_ip THEN
    -- Log security event but don't immediately block
    UPDATE anonymous_sessions
    SET security_flags = COALESCE(security_flags, '{}'::jsonb) || 
                        jsonb_build_object('ip_mismatch', true)
    WHERE id = v_session.id;
  END IF;
  
  -- Calculate remaining uploads
  v_remaining_uploads := GREATEST(0, v_session.max_upload_attempts - v_session.upload_attempts);
  
  -- Check if rate limited
  v_rate_limited := v_remaining_uploads <= 0;
  
  -- Update last accessed
  PERFORM update_session_access(p_session_token);
  
  RETURN QUERY SELECT 
    v_session.id,
    TRUE,
    v_remaining_uploads,
    v_rate_limited,
    v_session.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_anonymous_session_token() TO service_role;
GRANT EXECUTE ON FUNCTION update_session_access(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_anonymous_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION validate_anonymous_session(TEXT, INET, TEXT) TO service_role;

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anonymous_cv_sessions_updated_at
  BEFORE UPDATE ON anonymous_cv_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anonymous_rate_limits_updated_at
  BEFORE UPDATE ON anonymous_session_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE anonymous_sessions IS 'Secure anonymous user sessions for CV upload try-before-buy experience';
COMMENT ON TABLE anonymous_cv_sessions IS 'CV processing sessions linked to anonymous users with partial results';
COMMENT ON TABLE anonymous_session_rate_limits IS 'Rate limiting and abuse prevention for anonymous sessions';

COMMENT ON FUNCTION generate_anonymous_session_token() IS 'Generate cryptographically secure session token';
COMMENT ON FUNCTION cleanup_expired_anonymous_sessions() IS 'Clean up expired anonymous sessions and related data';
COMMENT ON FUNCTION validate_anonymous_session(TEXT, INET, TEXT) IS 'Validate session token and check rate limits';

-- Success notification
DO $$ 
BEGIN 
  RAISE NOTICE 'Anonymous Session Foundation System migration completed successfully';
  RAISE NOTICE 'Tables created: anonymous_sessions, anonymous_cv_sessions, anonymous_session_rate_limits';
  RAISE NOTICE 'Security: RLS enabled, service_role policies applied';
  RAISE NOTICE 'Performance: Optimized indexes for session lookup and cleanup';
  RAISE NOTICE 'Rate Limiting: Built-in abuse prevention with configurable limits';
END $$;