# MCP-Core Supabase Database Audit Report
**Date**: October 9, 2025  
**Project ID**: `mxtsdgkwzjzlttpotole`  
**Project Name**: `the-fixer-initiative`  
**Region**: eu-west-2  
**Status**: ACTIVE_HEALTHY  
**Database Version**: PostgreSQL 17.6.1.009  

---

## 🔴 CRITICAL ISSUE FOUND

### Column Name Mismatch in `memory_entries` table

**Error in PM2 logs**:
```
❌ Supabase insertion error: {
  code: 'PGRST204',
  message: "Could not find the 'type' column of 'memory_entries' in the schema cache"
}
```

**Root Cause**:
- **mcp-core expects**: Column named `type` (VARCHAR(50))
- **Supabase database has**: Column named `memory_type` (enum: context, project, knowledge, reference, personal, workflow)

**Impact**: ❌ **Memory creation is completely broken** - mcp-core cannot create new memories

**Priority**: 🔴 **CRITICAL** - Blocks core functionality

---

## Database Setup Status

### ✅ Verified Components

#### Extensions
| Extension | Version | Status |
|-----------|---------|--------|
| uuid-ossp | 1.1 | ✅ Installed |
| vector | 0.8.0 | ✅ Installed |

#### Core Tables
| Table | Status | Schema Match | Notes |
|-------|--------|--------------|-------|
| memory_entries | ✅ EXISTS | ⚠️ PARTIAL | Column name mismatch: `type` vs `memory_type` |
| users | ✅ EXISTS | ⚠️ PARTIAL | Has additional fields (role, plan, settings) |
| api_keys | ✅ EXISTS | ⚠️ PARTIAL | Schema differs slightly |

### ❌ Missing Components

#### Missing Tables (Required by mcp-core)
1. **sessions** - JWT session management table
2. **memory_search_analytics** - Search tracking and analytics
3. **memory_access_patterns** - Memory access tracking
4. **usage_tracking** - API usage analytics

#### Missing Functions (Required for functionality)
1. **match_memories** - Vector similarity search function
2. **get_memory_stats** - Memory statistics aggregation
3. **text_search_memories** - Full-text search function
4. **track_memory_access** - Access pattern tracking
5. **track_search_analytics** - Search analytics tracking

---

## Schema Comparison

### memory_entries Table

#### mcp-core Expected Schema:
```sql
CREATE TABLE memory_entries (
    id UUID PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,  -- ⚠️ COLUMN NAME ISSUE
    tags TEXT[],
    metadata JSONB,
    embedding VECTOR(1536),
    topic_id VARCHAR(255),      -- ⚠️ Type mismatch: VARCHAR vs UUID
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### Current Supabase Schema:
```sql
-- Key differences:
- Column 'memory_type' (enum) instead of 'type' (VARCHAR)
- topic_id is UUID instead of VARCHAR(255)
- organization_id UUID (not in mcp-core schema)
- Has additional fields: last_accessed, access_count
```

---

## Recommendations

### 🔴 IMMEDIATE ACTION REQUIRED

#### Option 1: Rename Column (Recommended for backward compatibility)
```sql
-- Add 'type' column as alias to 'memory_type'
ALTER TABLE memory_entries ADD COLUMN type VARCHAR(50);

-- Copy existing data
UPDATE memory_entries SET type = memory_type::text;

-- Make it NOT NULL after data migration
ALTER TABLE memory_entries ALTER COLUMN type SET NOT NULL;

-- Add check constraint
ALTER TABLE memory_entries ADD CONSTRAINT type_check 
  CHECK (type IN ('context', 'project', 'knowledge', 'reference', 'personal', 'workflow'));

-- Create trigger to sync both columns
CREATE OR REPLACE FUNCTION sync_memory_type_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        NEW.memory_type = NEW.type::memory_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_type_columns
    BEFORE INSERT OR UPDATE ON memory_entries
    FOR EACH ROW
    EXECUTE FUNCTION sync_memory_type_columns();
```

#### Option 2: Update mcp-core Code
Update `/opt/mcp-servers/mcp-core/src/tools/memory-tool.ts` to use `memory_type` instead of `type`

### 🟡 HIGH PRIORITY - Add Missing Tables

Execute the following SQL scripts from mcp-core:
```bash
# Location: /opt/mcp-servers/mcp-core/src/db/
- auth-schema.sql (for sessions table)
- memory-schema.sql (for analytics tables)
```

### 🟡 HIGH PRIORITY - Add Missing Functions

Required functions from `/opt/mcp-servers/mcp-core/src/db/memory-schema.sql`:
1. `match_memories()` - Vector search
2. `get_memory_stats()` - Statistics
3. `text_search_memories()` - Text search
4. `track_memory_access()` - Access tracking
5. `track_search_analytics()` - Search tracking

---

## Environment Configuration

### ✅ Supabase Credentials Configured
```bash
ONASIS_SUPABASE_URL=https://mxtsdgkwzjzlttpotole.supabase.co
ONASIS_SUPABASE_ANON_KEY=eyJh... (configured)
ONASIS_SUPABASE_SERVICE_KEY=eyJh... (configured)
```

---

## PM2 Status

```
ID: 3
Name: mcp-core
Status: online
Restarts: 13
Memory: 85.4mb
Script Path: /opt/mcp-servers/mcp-core/dist/index.js
Working Directory: /opt/mcp-servers/mcp-core
```

### Recent Errors in Logs:
1. ❌ Column 'type' not found - **BLOCKING MEMORY CREATION**
2. ⚠️  Database connection closing errors (minor)
3. ✅ API authentication working correctly
4. ✅ Health checks passing

---

## Migration Plan

### Phase 1: Fix Critical Issue (IMMEDIATE)
```sql
-- Run this SQL in Supabase SQL Editor
ALTER TABLE memory_entries ADD COLUMN type VARCHAR(50);
UPDATE memory_entries SET type = memory_type::text WHERE type IS NULL;
ALTER TABLE memory_entries ALTER COLUMN type SET NOT NULL;
```

### Phase 2: Add Missing Tables (HIGH PRIORITY)
```bash
cd /opt/mcp-servers/mcp-core
npm run migrate:schema
```

### Phase 3: Add Missing Functions (HIGH PRIORITY)
Apply SQL from `/opt/mcp-servers/mcp-core/src/db/memory-schema.sql`

### Phase 4: Test & Verify
```bash
# Test memory creation
curl -X POST http://localhost:3001/api/v1/tools/create_memory \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Memory",
    "content": "Testing after fix",
    "type": "knowledge"
  }'
```

---

## Next Steps

1. ✅ **AUDIT COMPLETE** - Issues identified
2. 🔴 **FIX CRITICAL** - Add `type` column or update mcp-core code
3. 🟡 **ADD TABLES** - Create missing tables (sessions, analytics)
4. 🟡 **ADD FUNCTIONS** - Create missing database functions
5. ✅ **TEST** - Verify all functionality after fixes
6. 📝 **DOCUMENT** - Update deployment documentation

---

## Summary

**Status**: ⚠️ **PARTIALLY FUNCTIONAL** - Core tables exist but critical column mismatch

**Blocking Issues**: 1 critical (column name mismatch)  
**Missing Components**: 4 tables, 5 functions  
**Working Components**: Database connection, authentication, basic structure  

**Estimated Fix Time**: 30-60 minutes  
**Risk Level**: LOW (adding columns/tables is safe)  

---

**Report Generated**: 2025-10-09T03:10:00Z  
**Generated By**: MCP Supabase Audit Tool

