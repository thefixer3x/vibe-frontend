-- Setup Memory Schema for Neon Database
-- This script creates the necessary tables for memory services in the actual Neon database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan" varchar(50) DEFAULT 'free' NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"organization_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL
);

-- Create memory_entries table with vector support
CREATE TABLE IF NOT EXISTS "memory_entries" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"user_id" varchar(255) NOT NULL,
	"organization_id" varchar(255),
	"project_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed" timestamp,
	"access_count" integer DEFAULT 0 NOT NULL,
	"embedding_vector" vector(1536),
	"relevance_score" real DEFAULT 1.0,
	"is_active" boolean DEFAULT true NOT NULL
);

-- Create memory_topics table
CREATE TABLE IF NOT EXISTS "memory_topics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_topic_id" varchar(255),
	"organization_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"memory_count" integer DEFAULT 0 NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_memory_entries_user_id" ON "memory_entries" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_memory_entries_type" ON "memory_entries" ("type");
CREATE INDEX IF NOT EXISTS "idx_memory_entries_created_at" ON "memory_entries" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_memory_entries_tags" ON "memory_entries" USING gin ("tags");
CREATE INDEX IF NOT EXISTS "idx_memory_entries_metadata" ON "memory_entries" USING gin ("metadata");
CREATE INDEX IF NOT EXISTS "idx_memory_entries_embedding" ON "memory_entries" USING ivfflat ("embedding_vector" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "idx_memory_topics_organization_id" ON "memory_topics" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_memory_topics_parent_topic_id" ON "memory_topics" ("parent_topic_id");

-- Insert default organization if it doesn't exist
INSERT INTO "organizations" ("id", "name", "plan", "features", "status")
VALUES ('org_default', 'Default Organization', 'pro', '{"vector_search": true, "api_keys": true, "multi_user": true, "advanced_analytics": true}', 'active')
ON CONFLICT ("id") DO NOTHING;

-- Insert default project if it doesn't exist
INSERT INTO "projects" ("id", "name", "description", "organization_id", "status")
VALUES ('proj_default', 'Default Project', 'Default project for organization', 'org_default', 'active')
ON CONFLICT ("id") DO NOTHING;

-- Create foreign key constraints
DO $$ BEGIN
 ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "memory_topics" ADD CONSTRAINT "memory_topics_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "memory_topics" ADD CONSTRAINT "memory_topics_parent_topic_id_fk" FOREIGN KEY ("parent_topic_id") REFERENCES "memory_topics"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create a function to update memory access count
CREATE OR REPLACE FUNCTION update_memory_access_count(memory_id varchar)
RETURNS void AS $$
BEGIN
    UPDATE memory_entries 
    SET access_count = access_count + 1, 
        last_accessed = now() 
    WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function for semantic search using vector similarity
CREATE OR REPLACE FUNCTION search_memories_semantic(
    query_vector vector(1536),
    similarity_threshold real DEFAULT 0.7,
    max_results integer DEFAULT 10
)
RETURNS TABLE(
    id varchar,
    title varchar,
    content text,
    type varchar,
    tags jsonb,
    metadata jsonb,
    similarity_score real,
    created_at timestamp,
    updated_at timestamp
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
        1 - (me.embedding_vector <=> query_vector) as similarity_score,
        me.created_at,
        me.updated_at
    FROM memory_entries me
    WHERE me.is_active = true 
        AND me.embedding_vector IS NOT NULL
        AND 1 - (me.embedding_vector <=> query_vector) >= similarity_threshold
    ORDER BY me.embedding_vector <=> query_vector
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get memory statistics
CREATE OR REPLACE FUNCTION get_memory_stats(org_id varchar DEFAULT 'org_default')
RETURNS TABLE(
    total_memories bigint,
    memories_by_type jsonb,
    recent_activity bigint,
    avg_relevance_score real,
    top_tags jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_memories,
        jsonb_object_agg(me.type, type_count) as memories_by_type,
        COUNT(CASE WHEN me.created_at > now() - interval '7 days' THEN 1 END) as recent_activity,
        AVG(me.relevance_score) as avg_relevance_score,
        (
            SELECT jsonb_agg(tag_data)
            FROM (
                SELECT tag, COUNT(*) as count
                FROM memory_entries, jsonb_array_elements_text(tags) as tag
                WHERE organization_id = org_id AND is_active = true
                GROUP BY tag
                ORDER BY count DESC
                LIMIT 10
            ) tag_data
        ) as top_tags
    FROM (
        SELECT type, COUNT(*) as type_count
        FROM memory_entries
        WHERE organization_id = org_id AND is_active = true
        GROUP BY type
    ) me;
END;
$$ LANGUAGE plpgsql;
