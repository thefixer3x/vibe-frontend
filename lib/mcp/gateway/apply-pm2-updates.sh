#!/bin/bash
#
# Script to apply PM2 metadata and metrics updates for vibe-mcp process
# Usage: ./apply-pm2-updates.sh
#

set -e

echo "=== PM2 Metadata and Metrics Update Script ==="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Error: PM2 is not installed"
    exit 1
fi

# Check if process exists
if ! pm2 describe vibe-mcp &> /dev/null; then
    echo "Error: vibe-mcp process not found in PM2"
    echo "Available processes:"
    pm2 list
    exit 1
fi

echo "Step 1: Updating PM2 metadata..."
node /opt/lanonasis/vibe-frontend/lib/mcp/gateway/update-pm2-metadata.js

echo ""
echo "Step 2: Installing PM2 package if needed..."
cd /opt/lanonasis/vibe-frontend/lib/mcp/gateway

# Check if pm2 is in package.json dependencies
if [ -f "package.json" ]; then
    if ! grep -q '"pm2"' package.json; then
        echo "Adding pm2 to dependencies..."
        npm install pm2 --save || bun add pm2
    else
        echo "pm2 already in dependencies"
    fi
else
    echo "Warning: package.json not found, installing pm2 globally..."
    npm install -g pm2 || echo "Note: You may need to install pm2 manually"
fi

echo ""
echo "Step 3: Verifying metrics module..."
if [ ! -f "pm2-metrics.ts" ]; then
    echo "Error: pm2-metrics.ts not found"
    exit 1
fi

echo "✓ Metrics module found"

echo ""
echo "Step 4: Checking TypeScript compilation..."
if command -v tsc &> /dev/null; then
    echo "TypeScript compiler found"
else
    echo "Warning: TypeScript compiler not found. Make sure tsx can handle TypeScript files."
fi

echo ""
echo "=== Update Complete ==="
echo ""
echo "Next steps:"
echo "1. Review the integration guide: integrate-metrics.md"
echo "2. Integrate metrics into unified-gateway.ts (see guide)"
echo "3. Restart the process: pm2 restart vibe-mcp"
echo "4. Check metrics: pm2 describe vibe-mcp"
echo "5. View metadata: cat ~/.pm2/vibe-mcp-metadata.json"
echo ""
echo "To view custom metrics, you can:"
echo "  - Check the /metrics endpoint (if added)"
echo "  - Use: pm2 logs vibe-mcp"
echo "  - Use: pm2 monit"

