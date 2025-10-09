# MCP Gateway Management Guide

## Overview
The system runs **4 core services** managed by PM2, providing a comprehensive MCP and authentication infrastructure:

### Core Services
1. **mcp-unified-gateway** - Customer-facing central gateway (50+ tools)
2. **vibe-gateway** - Personal gateway with Neon DB (51 tools) on port 7777
3. **mcp-core** - Core memory services using Supabase (ports 3001, 3003, 3004)
4. **quick-auth** - Robust CLI authentication (port 3005)

The vibe-gateway uses an ecosystem config file to ensure it always starts correctly.

## Quick Status Check
```bash
pm2 list
# Should show all 4 services online:
# - mcp-unified-gateway
# - vibe-gateway
# - mcp-core
# - quick-auth

# Test vibe-gateway (51 tools via Neon DB)
curl https://link.seyederick.com/mcp \
  -H "X-API-Key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Managing Services

### Start/Stop/Restart All Services
```bash
# Restart all services
pm2 restart all

# Restart individual services
pm2 restart vibe-gateway
pm2 restart mcp-core
pm2 restart quick-auth
pm2 restart mcp-unified-gateway

# View logs
pm2 logs vibe-gateway
pm2 logs mcp-core --lines 100
pm2 logs quick-auth
pm2 logs mcp-unified-gateway

# Monitor all services
pm2 monit
```

### After Making Code Changes to Vibe Gateway
```bash
cd /root/vibe-frontend
pm2 restart vibe-gateway
pm2 logs vibe-gateway
```

### If Vibe Gateway Shows Wrong File
**Problem**: PM2 might start old gateway from `/root/.claude/mcp-gateway/`

**Solution**:
```bash
# Remove conflicting gateway services
pm2 delete vibe-frontend-mcp-gateway 2>/dev/null || true

# Ensure vibe-gateway is using correct file
pm2 describe vibe-gateway | grep "script path"
# Should show: /root/vibe-frontend/lib/mcp/gateway/unified-gateway.ts

# If wrong, restart with ecosystem config
cd /root/vibe-frontend
pm2 delete vibe-gateway
pm2 start ecosystem.config.js --only vibe-gateway
pm2 save
```

## Configuration Files

### Ecosystem Config (ALWAYS USE THIS)
**Location**: `/root/vibe-frontend/ecosystem.config.js`

This ensures:
- Correct file path: `/root/vibe-frontend/lib/mcp/gateway/unified-gateway.ts`
- Correct interpreter: `tsx`
- Environment variables set (NEON_API_KEY, ports, etc.)
- Auto-restart on crashes
- Proper logging

### Key Environment Variables
```javascript
NEON_API_KEY: 'napi_lwscams84cmudaxc10l12ei0efuqxvszuke7m8kh8x0vr532i09eaq431whoxzm9'
MASTER_API_KEY: 'lano_master_key_2024'
PRIMARY_PORT: '7777'
FALLBACK_PORT: '7778'
```

## System Architecture

```
Public Endpoint: https://link.seyederick.com/mcp (Nginx on ports 80/443)
    ↓
Vibe Gateway (port 7777) - Personal gateway with 51 tools
    ├── mcp-core integration
    ├── quick-auth integration
    ├── neon-bridge (internal) - 15 tools
    └── appstore-bridge (internal) - 17 tools

MCP Core Service (ports 3001, 3003, 3004)
    ├── Port 3001: HTTP Protocol
    ├── Port 3003: WebSocket Protocol
    └── Port 3004: SSE Protocol

Quick Auth Service (port 3005)
    └── Robust CLI authentication with Supabase

MCP Unified Gateway
    └── Customer-facing central gateway (50+ tools)
```

## File Locations

**DO Use**:
- `/root/vibe-frontend/lib/mcp/gateway/unified-gateway.ts` - Main gateway ✅
- `/root/vibe-frontend/ecosystem.config.js` - PM2 config ✅

**DO NOT Use**:
- `/root/.claude/mcp-gateway/gateway.js` - Old version ❌
- `/root/vibe-frontend/lib/mcp/gateway.ts` - Different proxy ❌

## Troubleshooting

### Gateway Not Starting
```bash
# Check if port 7777 is available
netstat -tlnp | grep :7777

# Check logs for errors
pm2 logs unified-mcp-gateway --err --lines 50

# Restart with ecosystem config
pm2 delete unified-mcp-gateway
pm2 start /root/vibe-frontend/ecosystem.config.js
```

### Wrong File Being Used
```bash
# Check current config
pm2 describe unified-mcp-gateway | grep "script path"

# Should show: /root/vibe-frontend/lib/mcp/gateway/unified-gateway.ts
# If not, delete and restart with ecosystem config
```

### Tools Not Working
```bash
# Test directly
curl http://localhost:7777/health

# Check tool sources
pm2 logs unified-mcp-gateway | grep "Loaded.*tools"
# Should show:
# - 18 tools from MCP Core
# - 15 tools from Neon Bridge
# - 17 tools from App Store
# - 1 tool from Quick Auth
```

### Environment Variables Not Set
```bash
# Restart with --update-env
pm2 restart unified-mcp-gateway --update-env

# Or delete and use ecosystem config
pm2 delete unified-mcp-gateway
pm2 start ecosystem.config.js
pm2 save
```

## Server Reboot Survival

### Setup PM2 Startup (One-time setup)
```bash
# Generate startup script
pm2 startup

# Copy the command it outputs and run it
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Save current PM2 list
pm2 save
```

Now the gateway will auto-start on server reboot!

### Verify After Reboot
```bash
pm2 list
curl https://link.seyederick.com/mcp \
  -H "X-API-Key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Health Checks

### Manual Test
```bash
# Gateway health
curl http://localhost:7777/health

# Tool execution
curl -X POST https://link.seyederick.com/mcp \
  -H "X-API-Key: lano_master_key_2024" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "core_get_health_status",
      "arguments": {}
    }
  }'
```

### Expected Response Format (MCP Content Array)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{...json data...}"
      }
    ]
  }
}
```

## Common PM2 Commands

```bash
# List all services
pm2 list

# Logs
pm2 logs                              # All services
pm2 logs unified-mcp-gateway          # Just gateway
pm2 logs --lines 100                  # More lines

# Monitoring
pm2 monit                             # Real-time monitor
pm2 show unified-mcp-gateway          # Detailed info

# Restart
pm2 restart unified-mcp-gateway       # Restart gateway
pm2 restart all                       # Restart all

# Save state
pm2 save                              # Save current PM2 list

# Clear logs
pm2 flush                             # Clear all logs
```

## Updating the Gateway

### After Code Changes
```bash
cd /root/vibe-frontend
git pull  # If pulling from repo
pm2 restart unified-mcp-gateway
pm2 logs unified-mcp-gateway
```

### After Environment Variable Changes
```bash
# Edit ecosystem.config.js
nano ecosystem.config.js

# Restart with new config
pm2 delete unified-mcp-gateway
pm2 start ecosystem.config.js
pm2 save
```

## Client Configuration

### For Claude Desktop
```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "command": "node",
      "args": ["/Users/seyederick/mcp-stdio-wrapper.js"]
    }
  }
}
```

### Stdio Wrapper Location
- Server: `/root/mcp-stdio-wrapper.js`
- Local Mac: `~/mcp-stdio-wrapper.js` (copy via scp)

---

**Last Updated**: October 9, 2025
**Version**: 2.0 (with ecosystem config)
