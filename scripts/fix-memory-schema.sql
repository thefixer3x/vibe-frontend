-- Fix memory schema to be compatible with existing user table
-- The user table uses integer IDs, so we need to adjust the foreign key

-- Drop existing foreign key constraints that are causing issues
ALTER TABLE memory_entries DROP CONSTRAINT IF EXISTS memory_entries_user_id_fk;
ALTER TABLE memory_entries DROP CONSTRAINT IF EXISTS memory_entries_organization_id_fk;
ALTER TABLE memory_entries DROP CONSTRAINT IF EXISTS memory_entries_project_id_fk;
ALTER TABLE memory_topics DROP CONSTRAINT IF EXISTS memory_topics_organization_id_fk;
ALTER TABLE memory_topics DROP CONSTRAINT IF EXISTS memory_topics_parent_topic_id_fk;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_organization_id_fk;

-- Update memory_entries to use integer user_id to match existing users table
ALTER TABLE memory_entries ALTER COLUMN user_id TYPE integer USING user_id::integer;

-- Add the correct foreign key constraint for user_id
ALTER TABLE memory_entries ADD CONSTRAINT memory_entries_user_id_fk 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Re-add other foreign key constraints
ALTER TABLE memory_entries ADD CONSTRAINT memory_entries_organization_id_fk 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE memory_entries ADD CONSTRAINT memory_entries_project_id_fk 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE memory_topics ADD CONSTRAINT memory_topics_organization_id_fk 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE memory_topics ADD CONSTRAINT memory_topics_parent_topic_id_fk 
FOREIGN KEY (parent_topic_id) REFERENCES memory_topics(id) ON DELETE CASCADE;

ALTER TABLE projects ADD CONSTRAINT projects_organization_id_fk 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Insert a test user if none exists
INSERT INTO users (id, name, email, password_hash, role) 
VALUES (1, 'System User', 'system@lanonasis.com', 'hashed_password', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Update the function to work with integer user_id
CREATE OR REPLACE FUNCTION update_memory_access_count(memory_id varchar)
RETURNS void AS $$
BEGIN
    UPDATE memory_entries 
    SET access_count = access_count + 1, 
        last_accessed = now() 
    WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;
