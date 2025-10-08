-- Create memory_entries table for MCP core service
CREATE TABLE
IF NOT EXISTS "memory_entries"
(
	"id" varchar
(255) PRIMARY KEY NOT NULL,
	"title" varchar
(500) NOT NULL,
	"content" text NOT NULL,
	"type" varchar
(50) NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"user_id" varchar
(255) NOT NULL,
	"organization_id" varchar
(255),
	"project_id" varchar
(255),
	"created_at" timestamp DEFAULT now
() NOT NULL,
	"updated_at" timestamp DEFAULT now
() NOT NULL,
	"last_accessed" timestamp,
	"access_count" integer DEFAULT 0 NOT NULL,
	"embedding_vector" vector
(1536),
	"relevance_score" real DEFAULT 1.0,
	"is_active" boolean DEFAULT true NOT NULL
);

-- Create indexes for better performance
CREATE INDEX
IF NOT EXISTS "idx_memory_entries_user_id" ON "memory_entries"
("user_id");
CREATE INDEX
IF NOT EXISTS "idx_memory_entries_type" ON "memory_entries"
("type");
CREATE INDEX
IF NOT EXISTS "idx_memory_entries_created_at" ON "memory_entries"
("created_at");
CREATE INDEX
IF NOT EXISTS "idx_memory_entries_tags" ON "memory_entries" USING gin
("tags");
CREATE INDEX
IF NOT EXISTS "idx_memory_entries_metadata" ON "memory_entries" USING gin
("metadata");

-- Create memory_topics table for organization
CREATE TABLE
IF NOT EXISTS "memory_topics"
(
	"id" varchar
(255) PRIMARY KEY NOT NULL,
	"name" varchar
(255) NOT NULL,
	"description" text,
	"parent_topic_id" varchar
(255),
	"organization_id" varchar
(255) NOT NULL,
	"created_at" timestamp DEFAULT now
() NOT NULL,
	"updated_at" timestamp DEFAULT now
() NOT NULL,
	"memory_count" integer DEFAULT 0 NOT NULL
);

-- Create indexes for memory_topics
CREATE INDEX
IF NOT EXISTS "idx_memory_topics_organization_id" ON "memory_topics"
("organization_id");
CREATE INDEX
IF NOT EXISTS "idx_memory_topics_parent_topic_id" ON "memory_topics"
("parent_topic_id");

-- Create organizations table if it doesn't exist
CREATE TABLE
IF NOT EXISTS "organizations"
(
	"id" varchar
(255) PRIMARY KEY NOT NULL,
	"name" varchar
(255) NOT NULL,
	"plan" varchar
(50) DEFAULT 'free' NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now
() NOT NULL,
	"updated_at" timestamp DEFAULT now
() NOT NULL,
	"status" varchar
(20) DEFAULT 'active' NOT NULL
);

-- Create projects table if it doesn't exist  
CREATE TABLE
IF NOT EXISTS "projects"
(
	"id" varchar
(255) PRIMARY KEY NOT NULL,
	"name" varchar
(255) NOT NULL,
	"description" text,
	"organization_id" varchar
(255) NOT NULL,
	"created_at" timestamp DEFAULT now
() NOT NULL,
	"updated_at" timestamp DEFAULT now
() NOT NULL,
	"status" varchar
(20) DEFAULT 'active' NOT NULL
);

-- Create foreign key constraints
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;
ALTER TABLE "memory_topics" ADD CONSTRAINT "memory_topics_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "memory_topics" ADD CONSTRAINT "memory_topics_parent_topic_id_fk" FOREIGN KEY ("parent_topic_id") REFERENCES "memory_topics"("id") ON DELETE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
