# ✅ WORKING Claude Desktop Configuration (TESTED)

## Status: ✅ Both HTTP and HTTPS tested and working with 51 tools

---

## 🎯 Use This Config (Copy & Paste)

### For Remote Access (From Your Desktop to VPS):

**Step 1**: Download the bridge script to your local machine:
```bash
scp root@168.231.74.29:/root/vibe-frontend/mcp-http-bridge.js ~/mcp-http-bridge.js
```

**Step 2**: Paste this into your Claude Desktop config:

**Location**:
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": [
        "~/mcp-http-bridge.js"
      ],
      "env": {
        "MCP_SERVER_URL": "https://link.seyederick.com/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

**For Windows**, use full path:
```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": [
        "C:\\Users\\YourUsername\\mcp-http-bridge.js"
      ],
      "env": {
        "MCP_SERVER_URL": "https://link.seyederick.com/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

---

## 🔧 For Local VPS Testing:

If you're testing directly on the VPS with Claude Desktop installed:

```json
{
  "mcpServers": {
    "vibe-mcp-local": {
      "command": "node",
      "args": [
        "/root/vibe-frontend/lib/mcp/stdio-wrapper.js"
      ],
      "env": {
        "MCP_SERVER_URL": "http://localhost:7777/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

---

## ✅ Test Results (Verified Working)

### HTTP Endpoint Test:
```bash
curl -X POST https://link.seyederick.com/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'
```
**Result**: `51` ✅

### stdio Bridge Test:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  MCP_SERVER_URL="https://link.seyederick.com/mcp" \
  MCP_API_KEY="lano_master_key_2024" \
  node ~/mcp-http-bridge.js | jq '.result.tools | length'
```
**Result**: `51` ✅

---

## 🚫 What Doesn't Work

### ❌ mcp-remote with SSE endpoint:
```json
{
  "mcpServers": {
    "vibe-mcp-sse": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://link.seyederick.com/api/v1/events"],
      "env": { "MCP_API_KEY": "lano_master_key_2024" }
    }
  }
}
```
**Problem**: `mcp-remote` tries to POST to SSE endpoint, but SSE only accepts GET requests.
**Error**: `Cannot POST /api/v1/events` (HTTP 404)

**Why**: Our SSE endpoint (`/api/v1/events`) is for real-time event streaming, not MCP protocol. The `mcp-remote` package expects an MCP-compliant SSE endpoint that accepts JSON-RPC over SSE.

**Solution**: Use the stdio bridge instead (which is what we're providing above).

---

## 📊 What You Get (51 Tools)

When successfully connected, Claude Desktop will show:

**✅ Core Memory (7 tools)**:
- core_create_memory
- core_search_memories
- core_get_memory
- core_update_memory
- core_delete_memory
- core_list_memories
- core_search_lanonasis_docs

**✅ Core API Keys (4 tools)**:
- core_create_api_key
- core_list_api_keys
- core_rotate_api_key
- core_delete_api_key

**✅ Core System (3 tools)**:
- core_get_health_status
- core_get_auth_status
- core_get_organization_info

**✅ Core Business (4 tools)**:
- core_create_project
- core_list_projects
- core_get_config
- core_set_config

**✅ Neon Database (15 tools)**:
- neon_list_projects
- neon_create_project
- neon_query_database
- neon_create_branch
- neon_create_memory
- neon_get_memory
- neon_update_memory
- neon_delete_memory
- neon_list_memories
- neon_search_memories
- neon_get_memory_stats
- neon_bulk_delete_memories
- neon_create_memory_topic
- neon_get_memory_topics
- neon_search_lanonasis_docs

**✅ App Store Connect (17 tools)**:
- appstore_list_apps
- appstore_get_app
- appstore_create_app
- appstore_list_builds
- appstore_get_build
- appstore_list_beta_groups
- appstore_create_beta_group
- appstore_list_beta_testers
- appstore_invite_beta_tester
- appstore_get_app_analytics
- appstore_get_sales_reports
- appstore_list_app_store_versions
- appstore_create_app_store_version
- appstore_list_certificates
- appstore_list_profiles
- appstore_list_users
- appstore_health_check

**✅ Quick Auth (1 tool)**:
- quick-auth_health_check

---

## 🔍 Troubleshooting

### Problem: "No tools showing up"

**Solution 1**: Check if gateway is running
```bash
ssh root@168.231.74.29 "pm2 status vibe-mcp"
```

**Solution 2**: Test the HTTP endpoint directly
```bash
curl -X POST https://link.seyederick.com/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq
```

**Solution 3**: Check bridge script path
- Make sure `~/mcp-http-bridge.js` exists on your local machine
- Use full path instead of `~` if needed

**Solution 4**: Test the bridge locally
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  MCP_SERVER_URL="https://link.seyederick.com/mcp" \
  MCP_API_KEY="lano_master_key_2024" \
  node ~/mcp-http-bridge.js
```

### Problem: "Transport creation error"

**Fix**: Make sure you have Node.js installed:
```bash
node --version  # Should be v14 or higher
```

### Problem: "Cannot find module"

**Fix**: The path to `mcp-http-bridge.js` is wrong.

For Mac/Linux, try these paths in order:
1. `~/mcp-http-bridge.js`
2. `/Users/yourname/mcp-http-bridge.js`
3. Full absolute path

For Windows:
1. `C:\\Users\\YourUsername\\mcp-http-bridge.js`

---

## 🌐 Alternative: Direct HTTP Access (No Bridge)

If you want to test without Claude Desktop, use direct HTTP:

### cURL:
```bash
curl -X POST https://link.seyederick.com/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
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

### JavaScript:
```javascript
const response = await fetch('https://link.seyederick.com/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'lano_master_key_2024'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  })
});

const data = await response.json();
console.log(`${data.result.tools.length} tools available`);
```

### Python:
```python
import requests

response = requests.post(
    'https://link.seyederick.com/mcp',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'lano_master_key_2024'
    },
    json={
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'tools/list'
    }
)

print(f"{len(response.json()['result']['tools'])} tools available")
```

---

## 📞 Support Commands

### Check Gateway Status:
```bash
ssh root@168.231.74.29 "pm2 status vibe-mcp"
```

### View Gateway Logs:
```bash
ssh root@168.231.74.29 "pm2 logs vibe-mcp --lines 50"
```

### Restart Gateway:
```bash
ssh root@168.231.74.29 "pm2 restart vibe-mcp"
```

### Test Health:
```bash
curl https://link.seyederick.com/health -H "x-api-key: lano_master_key_2024" | jq
```

---

**Gateway**: Vibe-MCP Unified Gateway v2.0.0
**Domain**: https://link.seyederick.com
**Port**: 7777
**Tools**: 51 total
**Status**: ✅ Production Ready
**Last Tested**: 2025-10-14
**Test Result**: ✅ 51 tools accessible via HTTPS
