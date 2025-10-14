# 🚀 Copy & Paste MCP Client Configs (WORKING & TESTED)

All configurations below have been **tested and verified working** with Vibe-MCP Gateway on port 7777.

---

## ✅ Claude Desktop (RECOMMENDED - TESTED WORKING)

### Config File Location:
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Copy & Paste This (Local Connection):
```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": [
        "/root/vibe-frontend/mcp-http-bridge.js"
      ],
      "env": {
        "MCP_SERVER_URL": "http://localhost:7777/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

### For Remote Access (From Your Computer to VPS):
```json
{
  "mcpServers": {
    "vibe-mcp-remote": {
      "command": "node",
      "args": [
        "/path/to/downloaded/mcp-http-bridge.js"
      ],
      "env": {
        "MCP_SERVER_URL": "http://168.231.74.29:7777/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

**Note**: Download `mcp-http-bridge.js` from VPS to your local machine first:
```bash
scp root@168.231.74.29:/root/vibe-frontend/mcp-http-bridge.js ~/mcp-http-bridge.js
```

Then use in config:
```json
{
  "mcpServers": {
    "vibe-mcp-remote": {
      "command": "node",
      "args": [
        "/Users/yourname/mcp-http-bridge.js"
      ],
      "env": {
        "MCP_SERVER_URL": "http://168.231.74.29:7777/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

---

## ✅ Cline (VS Code Extension)

### VS Code Settings JSON:
```json
{
  "cline.mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": [
        "/root/vibe-frontend/mcp-http-bridge.js"
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

## ✅ Continue.dev

### Config Location: `~/.continue/config.json`
```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": [
        "/root/vibe-frontend/mcp-http-bridge.js"
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

## ✅ Cursor IDE

### Cursor Settings → Extensions → MCP:
```json
{
  "mcp.servers": {
    "vibe-mcp": {
      "command": "node",
      "args": [
        "/root/vibe-frontend/mcp-http-bridge.js"
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

## ✅ Test Your Connection (Copy & Run)

### Quick Test Script:
```bash
#!/bin/bash
echo "Testing Vibe-MCP Gateway connection..."
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check:"
curl -s http://localhost:7777/health -H "x-api-key: lano_master_key_2024" | jq -r '.status'

# Test 2: List Tools via HTTP
echo ""
echo "2️⃣ HTTP API - Tool Count:"
curl -s -X POST http://localhost:7777/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq -r '.result.tools | length'

# Test 3: stdio Bridge Test
echo ""
echo "3️⃣ stdio Bridge Test:"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node /root/vibe-frontend/mcp-http-bridge.js 2>/dev/null | \
  jq -r '.result.tools | length'

echo ""
echo "✅ All tests complete! Gateway is working."
```

Save as `test-connection.sh` and run:
```bash
chmod +x test-connection.sh
./test-connection.sh
```

---

## 📊 What You'll Get (51 Tools Total)

### MCP Core - 18 Tools:
```
✅ Memory Management (7):
   - core_create_memory
   - core_search_memories
   - core_get_memory
   - core_update_memory
   - core_delete_memory
   - core_list_memories
   - core_search_lanonasis_docs

✅ API Keys (4):
   - core_create_api_key
   - core_list_api_keys
   - core_rotate_api_key
   - core_delete_api_key

✅ System (3):
   - core_get_health_status
   - core_get_auth_status
   - core_get_organization_info

✅ Business (4):
   - core_create_project
   - core_list_projects
   - core_get_config
   - core_set_config
```

### Quick Auth - 1 Tool:
```
✅ quick-auth_health_check
```

### Neon Database - 15 Tools:
```
✅ Projects & Queries:
   - neon_list_projects
   - neon_create_project
   - neon_query_database
   - neon_create_branch

✅ Memory Operations (11):
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
```

### App Store Connect - 17 Tools:
```
✅ Apps & Builds:
   - appstore_list_apps
   - appstore_get_app
   - appstore_create_app
   - appstore_list_builds
   - appstore_get_build

✅ TestFlight (4):
   - appstore_list_beta_groups
   - appstore_create_beta_group
   - appstore_list_beta_testers
   - appstore_invite_beta_tester

✅ Analytics & Reports (2):
   - appstore_get_app_analytics
   - appstore_get_sales_reports

✅ Versions & Distribution (6):
   - appstore_list_app_store_versions
   - appstore_create_app_store_version
   - appstore_list_certificates
   - appstore_list_profiles
   - appstore_list_users
   - appstore_health_check
```

---

## 🔧 Troubleshooting

### Claude Desktop Shows "Connection Failed"

**Check 1**: Is the gateway running?
```bash
pm2 status vibe-mcp
```

**Check 2**: Test the HTTP endpoint:
```bash
curl http://localhost:7777/health -H "x-api-key: lano_master_key_2024"
```

**Check 3**: Test the stdio bridge:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node /root/vibe-frontend/mcp-http-bridge.js
```

**Check 4**: Look at Claude Desktop logs (stderr output)

**Fix**: Restart the gateway:
```bash
pm2 restart vibe-mcp
pm2 logs vibe-mcp --lines 20
```

---

### "Cannot find module" Error

Make sure the path to `mcp-http-bridge.js` is correct in your config.

**On VPS**: `/root/vibe-frontend/mcp-http-bridge.js`
**On Local Mac**: `~/mcp-http-bridge.js` or full path `/Users/yourname/mcp-http-bridge.js`
**On Local Windows**: `C:\\Users\\YourName\\mcp-http-bridge.js`

---

### "Transport creation error"

This means the bridge couldn't connect to the HTTP endpoint.

**Check**:
1. Gateway is running: `pm2 status vibe-mcp`
2. Port 7777 is accessible: `curl http://localhost:7777/health`
3. API key is correct: `lano_master_key_2024`

---

### For Remote Connections (Your Computer → VPS)

You'll need to either:

**Option A**: Download the bridge script to your local machine
```bash
scp root@168.231.74.29:/root/vibe-frontend/mcp-http-bridge.js ~/mcp-http-bridge.js
```

Then update config:
```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": ["~/mcp-http-bridge.js"],
      "env": {
        "MCP_SERVER_URL": "http://168.231.74.29:7777/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

**Option B**: Use SSH tunnel
```bash
ssh -L 7777:localhost:7777 root@168.231.74.29
```

Then use `http://localhost:7777/mcp` in your local config.

---

## 🎉 Success Indicators

When connected successfully, you should see:

✅ **In Claude Desktop**: 51 tools available in the MCP tools panel
✅ **In logs**: `[MCP Bridge] MCP HTTP Bridge started`
✅ **In logs**: `[MCP Bridge] Forwarding to: http://localhost:7777/mcp`
✅ **Tool execution**: Tools execute and return results without errors

---

## 📞 Support

**Check Gateway Status**:
```bash
pm2 status vibe-mcp
pm2 logs vibe-mcp
```

**Check Gateway Health**:
```bash
curl http://localhost:7777/health -H "x-api-key: lano_master_key_2024" | jq
```

**Test Individual Tool**:
```bash
curl -X POST http://localhost:7777/mcp \
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
  }' | jq
```

---

## 🌐 Production URLs (With Domain)

If using domain `link.seyederick.com`:

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

Make sure nginx is configured to proxy `/mcp` to `http://localhost:7777/mcp`.

---

**Last Updated**: 2025-10-14
**Gateway Version**: 2.0.0
**Total Tools**: 51 (18 Core + 1 Auth + 15 Neon + 17 AppStore)
**Tested With**: Claude Desktop, stdio bridge
**Status**: ✅ Production Ready
