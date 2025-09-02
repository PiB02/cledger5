-- Phase 2: Anonymous CV Processing Pipeline Extension Migration
-- This migration extends the existing CV processing system to handle anonymous users
-- while maintaining complete compatibility with authenticated user workflows

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. EXTEND CV UPLOAD SESSIONS FOR ANONYMOUS SUPPORT
-- ==============================================================================

-- Add optional foreign key to anonymous sessions
-- NULL means authenticated user, non-NULL means anonymous user
ALTER TABLE cv_upload_sessions 
ADD COLUMN IF NOT EXISTS anonymous_session_id UUID DEFAULT NULL 
REFERENCES anonymous_sessions(id) ON DELETE CASCADE;

-- Modify user_id to be nullable for anonymous sessions
ALTER TABLE cv_upload_sessions 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint: either user_id OR anonymous_session_id must be set, but not both
ALTER TABLE cv_upload_sessions 
ADD CONSTRAINT cv_upload_sessions_user_xor_anon 
CHECK (
  (user_id IS NOT NULL AND anonymous_session_id IS NULL) OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

-- Add session type field for easier querying
ALTER TABLE cv_upload_sessions 
ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'authenticated' 
CHECK (session_type IN ('authenticated', 'anonymous'));

-- Update session_type based on existing data
UPDATE cv_upload_sessions 
SET session_type = CASE 
  WHEN anonymous_session_id IS NOT NULL THEN 'anonymous'
  ELSE 'authenticated'
END;

-- Add columns for anonymous-specific tracking
ALTER TABLE cv_upload_sessions 
ADD COLUMN IF NOT EXISTS partial_results_shown BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS full_access_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS conversion_attempted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS converted_user_id UUID DEFAULT NULL; -- Set when user registers

-- ==============================================================================
-- 2. EXTEND CV PROFILES FOR ANONYMOUS SUPPORT
-- ==============================================================================

-- Make user_id nullable in cv_profiles for anonymous sessions
ALTER TABLE cv_profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Add anonymous session tracking
ALTER TABLE cv_profiles 
ADD COLUMN IF NOT EXISTS anonymous_session_id UUID DEFAULT NULL 
REFERENCES anonymous_sessions(id) ON DELETE CASCADE;

-- Add constraint: either user_id OR anonymous_session_id must be set
ALTER TABLE cv_profiles 
ADD CONSTRAINT cv_profiles_user_xor_anon 
CHECK (
  (user_id IS NOT NULL AND anonymous_session_id IS NULL) OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

-- Add access control fields
ALTER TABLE cv_profiles 
ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'full' 
CHECK (access_level IN ('partial', 'full')),
ADD COLUMN IF NOT EXISTS partial_data_shown JSONB DEFAULT NULL, -- What was shown to anonymous user
ADD COLUMN IF NOT EXISTS conversion_eligible BOOLEAN DEFAULT TRUE; -- Can be migrated when user registers

-- ==============================================================================
-- 3. EXTEND CV EMBEDDINGS FOR ANONYMOUS SUPPORT
-- ==============================================================================

-- Make cv_embeddings compatible with anonymous profiles
-- The cv_profile_id relationship will handle the anonymous linkage

-- ==============================================================================
-- 4. CREATE ANONYMOUS CV RESULTS TABLE
-- ==============================================================================

-- Stores partial results shown to anonymous users with expiration
CREATE TABLE IF NOT EXISTS anonymous_cv_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  upload_session_id UUID NOT NULL REFERENCES cv_upload_sessions(id) ON DELETE CASCADE,
  
  -- Partial results data (limited information)
  skills_count INTEGER NOT NULL DEFAULT 0,
  experience_level TEXT,
  job_matches_count INTEGER NOT NULL DEFAULT 0,
  confidence_score NUMERIC(3,2), -- Overall confidence (0.00-1.00)
  
  -- Limited skills preview (max 5 skills)
  skills_preview JSONB DEFAULT '[]',
  
  -- Teaser information to encourage registration
  additional_skills_available INTEGER DEFAULT 0,
  detailed_matches_available INTEGER DEFAULT 0,
  ai_insights_available BOOLEAN DEFAULT FALSE,
  
  -- Access tracking
  viewed_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Expiration and cleanup
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 minutes'),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- ==============================================================================
-- 5. CREATE ANONYMOUS TO AUTHENTICATED MIGRATION LOG
-- ==============================================================================

-- Tracks successful migrations when anonymous users register
CREATE TABLE IF NOT EXISTS anonymous_cv_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source anonymous data
  anonymous_session_id UUID NOT NULL, -- May be deleted, so no FK constraint
  original_upload_session_id UUID NOT NULL,
  
  -- Target authenticated data
  new_user_id UUID NOT NULL,
  new_upload_session_id UUID NOT NULL,
  new_cv_profile_id UUID,
  
  -- Migration details
  migration_status TEXT NOT NULL CHECK (migration_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  migrated_data_types TEXT[] NOT NULL DEFAULT '{}', -- ['upload_session', 'cv_profile', 'cv_embeddings', 'results']
  
  -- Audit trail
  migration_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  migration_completed_at TIMESTAMPTZ DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- ==============================================================================
-- 6. ADD PERFORMANCE INDEXES
-- ==============================================================================

-- CV upload sessions indexes for anonymous support
CREATE INDEX IF NOT EXISTS idx_cv_upload_sessions_anonymous_session 
ON cv_upload_sessions(anonymous_session_id) WHERE anonymous_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cv_upload_sessions_session_type 
ON cv_upload_sessions(session_type, upload_status);

CREATE INDEX IF NOT EXISTS idx_cv_upload_sessions_conversion 
ON cv_upload_sessions(converted_user_id) WHERE converted_user_id IS NOT NULL;

-- CV profiles indexes for anonymous support
CREATE INDEX IF NOT EXISTS idx_cv_profiles_anonymous_session 
ON cv_profiles(anonymous_session_id) WHERE anonymous_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cv_profiles_access_level 
ON cv_profiles(access_level, created_at);

-- Anonymous CV results indexes
CREATE INDEX IF NOT EXISTS idx_anonymous_cv_results_session_id 
ON anonymous_cv_results(anonymous_session_id);

CREATE INDEX IF NOT EXISTS idx_anonymous_cv_results_expires_at 
ON anonymous_cv_results(expires_at);

CREATE INDEX IF NOT EXISTS idx_anonymous_cv_results_upload_session 
ON anonymous_cv_results(upload_session_id);

-- Migration tracking indexes
CREATE INDEX IF NOT EXISTS idx_anonymous_cv_migrations_anonymous_session 
ON anonymous_cv_migrations(anonymous_session_id);

CREATE INDEX IF NOT EXISTS idx_anonymous_cv_migrations_new_user 
ON anonymous_cv_migrations(new_user_id);

CREATE INDEX IF NOT EXISTS idx_anonymous_cv_migrations_status 
ON anonymous_cv_migrations(migration_status, migration_started_at);

-- ==============================================================================
-- 7. UPDATE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Update cv_upload_sessions policies for anonymous support
-- Anonymous sessions are handled via service_role only (no direct public access)

-- Allow service_role full access for anonymous session management
CREATE POLICY "Service role full access on cv_upload_sessions"
  ON cv_upload_sessions
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Update cv_profiles policies
-- Users can access their own profiles OR profiles from their anonymous session (via service_role)
DROP POLICY IF EXISTS cv_profiles_own ON cv_profiles;
CREATE POLICY cv_profiles_own ON cv_profiles
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Service role full access for cv_profiles (needed for anonymous processing)
CREATE POLICY "Service role full access on cv_profiles"
  ON cv_profiles
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Anonymous CV results - service role only (no direct public access)
ALTER TABLE anonymous_cv_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on anonymous_cv_results"
  ON anonymous_cv_results
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "No public access to anonymous_cv_results"
  ON anonymous_cv_results
  FOR ALL
  TO anon, authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- Anonymous CV migrations - admin and service role only
ALTER TABLE anonymous_cv_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on anonymous_cv_migrations"
  ON anonymous_cv_migrations
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Admin access on anonymous_cv_migrations"
  ON anonymous_cv_migrations
  FOR ALL
  TO authenticated
  USING (app_is_admin())
  WITH CHECK (app_is_admin());

CREATE POLICY "No public access to anonymous_cv_migrations"
  ON anonymous_cv_migrations
  FOR ALL
  TO anon
  USING (FALSE)
  WITH CHECK (FALSE);

-- ==============================================================================
-- 8. CREATE UTILITY FUNCTIONS
-- ==============================================================================

-- Function to generate partial results for anonymous users
CREATE OR REPLACE FUNCTION generate_anonymous_partial_results(
  p_cv_profile_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_profile cv_profiles%ROWTYPE;
  v_partial_results JSONB;
  v_skills_array JSONB;
  v_limited_skills JSONB := '[]';
  v_skill JSONB;
BEGIN
  -- Get CV profile
  SELECT * INTO v_profile FROM cv_profiles WHERE id = p_cv_profile_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Extract skills from raw AI extraction (limit to 5 skills)
  IF v_profile.raw_ai_extraction ? 'skills_mastered' THEN
    v_skills_array := v_profile.raw_ai_extraction->'skills_mastered';
    
    -- Take only first 5 skills
    FOR v_skill IN SELECT * FROM jsonb_array_elements(v_skills_array) LIMIT 5
    LOOP
      v_limited_skills := v_limited_skills || v_skill;
    END LOOP;
  END IF;
  
  -- Build partial results
  v_partial_results := jsonb_build_object(
    'skills_count', CASE 
      WHEN v_profile.raw_ai_extraction ? 'skills_mastered' 
      THEN jsonb_array_length(v_profile.raw_ai_extraction->'skills_mastered')
      ELSE 0 
    END,
    'experience_level', v_profile.career_level,
    'confidence_score', v_profile.ai_confidence_global,
    'skills_preview', v_limited_skills,
    'location', jsonb_build_object(
      'city', v_profile.city,
      'region', v_profile.region_code
    ),
    'additional_features_note', 'Register to see complete analysis, detailed job matches, and AI-powered insights'
  );
  
  RETURN v_partial_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate anonymous CV data to authenticated user
CREATE OR REPLACE FUNCTION migrate_anonymous_cv_to_user(
  p_anonymous_session_id UUID,
  p_new_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_migration_id UUID;
  v_upload_session_id UUID;
  v_cv_profile_id UUID;
  v_new_upload_session_id UUID;
  v_new_cv_profile_id UUID;
  v_migrated_types TEXT[] := '{}';
BEGIN
  -- Create migration record
  INSERT INTO anonymous_cv_migrations (
    anonymous_session_id,
    new_user_id,
    original_upload_session_id,
    new_upload_session_id -- Will be updated below
  ) VALUES (
    p_anonymous_session_id,
    p_new_user_id,
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
  ) RETURNING id INTO v_migration_id;
  
  -- Get upload session ID
  SELECT id INTO v_upload_session_id
  FROM cv_upload_sessions 
  WHERE anonymous_session_id = p_anonymous_session_id
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_upload_session_id IS NOT NULL THEN
    -- Update upload session to belong to authenticated user
    UPDATE cv_upload_sessions 
    SET 
      user_id = p_new_user_id,
      anonymous_session_id = NULL,
      session_type = 'authenticated',
      converted_user_id = p_new_user_id,
      full_access_available = TRUE
    WHERE id = v_upload_session_id;
    
    v_migrated_types := v_migrated_types || 'upload_session';
    v_new_upload_session_id := v_upload_session_id;
  END IF;
  
  -- Get and migrate CV profile
  SELECT id INTO v_cv_profile_id
  FROM cv_profiles 
  WHERE anonymous_session_id = p_anonymous_session_id
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_cv_profile_id IS NOT NULL THEN
    -- Update CV profile to belong to authenticated user
    UPDATE cv_profiles 
    SET 
      user_id = p_new_user_id,
      anonymous_session_id = NULL,
      access_level = 'full',
      partial_data_shown = NULL,
      conversion_eligible = FALSE
    WHERE id = v_cv_profile_id;
    
    v_migrated_types := v_migrated_types || 'cv_profile';
    v_new_cv_profile_id := v_cv_profile_id;
  END IF;
  
  -- Update migration record with results
  UPDATE anonymous_cv_migrations 
  SET 
    original_upload_session_id = COALESCE(v_upload_session_id, '00000000-0000-0000-0000-000000000000'),
    new_upload_session_id = COALESCE(v_new_upload_session_id, '00000000-0000-0000-0000-000000000000'),
    new_cv_profile_id = v_new_cv_profile_id,
    migrated_data_types = v_migrated_types,
    migration_status = 'completed',
    migration_completed_at = NOW()
  WHERE id = v_migration_id;
  
  RETURN v_migration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired anonymous CV data
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_cv_data()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_temp_count INTEGER;
BEGIN
  -- Clean up expired anonymous CV results
  DELETE FROM anonymous_cv_results 
  WHERE expires_at <= NOW();
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_temp_count;
  
  -- Clean up failed upload sessions for anonymous users older than 24 hours
  DELETE FROM cv_upload_sessions 
  WHERE anonymous_session_id IS NOT NULL 
    AND upload_status = 'failed' 
    AND created_at <= NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_temp_count;
  
  -- Clean up orphaned CV profiles (anonymous sessions that no longer exist)
  DELETE FROM cv_profiles 
  WHERE anonymous_session_id IS NOT NULL
    AND anonymous_session_id NOT IN (
      SELECT id FROM anonymous_sessions WHERE is_active = TRUE
    );
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_temp_count;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get anonymous session info for CV processing
CREATE OR REPLACE FUNCTION get_anonymous_session_for_cv(
  p_session_token TEXT
)
RETURNS TABLE (
  session_id UUID,
  is_valid BOOLEAN,
  expires_at TIMESTAMPTZ,
  upload_attempts INTEGER,
  can_upload BOOLEAN
) AS $$
DECLARE
  v_session anonymous_sessions%ROWTYPE;
  v_upload_count INTEGER;
BEGIN
  -- Get anonymous session
  SELECT * INTO v_session
  FROM anonymous_sessions
  WHERE session_token = p_session_token
    AND is_active = TRUE
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, NULL::TIMESTAMPTZ, 0, FALSE;
    RETURN;
  END IF;
  
  -- Count current upload attempts
  SELECT COUNT(*) INTO v_upload_count
  FROM cv_upload_sessions
  WHERE anonymous_session_id = v_session.id;
  
  -- Update last accessed
  UPDATE anonymous_sessions 
  SET last_accessed_at = NOW()
  WHERE id = v_session.id;
  
  RETURN QUERY SELECT 
    v_session.id,
    TRUE,
    v_session.expires_at,
    v_upload_count,
    v_upload_count < v_session.max_upload_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 9. GRANT PERMISSIONS
-- ==============================================================================

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION generate_anonymous_partial_results(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION migrate_anonymous_cv_to_user(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_anonymous_cv_data() TO service_role;
GRANT EXECUTE ON FUNCTION get_anonymous_session_for_cv(TEXT) TO service_role;

-- Grant to authenticated users for admin operations
GRANT EXECUTE ON FUNCTION cleanup_expired_anonymous_cv_data() TO authenticated;

-- ==============================================================================
-- 10. ADD TABLE COMMENTS
-- ==============================================================================

COMMENT ON COLUMN cv_upload_sessions.anonymous_session_id IS 'Foreign key to anonymous_sessions for anonymous users';
COMMENT ON COLUMN cv_upload_sessions.session_type IS 'Type of session: authenticated or anonymous';
COMMENT ON COLUMN cv_upload_sessions.partial_results_shown IS 'Whether partial results were shown to anonymous user';
COMMENT ON COLUMN cv_upload_sessions.converted_user_id IS 'User ID when anonymous session converts to registration';

COMMENT ON COLUMN cv_profiles.anonymous_session_id IS 'Foreign key to anonymous_sessions for anonymous users';
COMMENT ON COLUMN cv_profiles.access_level IS 'Access level: partial (anonymous) or full (authenticated)';
COMMENT ON COLUMN cv_profiles.partial_data_shown IS 'What limited data was shown to anonymous user';

COMMENT ON TABLE anonymous_cv_results IS 'Partial CV analysis results shown to anonymous users with expiration';
COMMENT ON TABLE anonymous_cv_migrations IS 'Audit log for migrating anonymous CV data to authenticated users';

COMMENT ON FUNCTION generate_anonymous_partial_results(UUID) IS 'Generate limited CV analysis results for anonymous users';
COMMENT ON FUNCTION migrate_anonymous_cv_to_user(UUID, UUID) IS 'Migrate anonymous CV data to authenticated user account';
COMMENT ON FUNCTION cleanup_expired_anonymous_cv_data() IS 'Clean up expired anonymous CV data and orphaned records';

-- ==============================================================================
-- 11. SUCCESS NOTIFICATION
-- ==============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE 'Phase 2: Anonymous CV Processing Pipeline Extension completed successfully';
  RAISE NOTICE 'Extended Tables: cv_upload_sessions, cv_profiles (anonymous support)';
  RAISE NOTICE 'New Tables: anonymous_cv_results, anonymous_cv_migrations';
  RAISE NOTICE 'Security: RLS policies updated for anonymous/authenticated hybrid access';
  RAISE NOTICE 'Features: Partial results, data migration, cleanup automation';
  RAISE NOTICE 'Performance: Optimized indexes for anonymous session lookups';
  RAISE NOTICE 'Ready for: Anonymous CV upload → processing → partial results → conversion';
END $$;