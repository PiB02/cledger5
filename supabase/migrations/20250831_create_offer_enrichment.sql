-- Migration: Create offer_enrichment table for AI-powered offer analysis
-- Date: 2025-08-31
-- Purpose: Store GPT-4o-mini extracted skills, seniority, languages, and degrees

-- Create offer_enrichment table
CREATE TABLE IF NOT EXISTS offer_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL,
  
  -- Processing status and metadata
  enrichment_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (enrichment_status IN ('pending', 'processing', 'completed', 'failed', 'low_confidence')),
  enrichment_version TEXT NOT NULL DEFAULT '1.0',
  model_used TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  
  -- Core AI extractions (stored as JSONB for flexibility)
  skills_required JSONB DEFAULT '[]'::jsonb,
  skills_preferred JSONB DEFAULT '[]'::jsonb, 
  seniority_level TEXT CHECK (seniority_level IN ('intern', 'junior', 'mid', 'senior', 'lead', 'manager')),
  languages_detected JSONB DEFAULT '[]'::jsonb,
  degree_requirements JSONB DEFAULT '[]'::jsonb,
  
  -- Confidence scoring (≥0.80 required for validation)
  confidence_scores JSONB, -- {skills: 0.85, seniority: 0.90, languages: 0.75, degrees: 0.80, global: 0.825}
  
  -- Additional context and metadata  
  rome_codes_suggested TEXT[] DEFAULT ARRAY[]::TEXT[],
  job_category_detected TEXT,
  company_size_indicators TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Processing info and error handling
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to offers table
ALTER TABLE offer_enrichment 
ADD CONSTRAINT fk_offer_enrichment_offer_id 
FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offer_enrichment_offer_id ON offer_enrichment(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_enrichment_status ON offer_enrichment(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_offer_enrichment_processed_at ON offer_enrichment(processed_at);
CREATE INDEX IF NOT EXISTS idx_offer_enrichment_confidence ON offer_enrichment USING GIN (confidence_scores);

-- Create partial index for completed enrichments with high confidence
CREATE INDEX IF NOT EXISTS idx_offer_enrichment_high_confidence 
ON offer_enrichment(offer_id, processed_at) 
WHERE enrichment_status = 'completed' 
AND (confidence_scores->>'global')::DECIMAL >= 0.80;

-- Create GIN indexes for JSONB fields to enable efficient querying
CREATE INDEX IF NOT EXISTS idx_offer_enrichment_skills_required ON offer_enrichment USING GIN (skills_required);
CREATE INDEX IF NOT EXISTS idx_offer_enrichment_skills_preferred ON offer_enrichment USING GIN (skills_preferred);
CREATE INDEX IF NOT EXISTS idx_offer_enrichment_languages ON offer_enrichment USING GIN (languages_detected);
CREATE INDEX IF NOT EXISTS idx_offer_enrichment_degrees ON offer_enrichment USING GIN (degree_requirements);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_offer_enrichment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_offer_enrichment_updated_at ON offer_enrichment;
CREATE TRIGGER trigger_offer_enrichment_updated_at
  BEFORE UPDATE ON offer_enrichment
  FOR EACH ROW
  EXECUTE FUNCTION update_offer_enrichment_updated_at();

-- Add constraint to ensure processed_at is set when status is completed
ALTER TABLE offer_enrichment 
ADD CONSTRAINT check_processed_at_when_completed 
CHECK (
  (enrichment_status IN ('completed', 'failed', 'low_confidence') AND processed_at IS NOT NULL) OR
  (enrichment_status IN ('pending', 'processing') AND processed_at IS NULL)
);

-- Add constraint to ensure confidence_scores is present for completed enrichments
ALTER TABLE offer_enrichment
ADD CONSTRAINT check_confidence_scores_when_completed
CHECK (
  (enrichment_status = 'completed' AND confidence_scores IS NOT NULL) OR
  (enrichment_status != 'completed')
);

-- RLS (Row Level Security) policies
ALTER TABLE offer_enrichment ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admin full access
CREATE POLICY "Admin full access to offer_enrichment" ON offer_enrichment
  FOR ALL USING (
    current_setting('role') = 'admin' OR
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  );

-- Policy: Allow service role full access (for API operations)
CREATE POLICY "Service role full access to offer_enrichment" ON offer_enrichment
  FOR ALL USING (current_setting('role') = 'service_role');

-- Policy: Allow authenticated users to read completed enrichments
CREATE POLICY "Authenticated read completed enrichments" ON offer_enrichment
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    enrichment_status = 'completed' AND
    (confidence_scores->>'global')::DECIMAL >= 0.80
  );

-- Create view for easy querying of successful enrichments
CREATE OR REPLACE VIEW offer_enrichment_successful AS
SELECT 
  oe.*,
  o.title,
  o.description,
  o.rome_codes,
  (oe.confidence_scores->>'global')::DECIMAL AS global_confidence
FROM offer_enrichment oe
JOIN offers o ON oe.offer_id = o.id
WHERE oe.enrichment_status = 'completed'
  AND (oe.confidence_scores->>'global')::DECIMAL >= 0.80
ORDER BY oe.processed_at DESC;

-- Grant permissions on the view
GRANT SELECT ON offer_enrichment_successful TO authenticated;
GRANT ALL ON offer_enrichment_successful TO service_role;

-- Add helpful comments
COMMENT ON TABLE offer_enrichment IS 'AI-powered enrichment of job offers using GPT-4o-mini for skills, seniority, languages, and degree extraction';
COMMENT ON COLUMN offer_enrichment.confidence_scores IS 'JSONB object with confidence scores for each extraction type and global score';
COMMENT ON COLUMN offer_enrichment.skills_required IS 'JSONB array of required skills with confidence scores and categories';
COMMENT ON COLUMN offer_enrichment.skills_preferred IS 'JSONB array of preferred skills with confidence scores and categories';
COMMENT ON COLUMN offer_enrichment.languages_detected IS 'JSONB array of detected languages with CEFR levels and confidence';
COMMENT ON COLUMN offer_enrichment.degree_requirements IS 'JSONB array of degree requirements with EQF levels and confidence';

-- Create helper function to check if offer needs enrichment
CREATE OR REPLACE FUNCTION offer_needs_enrichment(p_offer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if offer has recent successful enrichment
  RETURN NOT EXISTS (
    SELECT 1 FROM offer_enrichment 
    WHERE offer_id = p_offer_id 
    AND enrichment_status = 'completed'
    AND (confidence_scores->>'global')::DECIMAL >= 0.80
    AND processed_at > NOW() - INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION offer_needs_enrichment(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION offer_needs_enrichment(UUID) TO authenticated;