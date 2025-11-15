#!/bin/bash
#
# Simple script to update PM2 metadata using PM2 CLI
# This doesn't require the pm2 Node module, just the CLI
#

set -e

METADATA_FILE="$HOME/.pm2/vibe-mcp-metadata.json"
PROCESS_NAME="vibe-mcp"

echo "=== Updating PM2 Metadata for $PROCESS_NAME ==="

# Check if PM2 CLI is available
if ! command -v pm2 &> /dev/null; then
    echo "Error: PM2 CLI not found"
    exit 1
fi

# Check if process exists
if ! pm2 describe "$PROCESS_NAME" &> /dev/null; then
    echo "Error: Process $PROCESS_NAME not found"
    pm2 list
    exit 1
fi

# Create metadata JSON
mkdir -p "$(dirname "$METADATA_FILE")"

cat > "$METADATA_FILE" << 'EOF'
{
  "name": "vibe-mcp",
  "description": "Unified MCP Gateway - Aggregates multiple MCP sources into a single endpoint",
  "version": "1.0.0",
  "author": "Lanonasis",
  "repository": "https://github.com/lanonasis/vibe-frontend",
  "keywords": ["mcp", "gateway", "model-context-protocol", "websocket", "sse"],
  "environment": "production",
  "service": {
    "type": "gateway",
    "protocol": ["http", "websocket", "sse"],
    "ports": [7777, 7778],
    "endpoints": {
      "primary": "/mcp",
      "health": "/health",
      "admin": "/admin/add-source",
      "metrics": "/metrics"
    }
  },
  "sources": {
    "core": {
      "name": "mcp-core",
      "tools": 18,
      "protocol": "stdio"
    },
    "quick-auth": {
      "name": "quick-auth",
      "tools": 0,
      "protocol": "http"
    },
    "neon": {
      "name": "neon",
      "tools": 0,
      "protocol": "sse"
    },
    "appstore": {
      "name": "onasis-gateway",
      "tools": 17,
      "protocol": "http"
    }
  },
  "monitoring": {
    "metrics": {
      "enabled": true,
      "interval": 5000,
      "custom": true
    },
    "logs": {
      "error": "/var/log/pm2/vibe-mcp-error.log",
      "output": "/var/log/pm2/vibe-mcp-out.log",
      "application": "/var/log/mcp-gateway.log"
    }
  },
  "performance": {
    "maxMemory": "512M",
    "nodeArgs": "--max-old-space-size=512",
    "interpreter": "tsx"
  },
  "updated": "2025-11-15T00:30:00Z"
}
EOF

echo "✓ Metadata saved to: $METADATA_FILE"

# Display current process info
echo ""
echo "Current process information:"
pm2 describe "$PROCESS_NAME" | head -20

echo ""
echo "=== Metadata Update Complete ==="
echo ""
echo "Metadata file: $METADATA_FILE"
echo "View metadata: cat $METADATA_FILE"
echo ""
echo "To view process details: pm2 describe $PROCESS_NAME"
echo "To monitor: pm2 monit"

