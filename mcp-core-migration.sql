-- MCP-Core Supabase Database Migration
-- Fixes column name mismatch and adds missing tables/functions
-- Date: 2025-10-09
-- Project: mxtsdgkwzjzlttpotole (the-fixer-initiative)

-- ============================================
-- PHASE 1: Fix Critical Column Name Mismatch
-- ============================================

-- Add 'type' column as compatibility layer
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Copy existing data from memory_type to type
UPDATE memory_entries SET type = memory_type::text WHERE type IS NULL;

-- Make it NOT NULL after data migration
ALTER TABLE memory_entries ALTER COLUMN type SET NOT NULL;

-- Add check constraint
ALTER TABLE memory_entries DROP CONSTRAINT IF EXISTS memory_entries_type_check;
ALTER TABLE memory_entries ADD CONSTRAINT memory_entries_type_check 
  CHECK (type IN ('context', 'project', 'knowledge', 'reference', 'personal', 'workflow'));

-- Create trigger to keep both columns in sync
CREATE OR REPLACE FUNCTION sync_memory_type_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Sync from type to memory_type
        IF NEW.type IS NOT NULL THEN
            NEW.memory_type = NEW.type::memory_type;
        END IF;
        -- Sync from memory_type to type
        IF NEW.memory_type IS NOT NULL THEN
            NEW.type = NEW.memory_type::text;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_type_columns ON memory_entries;
CREATE TRIGGER sync_type_columns
    BEFORE INSERT OR UPDATE ON memory_entries
    FOR EACH ROW
    EXECUTE FUNCTION sync_memory_type_columns();

-- ============================================
-- PHASE 2: Create Missing Tables
-- ============================================

-- Sessions table for JWT session management
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Memory search analytics table
CREATE TABLE IF NOT EXISTS memory_search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    search_type VARCHAR(50) DEFAULT 'text',
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory access patterns table
CREATE TABLE IF NOT EXISTS memory_access_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    memory_id UUID REFERENCES memory_entries(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL,
    access_method VARCHAR(50) DEFAULT 'api',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table for analytics
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASE 3: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_memory_search_analytics_user ON memory_search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_search_analytics_created ON memory_search_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_memory_access_patterns_user ON memory_access_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_access_patterns_memory ON memory_access_patterns(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_access_patterns_created ON memory_access_patterns(created_at);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_action ON usage_tracking(action);

CREATE INDEX IF NOT EXISTS idx_memory_entries_type ON memory_entries(type);

-- ============================================
-- PHASE 4: Create Missing Functions
-- ============================================

-- Function: match_memories (Vector similarity search)
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.8,
    match_count INTEGER DEFAULT 10,
    filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title VARCHAR(500),
    content TEXT,
    type VARCHAR(50),
    tags TEXT[],
    metadata JSONB,
    similarity FLOAT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        me.id,
        me.title,
        me.content,
        me.type,
        me.tags,
        me.metadata,
        1 - (me.embedding <=> query_embedding) as similarity,
        me.created_at,
        me.updated_at
    FROM memory_entries me
    WHERE
        (filter_user_id IS NULL OR me.user_id = filter_user_id)
        AND me.embedding IS NOT NULL
        AND 1 - (me.embedding <=> query_embedding) > match_threshold
    ORDER BY me.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function: get_memory_stats (Statistics aggregation)
CREATE OR REPLACE FUNCTION get_memory_stats(filter_user_id UUID DEFAULT NULL)
RETURNS TABLE(
    total_memories BIGINT,
    by_type JSONB,
    recent_activity JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_memories,
        jsonb_object_agg(type, count) as by_type,
        jsonb_build_object(
            'created_today', (
                SELECT COUNT(*)
                FROM memory_entries
                WHERE (filter_user_id IS NULL OR user_id = filter_user_id)
                AND created_at >= CURRENT_DATE
            ),
            'updated_today', (
                SELECT COUNT(*)
                FROM memory_entries
                WHERE (filter_user_id IS NULL OR user_id = filter_user_id)
                AND updated_at >= CURRENT_DATE
                AND created_at < CURRENT_DATE
            )
        ) as recent_activity
    FROM (
        SELECT type, COUNT(*) as count
        FROM memory_entries
        WHERE filter_user_id IS NULL OR user_id = filter_user_id
        GROUP BY type
    ) type_counts;
END;
$$ LANGUAGE plpgsql;

-- Function: text_search_memories (Full-text search)
CREATE OR REPLACE FUNCTION text_search_memories(
    search_query TEXT,
    filter_user_id UUID DEFAULT NULL,
    filter_type VARCHAR(50) DEFAULT NULL,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    title VARCHAR(500),
    content TEXT,
    type VARCHAR(50),
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        me.id,
        me.title,
        me.content,
        me.type,
        me.tags,
        me.created_at,
        me.updated_at,
        ROW_NUMBER() OVER (ORDER BY
            ts_rank_cd(to_tsvector('english', me.title || ' ' || me.content), plainto_tsquery('english', search_query)) DESC,
            me.updated_at DESC
        )::INTEGER as rank
    FROM memory_entries me
    WHERE
        (filter_user_id IS NULL OR me.user_id = filter_user_id)
        AND (filter_type IS NULL OR me.type = filter_type)
        AND (
            to_tsvector('english', me.title || ' ' || me.content) @@ plainto_tsquery('english', search_query)
            OR me.title ILIKE '%' || search_query || '%'
            OR me.content ILIKE '%' || search_query || '%'
        )
    ORDER BY
        ts_rank_cd(to_tsvector('english', me.title || ' ' || me.content), plainto_tsquery('english', search_query)) DESC,
        me.updated_at DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function: track_memory_access (Access pattern tracking)
CREATE OR REPLACE FUNCTION track_memory_access(
    p_memory_id UUID,
    p_user_id UUID,
    p_access_type VARCHAR(50),
    p_access_method VARCHAR(50) DEFAULT 'api'
)
RETURNS void AS $$
BEGIN
    INSERT INTO memory_access_patterns (user_id, memory_id, access_type, access_method)
    VALUES (p_user_id, p_memory_id, p_access_type, p_access_method);
END;
$$ LANGUAGE plpgsql;

-- Function: track_search_analytics (Search analytics tracking)
CREATE OR REPLACE FUNCTION track_search_analytics(
    p_user_id UUID,
    p_query TEXT,
    p_results_count INTEGER,
    p_search_type VARCHAR(50),
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO memory_search_analytics (user_id, query, results_count, search_type, execution_time_ms)
    VALUES (p_user_id, p_query, p_results_count, p_search_type, p_execution_time_ms);
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 5: Enable RLS and Create Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_access_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions (users can only access their own sessions)
DROP POLICY IF EXISTS sessions_self_access ON sessions;
CREATE POLICY sessions_self_access ON sessions
    FOR ALL USING (
        auth.uid()::text = user_id::text OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- RLS Policies for memory_search_analytics
DROP POLICY IF EXISTS memory_search_analytics_self_access ON memory_search_analytics;
CREATE POLICY memory_search_analytics_self_access ON memory_search_analytics
    FOR ALL USING (
        auth.uid()::text = user_id::text OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- RLS Policies for memory_access_patterns
DROP POLICY IF EXISTS memory_access_patterns_self_access ON memory_access_patterns;
CREATE POLICY memory_access_patterns_self_access ON memory_access_patterns
    FOR ALL USING (
        auth.uid()::text = user_id::text OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- RLS Policies for usage_tracking
DROP POLICY IF EXISTS usage_tracking_self_access ON usage_tracking;
CREATE POLICY usage_tracking_self_access ON usage_tracking
    FOR ALL USING (
        (user_id IS NULL) OR
        auth.uid()::text = user_id::text OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- ============================================
-- PHASE 6: Create Full-Text Search Index
-- ============================================

CREATE INDEX IF NOT EXISTS idx_memory_entries_fts ON memory_entries
USING GIN (to_tsvector('english', title || ' ' || content));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables exist
DO $$
BEGIN
    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE 'Tables created/verified:';
    RAISE NOTICE '  - memory_entries (with type column)';
    RAISE NOTICE '  - sessions';
    RAISE NOTICE '  - memory_search_analytics';
    RAISE NOTICE '  - memory_access_patterns';
    RAISE NOTICE '  - usage_tracking';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - match_memories()';
    RAISE NOTICE '  - get_memory_stats()';
    RAISE NOTICE '  - text_search_memories()';
    RAISE NOTICE '  - track_memory_access()';
    RAISE NOTICE '  - track_search_analytics()';
    RAISE NOTICE '';
    RAISE NOTICE 'Indexes created for performance optimization';
    RAISE NOTICE 'RLS policies enabled for security';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready for mcp-core to use!';
END $$;

