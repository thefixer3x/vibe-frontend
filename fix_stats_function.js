#!/usr/bin/env node
const { Client } = require('pg');

const connectionString = process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL;

const sql = `
CREATE OR REPLACE FUNCTION get_memory_stats(org_id varchar DEFAULT 'org_default')
RETURNS TABLE(
    total_memories bigint,
    memories_by_type jsonb,
    recent_activity bigint,
    avg_relevance_score real,
    top_tags jsonb
) AS $$
DECLARE
    v_total bigint;
    v_by_type jsonb;
    v_recent bigint;
    v_avg_score real;
    v_tags jsonb;
BEGIN
    -- Get total memories
    SELECT COUNT(*) INTO v_total
    FROM memory_entries
    WHERE organization_id = org_id AND is_active = true;
    
    -- Get memories by type
    SELECT jsonb_object_agg(type, type_count) INTO v_by_type
    FROM (
        SELECT type, COUNT(*) as type_count
        FROM memory_entries
        WHERE organization_id = org_id AND is_active = true
        GROUP BY type
    ) type_stats;
    
    -- Get recent activity (last 7 days)
    SELECT COUNT(*) INTO v_recent
    FROM memory_entries
    WHERE organization_id = org_id 
        AND is_active = true 
        AND created_at > now() - interval '7 days';
    
    -- Get average relevance score
    SELECT AVG(relevance_score) INTO v_avg_score
    FROM memory_entries
    WHERE organization_id = org_id AND is_active = true;
    
    -- Get top tags
    SELECT jsonb_agg(tag_data) INTO v_tags
    FROM (
        SELECT jsonb_build_object('tag', tag, 'count', COUNT(*)) as tag_data
        FROM memory_entries, jsonb_array_elements_text(tags) as tag
        WHERE organization_id = org_id AND is_active = true
        GROUP BY tag
        ORDER BY COUNT(*) DESC
        LIMIT 10
    ) tag_stats;
    
    -- Return all values
    RETURN QUERY SELECT v_total, v_by_type, v_recent, v_avg_score, v_tags;
END;
$$ LANGUAGE plpgsql;
`;

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    await client.query(sql);
    console.log('✅ Function updated successfully');
    
    // Test the function
    const result = await client.query("SELECT * FROM get_memory_stats('org_default')");
    console.log('✅ Function test result:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

