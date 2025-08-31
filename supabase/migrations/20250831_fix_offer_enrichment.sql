-- Migration: Fix offer_enrichment table conflicts
-- Date: 2025-08-31
-- Purpose: Resolve conflicts with existing offer_enrichment table structure

-- Step 1: Backup existing data if any
CREATE TABLE IF NOT EXISTS offer_enrichment_backup AS 
SELECT * FROM offer_enrichment;

-- Step 2: Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS offer_enrichment CASCADE;

-- Step 3: Create offer_enrichment table with proper structure
CREATE TABLE offer_enrichment (
  offer_id UUID PRIMARY KEY,
  
  -- Processing status and metadata
  parse_status TEXT NOT NULL DEFAULT 'todo' 
    CHECK (parse_status IN ('ok', 'todo', 'error')),
  last_parsed_at TIMESTAMPTZ,
  error_msg TEXT,
  last_raw_id UUID,
  
  -- Enrichment status (matches existing schema)
  enrichment_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (enrichment_status IN ('pending', 'processing', 'completed', 'failed', 'low_confidence')),
  processed_at TIMESTAMPTZ,
  
  -- Confidence scoring
  confidence_scores JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Add foreign key constraint to offers table
ALTER TABLE offer_enrichment 
ADD CONSTRAINT offer_enrichment_offer_id_fkey 
FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE;

-- Step 5: Create essential indexes for performance
CREATE INDEX idx_offer_enrichment_offer_id ON offer_enrichment(offer_id);
CREATE INDEX idx_offer_enrichment_parse_status ON offer_enrichment(parse_status);
CREATE INDEX idx_offer_enrichment_enrichment_status ON offer_enrichment(enrichment_status);
CREATE INDEX idx_offer_enrichment_processed_at ON offer_enrichment(processed_at);

-- Step 6: Create GIN index for JSONB confidence_scores
CREATE INDEX idx_offer_enrichment_confidence_scores ON offer_enrichment USING GIN (confidence_scores);

-- Step 7: Enable RLS
ALTER TABLE offer_enrichment ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
-- Policy: Allow service role full access (for API operations)
CREATE POLICY "Service role full access to offer_enrichment" ON offer_enrichment
  FOR ALL USING (current_setting('role') = 'service_role');

-- Policy: Allow authenticated users to read completed enrichments
CREATE POLICY "Authenticated read completed enrichments" ON offer_enrichment
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    enrichment_status = 'completed'
  );

-- Step 9: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_offer_enrichment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger to auto-update updated_at
CREATE TRIGGER trigger_offer_enrichment_updated_at
  BEFORE UPDATE ON offer_enrichment
  FOR EACH ROW
  EXECUTE FUNCTION update_offer_enrichment_updated_at();

-- Step 11: Add constraint to ensure processed_at is set when status is completed
ALTER TABLE offer_enrichment 
ADD CONSTRAINT check_processed_at_when_completed 
CHECK (
  (enrichment_status IN ('completed', 'failed', 'low_confidence') AND processed_at IS NOT NULL) OR
  (enrichment_status IN ('pending', 'processing'))
);

-- Step 12: Restore existing data if any (adapt columns as needed)
INSERT INTO offer_enrichment (
  offer_id, 
  parse_status, 
  last_parsed_at, 
  error_msg, 
  last_raw_id, 
  enrichment_status, 
  processed_at, 
  confidence_scores
)
SELECT 
  offer_id,
  parse_status,
  last_parsed_at,
  error_msg,
  last_raw_id,
  enrichment_status,
  processed_at,
  confidence_scores
FROM offer_enrichment_backup
WHERE offer_id IS NOT NULL
ON CONFLICT (offer_id) DO NOTHING;

-- Step 13: Clean up backup table
DROP TABLE IF EXISTS offer_enrichment_backup;

-- Step 14: Add helpful comments
COMMENT ON TABLE offer_enrichment IS 'AI-powered enrichment tracking for job offers with processing status and confidence scores';
COMMENT ON COLUMN offer_enrichment.parse_status IS 'Status of initial parsing: ok, todo, error';
COMMENT ON COLUMN offer_enrichment.enrichment_status IS 'Status of AI enrichment: pending, processing, completed, failed, low_confidence';
COMMENT ON COLUMN offer_enrichment.confidence_scores IS 'JSONB object with confidence scores for AI extractions';

-- Step 15: Grant permissions
GRANT SELECT ON offer_enrichment TO authenticated;
GRANT ALL ON offer_enrichment TO service_role;