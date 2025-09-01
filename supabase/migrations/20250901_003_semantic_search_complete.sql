-- Phase 8: Complete Semantic Search Implementation
-- Migration: 20250901_003_semantic_search_complete

-- Create offer_embeddings table if not exists
CREATE TABLE IF NOT EXISTS offer_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL DEFAULT 'semantic',
    model VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-small',
    dim INTEGER NOT NULL DEFAULT 1536,
    embedding VECTOR(1536),
    text_used_hash BYTEA,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique embeddings per offer and kind
    UNIQUE(offer_id, kind)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_offer_embeddings_offer_id ON offer_embeddings(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_embeddings_kind ON offer_embeddings(kind);
CREATE INDEX IF NOT EXISTS idx_offer_embeddings_created_at ON offer_embeddings(created_at DESC);

-- Create HNSW index for vector similarity search (optimized for production)
CREATE INDEX IF NOT EXISTS idx_offer_embeddings_vector_hnsw 
ON offer_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 128);

-- Create PostgreSQL function for semantic matching
CREATE OR REPLACE FUNCTION match_offers_semantic(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 50
)
RETURNS TABLE (
    offer_id uuid,
    similarity float
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        oe.offer_id,
        1 - (oe.embedding <=> query_embedding) as similarity
    FROM offer_embeddings oe
    WHERE 
        oe.kind = 'semantic' 
        AND oe.embedding IS NOT NULL
        AND 1 - (oe.embedding <=> query_embedding) > match_threshold
    ORDER BY oe.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Create log table for re-embedding activities
CREATE TABLE IF NOT EXISTS offer_embeddings_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'needs_reembedding', 'reembedding_completed', etc.
    reason VARCHAR(100) NOT NULL, -- 'enrichment_updated', 'offer_updated', 'manual_trigger'
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_offer_embeddings_log_offer_id ON offer_embeddings_log(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_embeddings_log_triggered_at ON offer_embeddings_log(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_embeddings_log_action ON offer_embeddings_log(action);

-- Create view for re-embedding activity monitoring
CREATE OR REPLACE VIEW v_reembedding_activity AS
SELECT 
    l.offer_id,
    o.title,
    l.action,
    l.reason,
    l.triggered_at,
    l.processed_at,
    CASE 
        WHEN oe.embedding IS NOT NULL THEN 'has_embedding'
        ELSE 'needs_embedding'
    END as current_status,
    l.metadata
FROM offer_embeddings_log l
JOIN offers o ON l.offer_id = o.id
LEFT JOIN offer_embeddings oe ON l.offer_id = oe.offer_id AND oe.kind = 'semantic'
ORDER BY l.triggered_at DESC;

-- Create trigger function for automatic re-embedding
CREATE OR REPLACE FUNCTION trigger_offer_reembedding()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the re-embedding need based on trigger source
    INSERT INTO offer_embeddings_log (offer_id, action, reason, metadata)
    VALUES (
        CASE 
            WHEN TG_TABLE_NAME = 'offers' THEN NEW.id
            WHEN TG_TABLE_NAME = 'offer_enrichment' THEN NEW.offer_id
            ELSE NULL
        END,
        'needs_reembedding',
        CASE 
            WHEN TG_TABLE_NAME = 'offers' THEN 'offer_updated'
            WHEN TG_TABLE_NAME = 'offer_enrichment' THEN 'enrichment_updated'
            ELSE 'unknown_trigger'
        END,
        jsonb_build_object(
            'trigger_table', TG_TABLE_NAME,
            'trigger_operation', TG_OP,
            'timestamp', NOW()
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic re-embedding
DROP TRIGGER IF EXISTS trigger_offers_reembedding ON offers;
CREATE TRIGGER trigger_offers_reembedding
    AFTER UPDATE OF title, rome_codes, salary_min, salary_max, contract_type_code, work_mode_code
    ON offers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_offer_reembedding();

DROP TRIGGER IF EXISTS trigger_enrichment_reembedding ON offer_enrichment;
CREATE TRIGGER trigger_enrichment_reembedding
    AFTER UPDATE OF skills_required, skills_preferred, seniority_level, languages_detected, degree_requirements
    ON offer_enrichment
    FOR EACH ROW
    EXECUTE FUNCTION trigger_offer_reembedding();

-- Add helpful comments
COMMENT ON TABLE offer_embeddings IS 'Vector embeddings for offers using OpenAI text-embedding-3-small (1536d)';
COMMENT ON TABLE offer_embeddings_log IS 'Activity log for re-embedding triggers and processing';
COMMENT ON FUNCTION match_offers_semantic IS 'Semantic similarity search using HNSW index with cosine distance';
COMMENT ON VIEW v_reembedding_activity IS 'Monitoring view for re-embedding activities and status';

-- Create function to get embedding statistics
CREATE OR REPLACE FUNCTION get_embedding_stats()
RETURNS TABLE (
    total_offers bigint,
    offers_with_embeddings bigint,
    completion_rate numeric,
    average_similarity_searches_per_day numeric,
    last_embedding_created timestamptz
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        (SELECT COUNT(*) FROM offers WHERE status = 'active') as total_offers,
        (SELECT COUNT(*) FROM offer_embeddings WHERE kind = 'semantic' AND embedding IS NOT NULL) as offers_with_embeddings,
        ROUND(
            (SELECT COUNT(*) FROM offer_embeddings WHERE kind = 'semantic' AND embedding IS NOT NULL)::numeric / 
            NULLIF((SELECT COUNT(*) FROM offers WHERE status = 'active')::numeric, 0) * 100, 2
        ) as completion_rate,
        0::numeric as average_similarity_searches_per_day, -- Would need query logs for actual calculation
        (SELECT MAX(created_at) FROM offer_embeddings WHERE kind = 'semantic') as last_embedding_created;
$$;

-- Grant necessary permissions
GRANT SELECT ON offer_embeddings TO anon, authenticated;
GRANT SELECT ON offer_embeddings_log TO anon, authenticated;
GRANT SELECT ON v_reembedding_activity TO anon, authenticated;

-- Final validation
DO $$
BEGIN
    -- Verify vector extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector extension not found. Please install it first.';
    END IF;
    
    -- Verify HNSW index was created
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_offer_embeddings_vector_hnsw'
    ) THEN
        RAISE WARNING 'HNSW index was not created successfully';
    END IF;
    
    RAISE NOTICE 'Phase 8 Semantic Search implementation completed successfully!';
END $$;