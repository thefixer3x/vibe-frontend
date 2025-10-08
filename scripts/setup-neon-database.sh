#!/bin/bash

# Setup Neon Database for Memory Services
# This script applies the memory schema to the actual Neon database

echo "🔧 Setting up Neon database for memory services..."

# Get the connection string for the first project
PROJECT_ID="plain-voice-23407025"
CONNECTION_STRING=$(neon connection-string --project-id $PROJECT_ID)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Failed to get Neon connection string"
    exit 1
fi

echo "📋 Using project: $PROJECT_ID"
echo "🔗 Connection: ${CONNECTION_STRING:0:50}..."

# Apply the schema
echo "📝 Applying memory schema to Neon database..."
psql "$CONNECTION_STRING" -f scripts/setup-neon-memory-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Memory schema applied successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Update the Neon bridge to use real database connection"
    echo "2. Test memory storage and retrieval"
    echo "3. Verify vector search functionality"
    echo ""
    echo "📊 Expected results:"
    echo "   ✅ Real memory storage and retrieval"
    echo "   ✅ Vector similarity search"
    echo "   ✅ Memory statistics and analytics"
    echo "   ✅ Proper memory context management"
else
    echo "❌ Failed to apply schema"
    exit 1
fi
