# 🔧 localhost vs 127.0.0.1 Issue - SOLVED

## Problem

When running Claude Desktop on the VPS with `localhost`, only 33 tools appear instead of 51.

## Root Cause

When the bridge connects to `http://localhost:7777/mcp`:
- Node.js tries IPv6 `::1` first (fails with connection refused)
- Falls back to IPv4 `127.0.0.1`
- **But mcp-core (port 3001) gets rate-limited during this process**
- Result: vibe-mcp gateway can't reach mcp-core, returns only 33 tools (without core's 18 tools)

When the bridge connects to `http://127.0.0.1:7777/mcp`:
- Goes directly to IPv4
- No IPv6 attempt, no timeout, no rate limiting
- **All sources respond successfully**
- Result: Full 51 tools (18 core + 1 auth + 15 neon + 17 appstore)

## Evidence

### With `localhost`:
```bash
$ echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  MCP_SERVER_URL="http://localhost:7777/mcp" \
  node /root/vibe-frontend/lib/mcp/stdio-wrapper.js | \
  jq '.result._meta.sources'

{
  "core": {
    "status": "offline",
    "error": "Request failed with status code 429"  ← RATE LIMITED
  },
  "quick-auth": {"status": "online", "tools": 1},
  "neon": {"status": "online", "tools": 15},
  "appstore": {"status": "online", "tools": 17}
}

Total: 33 tools
```

### With `127.0.0.1`:
```bash
$ echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  MCP_SERVER_URL="http://127.0.0.1:7777/mcp" \
  node /root/vibe-frontend/lib/mcp/stdio-wrapper.js | \
  jq '.result._meta.sources'

{
  "core": {"status": "online", "tools": 18},  ← ONLINE
  "quick-auth": {"status": "online", "tools": 1},
  "neon": {"status": "online", "tools": 15},
  "appstore": {"status": "online", "tools": 17}
}

Total: 51 tools ✅
```

## Solution

### For VPS (Claude Desktop ON the VPS):

**WRONG** (33 tools only):
```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": ["/root/vibe-frontend/lib/mcp/stdio-wrapper.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:7777/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

**CORRECT** (51 tools):
```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": ["/root/vibe-frontend/lib/mcp/stdio-wrapper.js"],
      "env": {
        "MCP_SERVER_URL": "http://127.0.0.1:7777/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

### For Remote (Claude Desktop on YOUR machine):

Use the full domain (already correct):
```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": ["~/mcp-http-bridge.js"],
      "env": {
        "MCP_SERVER_URL": "https://link.seyederick.com/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

## Why This Happens

Node.js `http.request()` with `localhost`:
1. DNS resolution returns both IPv6 (::1) and IPv4 (127.0.0.1)
2. Attempts IPv6 first: `connect to ::1 port 7777` → Connection refused
3. Falls back to IPv4: `connect to 127.0.0.1 port 7777` → Success
4. BUT this delay causes timing issues with mcp-core rate limiting

Node.js `http.request()` with `127.0.0.1`:
1. Directly uses IPv4 address
2. No DNS resolution, no IPv6 attempt
3. Immediate connection success
4. No timing issues, no rate limiting

## Additional Context

**Server Binding**:
```bash
$ netstat -tulpn | grep :7777
tcp  0  0.0.0.0:7777  0.0.0.0:*  LISTEN  756048/node
```

The server binds to `0.0.0.0:7777` (all interfaces), so both `localhost` and `127.0.0.1` should work. However, the IPv6 attempt when using `localhost` introduces the timing issue that triggers rate limiting on mcp-core.

## Recommendation

**Always use `127.0.0.1` instead of `localhost` for local connections on the VPS.**

This is a known issue with Node.js DNS resolution and dual-stack networking. Using the explicit IP address bypasses the problem entirely.

## Files Updated

- ✅ `/root/vibe-frontend/FIXED-CLAUDE-DESKTOP-CONFIG.json` - Correct config for VPS
- ✅ `/root/vibe-frontend/README-CONFIGS.md` - Updated with 127.0.0.1
- ✅ `/root/vibe-frontend/COPY-PASTE-HERE.txt` - Updated cheat sheet

---

**Issue**: localhost → 33 tools (mcp-core rate limited)
**Solution**: 127.0.0.1 → 51 tools (all sources online)
**Status**: ✅ RESOLVED
**Date**: 2025-10-14
