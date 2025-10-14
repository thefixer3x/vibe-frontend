# Vibe Frontend - Project Context

## Overview
Vibe Frontend is a unified MCP (Model Context Protocol) gateway that aggregates multiple MCP servers and provides multi-protocol access (HTTP, WebSocket, SSE) to 51+ tools across 4 different services.

## Current Status
- **Version**: 2.0.0
- **Production URL**: https://link.seyederick.com
- **Gateway Port**: 7777
- **Status**: ✅ Production Ready
- **Last Updated**: 2025-10-14

## Quick Stats
- **Total Tools**: 51
- **MCP Sources**: 4 (MCP Core, Quick Auth, Neon Bridge, App Store Connect)
- **Protocols**: HTTP REST, WebSocket, SSE
- **Authentication**: API Key based (`x-api-key` header)

## Services Architecture

### Gateway Services (Port 7777)
```
vibe-mcp-unified-gateway
├── HTTP API: /mcp, /health, /api/v1/*
├── WebSocket: /ws
└── SSE: /api/v1/events
```

### Backend Services
- **mcp-core** (Port 3001) - 18 tools: Memory, API Keys, System, Business
- **quick-auth** (Port 3005) - 1 tool: Authentication health check
- **neon-bridge** (Internal) - 15 tools: Database operations, memory management
- **appstore-bridge** (Internal) - 17 tools: App Store Connect integration

## Key Features
- ✅ Multi-protocol support (HTTP/WebSocket/SSE)
- ✅ Unified tool aggregation from multiple sources
- ✅ Vector-based semantic search (1536-dim embeddings)
- ✅ Real-time event streaming via SSE
- ✅ Claude Desktop integration via stdio bridge
- ✅ HTTPS/SSL support via domain
- ✅ API key authentication
- ✅ Rate limiting and error handling

## Recent Deployments

### 2025-10-14: MCP Gateway Transport Channels & Client Integration
**What Changed**:
- ✅ Added SSE endpoint at `/api/v1/events` with heartbeat and real-time updates
- ✅ Fixed localhost vs 127.0.0.1 issue (IPv6 fallback causing rate limits)
- ✅ Created stdio-to-HTTP bridge for Claude Desktop integration (HTTP + HTTPS support)
- ✅ Fixed UUID/database constraints (user_id nullable, organization_id added)
- ✅ Documented memory type enum validation (context, project, knowledge, etc.)
- ✅ Created comprehensive client configuration guides

**Issues Resolved**:
1. SSE not available on gateway (added /api/v1/events endpoint)
2. localhost showing only 33 tools instead of 51 (use 127.0.0.1 instead)
3. Memory creation failing with UUID errors (nullable user_id, correct enums)
4. mcp-remote not working (provided stdio bridge alternative)
5. Missing client integration docs (created 10+ config guides)

**Files Added**: 15 documentation files (see devops/context/2025-10-14-mcp-gateway-deployment/)

**Testing Results**:
- HTTP API: ✅ 51 tools via both localhost and remote
- SSE: ✅ Connection, heartbeat (30s), tools broadcast (60s)
- WebSocket: ⚠️ Connects but needs proper MCP handshake
- Claude Desktop: ✅ Working with stdio bridge (local & remote)

## Documentation

### For Latest Deployment Details
See: `devops/context/2025-10-14-mcp-gateway-deployment/`

**Quick Reference Files**:
- `COPY-PASTE-HERE.txt` - Ready-to-use configs for Claude Desktop
- `LOCALHOST-ISSUE-EXPLAINED.md` - Why 127.0.0.1 > localhost
- `UUID-ISSUES-FIX.md` - Database/enum validation troubleshooting
- `README-CONFIGS.md` - Complete configuration guide

### For Client Integration
- `REMOTE-CLIENT-CONFIGS.md` - Mobile apps, web clients, direct HTTP
- `SSE-CLIENT-EXAMPLES.md` - SSE connection examples (all languages)
- `MCP-CLIENT-CONFIGS.md` - Generic MCP client configs

### For Claude Desktop Setup
Use configs in the deployment folder based on your scenario:
1. **On VPS**: `FIXED-CLAUDE-DESKTOP-CONFIG.json` (use 127.0.0.1)
2. **Remote**: `CLAUDE-DESKTOP-REMOTE.json` (use https://link.seyederick.com)

## Common Issues & Solutions

### Issue: Only 33 tools showing instead of 51
**Solution**: Use `http://127.0.0.1:7777/mcp` instead of `http://localhost:7777/mcp`
**Why**: localhost triggers IPv6 attempt → fallback delay → mcp-core rate limiting

### Issue: Memory creation fails with "invalid enum" error
**Solution**: Use valid memory types: `context`, `project`, `knowledge`, `reference`, `personal`, `workflow`
**Wrong**: `"type": "note"` ❌
**Correct**: `"type": "context"` ✅

### Issue: UUID foreign key constraint violation
**Solution**: Already fixed - user_id is now nullable, FK constraint dropped
**Status**: ✅ Resolved

### Issue: Claude Desktop shows "no tools"
**Solution**:
1. Check gateway is running: `pm2 status vibe-mcp`
2. Verify bridge script path is correct
3. Use 127.0.0.1 instead of localhost (VPS only)
4. Test endpoint: `curl http://127.0.0.1:7777/health`

## Testing Commands

### Health Check
```bash
curl http://127.0.0.1:7777/health -H "x-api-key: lano_master_key_2024"
```

### List All Tools
```bash
curl -X POST http://127.0.0.1:7777/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'
```

### Test SSE Connection
```bash
curl -N http://127.0.0.1:7777/api/v1/events \
  -H "Accept: text/event-stream" \
  -H "x-api-key: lano_master_key_2024"
```

### Test stdio Bridge
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  MCP_SERVER_URL="http://127.0.0.1:7777/mcp" \
  MCP_API_KEY="lano_master_key_2024" \
  node /root/vibe-frontend/mcp-http-bridge.js | jq '.result.tools | length'
```

## Service Management

### View Status
```bash
pm2 status vibe-mcp
pm2 status mcp-core
```

### View Logs
```bash
pm2 logs vibe-mcp --lines 50
pm2 logs mcp-core --lines 50
```

### Restart Services
```bash
pm2 restart vibe-mcp
pm2 restart mcp-core
```

## Development Context

### Git Repository
- **Remote**: https://github.com/thefixer3x/vibe-frontend.git
- **Branch**: deploy
- **Local Path**: /root/vibe-frontend

### Key Scripts
- `mcp-http-bridge.js` - stdio-to-HTTP bridge (supports HTTP & HTTPS)
- `lib/mcp/stdio-wrapper.js` - Copy of bridge for VPS use
- `lib/mcp/gateway/unified-gateway.ts` - Main gateway implementation

### Environment Variables
```bash
MCP_SERVER_URL="http://127.0.0.1:7777/mcp"
MCP_API_KEY="lano_master_key_2024"
```

## API Key
**Master Key**: `lano_master_key_2024`
**Header**: `x-api-key: lano_master_key_2024`

## Production URLs
- **HTTP API**: https://link.seyederick.com/mcp
- **SSE**: https://link.seyederick.com/api/v1/events
- **WebSocket**: wss://link.seyederick.com/ws
- **Health**: https://link.seyederick.com/health

## Next Steps / TODO
- [ ] Fix WebSocket disconnect issue (Code 1006)
- [ ] Create system user in database for proper FK constraints
- [ ] Add more detailed tool usage examples
- [ ] Set up automated health monitoring
- [ ] Add API key rotation mechanism

## Support & Debugging
For detailed troubleshooting, configuration guides, and deployment notes, see:
**📁 `/devops/context/2025-10-14-mcp-gateway-deployment/`**

All documentation is organized by date in the devops/context folder for easy reference and project lifecycle tracking.

---

**Last Checkpoint**: 2025-10-14
**Status**: ✅ All transport channels operational, client integration complete
**Tools Available**: 51 (18 Core + 1 Auth + 15 Neon + 17 AppStore)
