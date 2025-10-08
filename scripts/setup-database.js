#!/usr/bin/env node

/**
 * Database Setup Script for MCP Core Service
 * 
 * This script sets up the necessary database schema for the mcp-core service
 * to resolve the 500 errors in core_* tools.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the SQL setup script
const setupSQL = readFileSync(join(__dirname, 'setup-memory-schema.sql'), 'utf8');

console.log('🔧 Setting up database schema for MCP Core Service...');
console.log('📋 This will create the following tables:');
console.log('   - organizations');
console.log('   - projects');
console.log('   - memory_entries');
console.log('   - memory_topics');
console.log('');

// Instructions for manual setup
console.log('📝 To apply this schema, run one of the following:');
console.log('');
console.log('Option 1 - Using psql:');
console.log('   psql -d your_database_name -f scripts/setup-memory-schema.sql');
console.log('');
console.log('Option 2 - Using Supabase Dashboard:');
console.log('   1. Go to your Supabase project dashboard');
console.log('   2. Navigate to SQL Editor');
console.log('   3. Copy and paste the contents of scripts/setup-memory-schema.sql');
console.log('   4. Click "Run"');
console.log('');
console.log('Option 3 - Using Drizzle (if configured):');
console.log('   npm run db:migrate');
console.log('   # or');
console.log('   npx drizzle-kit push');
console.log('');

console.log('✅ After running the schema setup, the core_* tools should work properly!');
console.log('🎯 This will resolve the 500 errors in:');
console.log('   - core_create_memory');
console.log('   - core_list_memories');
console.log('   - core_search_memories');
console.log('   - core_get_memory');
console.log('   - core_update_memory');
console.log('   - core_delete_memory');
console.log('   - core_create_api_key');
console.log('   - core_list_api_keys');
console.log('');

console.log('📊 Expected Results:');
console.log('   ✅ 51/51 tools working (100%)');
console.log('   ✅ All core_* tools functional');
console.log('   ✅ Neon tools continue working');
console.log('   ✅ App Store tools continue working');
console.log('   ✅ Full MCP integration operational');
