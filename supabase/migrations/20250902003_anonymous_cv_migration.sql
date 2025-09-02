-- Migration: Anonymous CV to User Migration System
-- This migration adds functions to migrate anonymous CV sessions to authenticated users

-- Function to migrate anonymous CV session to authenticated user
CREATE OR REPLACE FUNCTION migrate_anonymous_cv_to_user(
  p_session_token TEXT,
  p_cv_session_id UUID,
  p_user_id TEXT  -- Clerk user ID
)
RETURNS JSONB AS $$
DECLARE
  v_session_id UUID;
  v_cv_session anonymous_cv_sessions%ROWTYPE;
  v_cv_profile_id UUID;
  v_cv_document_id UUID;
  v_result JSONB := '{}'::JSONB;
  v_existing_profile_count INTEGER;
BEGIN
  -- Validate session token and get session ID
  SELECT id INTO v_session_id
  FROM anonymous_sessions
  WHERE session_token = p_session_token
    AND is_active = TRUE
    AND expires_at > NOW();
    
  IF v_session_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired session token'
    );
  END IF;
  
  -- Get CV session data
  SELECT * INTO v_cv_session
  FROM anonymous_cv_sessions
  WHERE id = p_cv_session_id
    AND anonymous_session_id = v_session_id
    AND processing_status = 'completed';
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CV session not found or not completed'
    );
  END IF;
  
  -- Check if user already has CV profiles (limit to avoid duplicates)
  SELECT COUNT(*) INTO v_existing_profile_count
  FROM cv_profiles cp
  JOIN users u ON u.id::uuid = cp.user_id
  WHERE u.id = p_user_id;
  
  IF v_existing_profile_count >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User already has maximum number of CV profiles'
    );
  END IF;

  -- Start the migration process
  BEGIN
    -- Create CV document record
    INSERT INTO cv_documents (
      id,
      filename,
      file_size_bytes,
      file_type,
      storage_path,
      parse_status,
      uploaded_at
    ) VALUES (
      gen_random_uuid(),
      v_cv_session.filename,
      v_cv_session.file_size_bytes,
      CASE 
        WHEN v_cv_session.filename ILIKE '%.pdf' THEN 'pdf'
        WHEN v_cv_session.filename ILIKE '%.docx' THEN 'docx'
        WHEN v_cv_session.filename ILIKE '%.doc' THEN 'doc'
        ELSE 'unknown'
      END,
      v_cv_session.storage_path,
      'completed',
      v_cv_session.created_at
    ) RETURNING id INTO v_cv_document_id;
    
    -- Create CV profile record linked to user
    INSERT INTO cv_profiles (
      id,
      user_id,
      document_id,
      profile_title,
      profile_summary,
      profile_tags,
      summary_confidence,
      seniority_years,
      career_level,
      is_searchable,
      created_at,
      last_updated
    ) VALUES (
      gen_random_uuid(),
      p_user_id::uuid,
      v_cv_document_id,
      COALESCE(v_cv_session.partial_results->>'profile_title', 'CV Profile'),
      COALESCE(v_cv_session.partial_results->>'summary', ''),
      CASE 
        WHEN v_cv_session.partial_results->'skills' IS NOT NULL THEN
          ARRAY(SELECT jsonb_array_elements_text(v_cv_session.partial_results->'skills'))
        ELSE ARRAY[]::text[]
      END,
      COALESCE((v_cv_session.partial_results->>'analysis_confidence')::real, 0.8),
      COALESCE((v_cv_session.partial_results->>'experience_years')::integer, 0),
      COALESCE(v_cv_session.partial_results->>'experience_level', 'junior'),
      true,
      v_cv_session.created_at,
      v_cv_session.updated_at
    ) RETURNING id INTO v_cv_profile_id;
    
    -- Migrate skills if available
    IF v_cv_session.partial_results->'skills_detailed' IS NOT NULL THEN
      INSERT INTO cv_skills (
        cv_profile_id,
        skill_name,
        skill_category,
        confidence_score,
        years_experience,
        source_detected
      )
      SELECT 
        v_cv_profile_id,
        skill->>'name',
        COALESCE(skill->>'category', 'general'),
        COALESCE((skill->>'confidence')::real, 0.8),
        COALESCE((skill->>'years')::integer, 0),
        'ai_extraction'
      FROM jsonb_array_elements(v_cv_session.partial_results->'skills_detailed') AS skill;
    END IF;
    
    -- Mark anonymous session as converted
    UPDATE anonymous_sessions
    SET 
      converted_to_user_id = p_user_id::uuid,
      converted_at = NOW(),
      is_active = false
    WHERE id = v_session_id;
    
    -- Mark CV session as migrated
    UPDATE anonymous_cv_sessions
    SET 
      metadata = COALESCE(metadata, '{}'::jsonb) || 
                 jsonb_build_object(
                   'migrated_to_user', p_user_id,
                   'migrated_at', NOW(),
                   'cv_profile_id', v_cv_profile_id,
                   'cv_document_id', v_cv_document_id
                 )
    WHERE id = p_cv_session_id;
    
    -- Build success response
    v_result := jsonb_build_object(
      'success', true,
      'cv_profile_id', v_cv_profile_id,
      'cv_document_id', v_cv_document_id,
      'skills_migrated', COALESCE(jsonb_array_length(v_cv_session.partial_results->'skills_detailed'), 0),
      'original_session_id', v_session_id,
      'migrated_at', NOW()
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback any partial changes and return error
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Migration failed: ' || SQLERRM,
      'error_code', SQLSTATE
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if anonymous session can be migrated
CREATE OR REPLACE FUNCTION can_migrate_anonymous_session(
  p_session_token TEXT,
  p_user_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_session_id UUID;
  v_cv_sessions_count INTEGER;
  v_user_cv_count INTEGER;
  v_session_expired BOOLEAN;
BEGIN
  -- Check if session exists and is valid
  SELECT 
    id,
    expires_at < NOW()
  INTO v_session_id, v_session_expired
  FROM anonymous_sessions
  WHERE session_token = p_session_token
    AND is_active = TRUE;
    
  IF v_session_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_migrate', false,
      'reason', 'Session not found or inactive'
    );
  END IF;
  
  IF v_session_expired THEN
    RETURN jsonb_build_object(
      'can_migrate', false,
      'reason', 'Session expired'
    );
  END IF;
  
  -- Check if session has completed CV sessions
  SELECT COUNT(*)
  INTO v_cv_sessions_count
  FROM anonymous_cv_sessions
  WHERE anonymous_session_id = v_session_id
    AND processing_status = 'completed';
    
  IF v_cv_sessions_count = 0 THEN
    RETURN jsonb_build_object(
      'can_migrate', false,
      'reason', 'No completed CV sessions found'
    );
  END IF;
  
  -- Check user CV limit
  SELECT COUNT(*)
  INTO v_user_cv_count
  FROM cv_profiles cp
  JOIN users u ON u.id::uuid = cp.user_id
  WHERE u.id = p_user_id;
  
  IF v_user_cv_count >= 3 THEN
    RETURN jsonb_build_object(
      'can_migrate', false,
      'reason', 'User has reached maximum CV limit'
    );
  END IF;
  
  -- All checks passed
  RETURN jsonb_build_object(
    'can_migrate', true,
    'cv_sessions_ready', v_cv_sessions_count,
    'user_cv_count', v_user_cv_count,
    'remaining_slots', 3 - v_user_cv_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to service role
GRANT EXECUTE ON FUNCTION migrate_anonymous_cv_to_user(TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION can_migrate_anonymous_session(TEXT, TEXT) TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION migrate_anonymous_cv_to_user(TEXT, UUID, TEXT) IS 'Migrate anonymous CV session data to authenticated user account';
COMMENT ON FUNCTION can_migrate_anonymous_session(TEXT, TEXT) IS 'Check if anonymous session can be migrated to user account';

-- Success notification
DO $$ 
BEGIN 
  RAISE NOTICE 'Anonymous CV Migration System completed successfully';
  RAISE NOTICE 'Functions: migrate_anonymous_cv_to_user, can_migrate_anonymous_session';
  RAISE NOTICE 'Security: SECURITY DEFINER functions with service_role permissions';
END $$;