-- Phase 10: CV Processing Extensions Migration
-- This migration adds additional tables needed for CV processing infrastructure
-- The core CV tables (cv_documents, cv_profiles, etc.) are already implemented

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CV Upload Sessions (for multi-file uploads and progress tracking)
CREATE TABLE IF NOT EXISTS cv_upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- References auth.users(id) via JWT
  status TEXT NOT NULL CHECK (status IN ('uploading', 'processing', 'completed', 'failed')) DEFAULT 'uploading',
  files_expected INTEGER NOT NULL DEFAULT 1,
  files_uploaded INTEGER NOT NULL DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- CV Processing Queue (for background job management)
CREATE TABLE IF NOT EXISTS cv_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID NOT NULL REFERENCES cv_profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES cv_documents(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 10 CHECK (priority BETWEEN 1 AND 100),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'queued',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  processing_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CV File Validation Results
CREATE TABLE IF NOT EXISTS cv_file_validations (
  document_id UUID PRIMARY KEY REFERENCES cv_documents(id) ON DELETE CASCADE,
  file_type_validated TEXT NOT NULL, -- 'pdf', 'docx', 'doc'
  file_size_bytes BIGINT NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT FALSE,
  validation_errors JSONB, -- Array of validation error codes
  content_preview TEXT, -- First 500 chars for debugging
  language_detected TEXT, -- 'fr', 'en', etc.
  page_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CV Processing Metrics (for performance monitoring)
CREATE TABLE IF NOT EXISTS cv_processing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER NOT NULL DEFAULT EXTRACT(hour FROM NOW()),
  total_uploads INTEGER NOT NULL DEFAULT 0,
  successful_processing INTEGER NOT NULL DEFAULT 0,
  failed_processing INTEGER NOT NULL DEFAULT 0,
  avg_processing_time_ms INTEGER,
  avg_file_size_bytes BIGINT,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_usd NUMERIC(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, hour)
);

-- Indexes for optimal performance

-- Upload sessions
CREATE INDEX IF NOT EXISTS cv_upload_sessions_user_status_idx ON cv_upload_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS cv_upload_sessions_expires_idx ON cv_upload_sessions(expires_at) WHERE status IN ('uploading', 'processing');

-- Processing queue - critical for job processing performance
CREATE INDEX IF NOT EXISTS cv_processing_queue_status_priority_idx ON cv_processing_queue(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS cv_processing_queue_cv_idx ON cv_processing_queue(cv_id);
CREATE INDEX IF NOT EXISTS cv_processing_queue_retry_idx ON cv_processing_queue(retry_count, max_retries) WHERE status = 'failed';

-- File validations
CREATE INDEX IF NOT EXISTS cv_file_validations_valid_idx ON cv_file_validations(is_valid);
CREATE INDEX IF NOT EXISTS cv_file_validations_type_idx ON cv_file_validations(file_type_validated);

-- Metrics
CREATE INDEX IF NOT EXISTS cv_processing_metrics_date_hour_idx ON cv_processing_metrics(date DESC, hour DESC);

-- RLS Policies following existing Cledger5 patterns

-- CV Upload Sessions: users can only access their own sessions
ALTER TABLE cv_upload_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY cv_upload_sessions_own ON cv_upload_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY cv_upload_sessions_admin ON cv_upload_sessions
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Processing Queue: admin only for queue management
ALTER TABLE cv_processing_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY cv_processing_queue_admin ON cv_processing_queue
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());
-- Users can read their own queue items
CREATE POLICY cv_processing_queue_user_read ON cv_processing_queue
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM cv_profiles p WHERE p.id = cv_processing_queue.cv_id AND p.user_id = auth.uid()
  ));

-- File Validations: follow cv_documents access pattern
ALTER TABLE cv_file_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY cv_file_validations_admin ON cv_file_validations
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());
CREATE POLICY cv_file_validations_owner_read ON cv_file_validations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM cv_documents d
    JOIN cv_profiles p ON p.document_id = d.id
    WHERE d.id = cv_file_validations.document_id AND p.user_id = auth.uid()
  ));

-- Processing Metrics: admin only
ALTER TABLE cv_processing_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY cv_processing_metrics_admin ON cv_processing_metrics
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Utility functions for CV processing

-- Function to clean up expired upload sessions
CREATE OR REPLACE FUNCTION cleanup_expired_cv_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cv_upload_sessions 
  WHERE expires_at < NOW() AND status IN ('uploading', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get next queued CV for processing
CREATE OR REPLACE FUNCTION get_next_cv_for_processing()
RETURNS TABLE (
  queue_id UUID,
  cv_id UUID,
  document_id UUID,
  priority INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.cv_id, q.document_id, q.priority
  FROM cv_processing_queue q
  WHERE q.status = 'queued' 
    AND q.retry_count < q.max_retries
  ORDER BY q.priority DESC, q.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$;

-- Function to update processing metrics
CREATE OR REPLACE FUNCTION update_cv_processing_metrics(
  p_processing_time_ms INTEGER,
  p_file_size_bytes BIGINT,
  p_tokens_used INTEGER DEFAULT 0,
  p_cost_usd NUMERIC(10,6) DEFAULT 0,
  p_success BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hour INTEGER := EXTRACT(hour FROM NOW());
BEGIN
  INSERT INTO cv_processing_metrics (
    date, hour, total_uploads, successful_processing, failed_processing,
    avg_processing_time_ms, avg_file_size_bytes, total_tokens_used, total_cost_usd
  )
  VALUES (
    CURRENT_DATE, current_hour,
    1, CASE WHEN p_success THEN 1 ELSE 0 END, CASE WHEN p_success THEN 0 ELSE 1 END,
    p_processing_time_ms, p_file_size_bytes, p_tokens_used, p_cost_usd
  )
  ON CONFLICT (date, hour) DO UPDATE SET
    total_uploads = cv_processing_metrics.total_uploads + 1,
    successful_processing = cv_processing_metrics.successful_processing + CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_processing = cv_processing_metrics.failed_processing + CASE WHEN p_success THEN 0 ELSE 1 END,
    avg_processing_time_ms = CASE 
      WHEN cv_processing_metrics.total_uploads = 0 THEN p_processing_time_ms
      ELSE ((cv_processing_metrics.avg_processing_time_ms * cv_processing_metrics.total_uploads) + p_processing_time_ms) / (cv_processing_metrics.total_uploads + 1)
    END,
    avg_file_size_bytes = CASE 
      WHEN cv_processing_metrics.total_uploads = 0 THEN p_file_size_bytes
      ELSE ((cv_processing_metrics.avg_file_size_bytes * cv_processing_metrics.total_uploads) + p_file_size_bytes) / (cv_processing_metrics.total_uploads + 1)
    END,
    total_tokens_used = cv_processing_metrics.total_tokens_used + p_tokens_used,
    total_cost_usd = cv_processing_metrics.total_cost_usd + p_cost_usd;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_cv_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_cv_for_processing() TO authenticated;
GRANT EXECUTE ON FUNCTION update_cv_processing_metrics(INTEGER, BIGINT, INTEGER, NUMERIC, BOOLEAN) TO authenticated;

-- Create a trigger to automatically update processing queue timestamps
CREATE OR REPLACE FUNCTION trigger_update_cv_processing_queue_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cv_processing_queue_updated_at
  BEFORE UPDATE ON cv_processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_cv_processing_queue_updated_at();

-- Insert initial data for testing/development
-- This can be removed in production
INSERT INTO cv_processing_metrics (date, hour, total_uploads, successful_processing, failed_processing)
VALUES (CURRENT_DATE, EXTRACT(hour FROM NOW()), 0, 0, 0)
ON CONFLICT (date, hour) DO NOTHING;

COMMENT ON TABLE cv_upload_sessions IS 'Tracks multi-file CV upload sessions with progress and expiration';
COMMENT ON TABLE cv_processing_queue IS 'Background job queue for CV processing with priority and retry logic';
COMMENT ON TABLE cv_file_validations IS 'File validation results and metadata for uploaded CV files';
COMMENT ON TABLE cv_processing_metrics IS 'Hourly aggregated metrics for CV processing performance and cost tracking';