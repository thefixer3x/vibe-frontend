# Quick Start: PM2 Custom Metrics for vibe-mcp

## Overview

Custom metrics and metadata have been set up for your PM2 process `vibe-mcp` (ID: 4). This allows you to track detailed application metrics beyond the standard CPU/memory metrics.

## What Was Created

1. **pm2-metrics.ts** - Metrics tracking module
2. **update-pm2-metadata.js** - Metadata update script
3. **ecosystem.config.updated.cjs** - Updated PM2 config with metadata
4. **Integration guide** - Step-by-step instructions
5. **Automation script** - One-command setup

## Quick Setup (3 Steps)

### Step 1: Update Metadata

```bash
cd /opt/lanonasis/vibe-frontend/lib/mcp/gateway
node update-pm2-metadata.js
```

This will:
- Update PM2 process metadata
- Save metadata to `~/.pm2/vibe-mcp-metadata.json`
- Set environment variables with metadata

### Step 2: Install Dependencies

```bash
cd /opt/lanonasis/vibe-frontend/lib/mcp/gateway
npm install pm2 --save
# or if using bun:
bun add pm2
```

### Step 3: Integrate Metrics

Follow the instructions in `integrate-metrics.md` to add metrics tracking to your `unified-gateway.ts` file.

**Or use the automated script:**

```bash
./apply-pm2-updates.sh
```

## What Metrics Are Tracked?

- ✅ HTTP requests (total, success, errors, by endpoint)
- ✅ Response times (average, p95, p99)
- ✅ WebSocket connections (active, total, messages)
- ✅ Tool calls (by source, by tool, errors)
- ✅ Database pool metrics (connections, queries)
- ✅ Source health status
- ✅ Request rate (requests/second)

## Viewing Metrics

### Option 1: PM2 CLI
```bash
pm2 describe vibe-mcp
pm2 monit
pm2 logs vibe-mcp
```

### Option 2: HTTP Endpoint (after integration)
```bash
curl http://localhost:7777/metrics
```

### Option 3: Metadata File
```bash
cat ~/.pm2/vibe-mcp-metadata.json
```

## Current Process Info

- **Name**: vibe-mcp
- **ID**: 4
- **Status**: online
- **Script**: `/opt/lanonasis/vibe-frontend/lib/mcp/gateway/unified-gateway.ts`
- **Interpreter**: tsx
- **Ports**: 7777 (primary), 7778 (fallback)

## Next Steps

1. ✅ Metadata update script created
2. ✅ Metrics module created
3. ⏳ Integrate metrics into application (see `integrate-metrics.md`)
4. ⏳ Restart process: `pm2 restart vibe-mcp`
5. ⏳ Verify metrics: `pm2 describe vibe-mcp`

## Troubleshooting

**Q: Script says "pm2 not found"**
```bash
npm install -g pm2
# or use the local version after npm install pm2
```

**Q: TypeScript errors**
```bash
# Make sure tsx is installed
npm install -g tsx
# or
bun install
```

**Q: Process not found**
```bash
# Check process name
pm2 list
# Update script with correct name if different
```

## Files Reference

- `pm2-metrics.ts` - Main metrics module
- `update-pm2-metadata.js` - Metadata updater
- `integrate-metrics.md` - Integration instructions
- `apply-pm2-updates.sh` - Automated setup
- `README-METRICS.md` - Full documentation
- `ecosystem.config.updated.cjs` - Updated PM2 config

## Support

For detailed documentation, see `README-METRICS.md`.
For integration help, see `integrate-metrics.md`.

