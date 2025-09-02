-- Phase 10 - CV Processing Extensions Migration
-- Created: 2025-09-01
-- Description: Extends existing CV tables with processing infrastructure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Upload sessions tracking
CREATE TABLE IF NOT EXISTS cv_upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_hash VARCHAR(64) NOT NULL, -- SHA256 for deduplication
  upload_status VARCHAR(20) NOT NULL DEFAULT 'initiated' CHECK (upload_status IN ('initiated', 'uploading', 'uploaded', 'processing', 'completed', 'failed')),
  storage_path TEXT, -- Supabase storage path
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Processing queue with priority and retry logic
CREATE TABLE IF NOT EXISTS cv_processing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_session_id UUID NOT NULL REFERENCES cv_upload_sessions(id) ON DELETE CASCADE,
  queue_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (queue_status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
  priority INTEGER NOT NULL DEFAULT 5, -- 1=highest, 10=lowest
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  worker_id VARCHAR(100),
  error_message TEXT,
  stage_details JSONB DEFAULT '{}', -- Current processing stage info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CV validation results
CREATE TABLE IF NOT EXISTS cv_validation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_session_id UUID NOT NULL REFERENCES cv_upload_sessions(id) ON DELETE CASCADE,
  validation_type VARCHAR(50) NOT NULL, -- 'format', 'content', 'security', 'quality'
  validation_status VARCHAR(20) NOT NULL CHECK (validation_status IN ('passed', 'failed', 'warning')),
  validation_score DECIMAL(3,2), -- 0.00 to 1.00
  validation_details JSONB DEFAULT '{}',
  validation_errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CV processing metrics
CREATE TABLE IF NOT EXISTS cv_processing_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_session_id UUID NOT NULL REFERENCES cv_upload_sessions(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- 'processing_time', 'api_cost', 'extraction_accuracy', 'tokens_used'
  metric_value DECIMAL(10,4) NOT NULL,
  metric_unit VARCHAR(20), -- 'seconds', 'dollars', 'percentage', 'tokens'
  processing_stage VARCHAR(50), -- 'text_extraction', 'ai_parsing', 'embedding_generation', 'total'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extend existing cv_profiles table if needed (add processing reference)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cv_profiles' AND column_name = 'upload_session_id') THEN
        ALTER TABLE cv_profiles 
        ADD COLUMN upload_session_id UUID REFERENCES cv_upload_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Extend existing cv_documents table if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cv_documents' AND column_name = 'processing_status') THEN
        ALTER TABLE cv_documents 
        ADD COLUMN processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cv_documents' AND column_name = 'ai_confidence_score') THEN
        ALTER TABLE cv_documents 
        ADD COLUMN ai_confidence_score DECIMAL(3,2) DEFAULT NULL; -- Global AI confidence (0.00 to 1.00)
    END IF;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_cv_upload_sessions_user_id ON cv_upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_upload_sessions_status ON cv_upload_sessions(upload_status);
CREATE INDEX IF NOT EXISTS idx_cv_upload_sessions_created_at ON cv_upload_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_cv_processing_queue_status ON cv_processing_queue(queue_status);
CREATE INDEX IF NOT EXISTS idx_cv_processing_queue_priority ON cv_processing_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_cv_processing_queue_session_id ON cv_processing_queue(upload_session_id);

CREATE INDEX IF NOT EXISTS idx_cv_validation_results_session_id ON cv_validation_results(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_cv_validation_results_type_status ON cv_validation_results(validation_type, validation_status);

CREATE INDEX IF NOT EXISTS idx_cv_processing_metrics_session_id ON cv_processing_metrics(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_cv_processing_metrics_type ON cv_processing_metrics(metric_type, created_at);

-- RLS Policies

-- cv_upload_sessions - users can only access their own sessions
ALTER TABLE cv_upload_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own upload sessions" ON cv_upload_sessions;
CREATE POLICY "Users can view own upload sessions" 
ON cv_upload_sessions FOR SELECT 
USING (user_id = (SELECT clerk_id FROM users WHERE id = auth_user_id()));

DROP POLICY IF EXISTS "Users can create own upload sessions" ON cv_upload_sessions;
CREATE POLICY "Users can create own upload sessions" 
ON cv_upload_sessions FOR INSERT 
WITH CHECK (user_id = (SELECT clerk_id FROM users WHERE id = auth_user_id()));

DROP POLICY IF EXISTS "Users can update own upload sessions" ON cv_upload_sessions;
CREATE POLICY "Users can update own upload sessions" 
ON cv_upload_sessions FOR UPDATE 
USING (user_id = (SELECT clerk_id FROM users WHERE id = auth_user_id()));

-- Admin access to all upload sessions
DROP POLICY IF EXISTS "Admins can access all upload sessions" ON cv_upload_sessions;
CREATE POLICY "Admins can access all upload sessions" 
ON cv_upload_sessions FOR ALL 
USING ((SELECT role FROM users WHERE id = auth_user_id()) = 'admin');

-- cv_processing_queue - only service/admin access
ALTER TABLE cv_processing_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service can access processing queue" ON cv_processing_queue;
CREATE POLICY "Service can access processing queue" 
ON cv_processing_queue FOR ALL 
USING ((SELECT role FROM users WHERE id = auth_user_id()) IN ('admin', 'service'));

-- cv_validation_results - users can view their own results
ALTER TABLE cv_validation_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own validation results" ON cv_validation_results;
CREATE POLICY "Users can view own validation results" 
ON cv_validation_results FOR SELECT 
USING (upload_session_id IN (
    SELECT id FROM cv_upload_sessions 
    WHERE user_id = (SELECT clerk_id FROM users WHERE id = auth_user_id())
));

DROP POLICY IF EXISTS "Admins can access all validation results" ON cv_validation_results;
CREATE POLICY "Admins can access all validation results" 
ON cv_validation_results FOR ALL 
USING ((SELECT role FROM users WHERE id = auth_user_id()) = 'admin');

-- cv_processing_metrics - admin/service access for monitoring
ALTER TABLE cv_processing_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service can access processing metrics" ON cv_processing_metrics;
CREATE POLICY "Service can access processing metrics" 
ON cv_processing_metrics FOR ALL 
USING ((SELECT role FROM users WHERE id = auth_user_id()) IN ('admin', 'service'));

-- Updated triggers for updated_at
DROP TRIGGER IF EXISTS update_cv_upload_sessions_updated_at ON cv_upload_sessions;
CREATE TRIGGER update_cv_upload_sessions_updated_at 
    BEFORE UPDATE ON cv_upload_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cv_processing_queue_updated_at ON cv_processing_queue;
CREATE TRIGGER update_cv_processing_queue_updated_at 
    BEFORE UPDATE ON cv_processing_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper functions for processing
CREATE OR REPLACE FUNCTION get_next_cv_processing_job()
RETURNS TABLE (
    queue_id UUID,
    session_id UUID,
    filename VARCHAR(500),
    storage_path TEXT,
    retry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    UPDATE cv_processing_queue 
    SET 
        queue_status = 'processing',
        processing_started_at = CURRENT_TIMESTAMP,
        worker_id = 'system-worker-' || extract(epoch from now())::text
    WHERE id = (
        SELECT q.id 
        FROM cv_processing_queue q
        JOIN cv_upload_sessions s ON q.upload_session_id = s.id
        WHERE q.queue_status = 'pending' 
           OR (q.queue_status = 'retry' AND q.retry_count < q.max_retries)
        ORDER BY q.priority ASC, q.created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING q.id, q.upload_session_id, s.filename, s.storage_path, q.retry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record processing completion
CREATE OR REPLACE FUNCTION complete_cv_processing_job(
    p_queue_id UUID,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    IF p_success THEN
        UPDATE cv_processing_queue 
        SET 
            queue_status = 'completed',
            processing_completed_at = CURRENT_TIMESTAMP,
            error_message = NULL
        WHERE id = p_queue_id;
        
        -- Also update the upload session
        UPDATE cv_upload_sessions 
        SET 
            upload_status = 'completed',
            processing_completed_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT upload_session_id FROM cv_processing_queue WHERE id = p_queue_id);
    ELSE
        UPDATE cv_processing_queue 
        SET 
            queue_status = CASE 
                WHEN retry_count + 1 >= max_retries THEN 'failed'
                ELSE 'retry'
            END,
            retry_count = retry_count + 1,
            error_message = p_error_message,
            processing_completed_at = CASE 
                WHEN retry_count + 1 >= max_retries THEN CURRENT_TIMESTAMP
                ELSE NULL
            END
        WHERE id = p_queue_id;
        
        -- Update upload session if max retries reached
        UPDATE cv_upload_sessions 
        SET 
            upload_status = 'failed',
            error_message = p_error_message,
            processing_completed_at = CURRENT_TIMESTAMP
        WHERE id = (
            SELECT upload_session_id 
            FROM cv_processing_queue 
            WHERE id = p_queue_id AND retry_count >= max_retries
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE cv_upload_sessions IS 'Tracks CV file upload sessions with processing state';
COMMENT ON TABLE cv_processing_queue IS 'Queue for CV processing jobs with priority and retry logic';
COMMENT ON TABLE cv_validation_results IS 'Results from CV validation (format, content, security, quality)';
COMMENT ON TABLE cv_processing_metrics IS 'Performance metrics for CV processing operations';

COMMENT ON FUNCTION get_next_cv_processing_job() IS 'Atomically gets next CV processing job from queue';
COMMENT ON FUNCTION complete_cv_processing_job(UUID, BOOLEAN, TEXT) IS 'Marks CV processing job as completed or failed with retry logic';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON cv_upload_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cv_processing_queue TO service_role;
GRANT SELECT, INSERT ON cv_validation_results TO authenticated;
GRANT SELECT, INSERT ON cv_processing_metrics TO service_role;

GRANT EXECUTE ON FUNCTION get_next_cv_processing_job() TO service_role;
GRANT EXECUTE ON FUNCTION complete_cv_processing_job(UUID, BOOLEAN, TEXT) TO service_role;