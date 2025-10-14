# 🎯 TWO SCENARIOS - Claude Desktop Connection Guide

## Scenario 1: 🖥️ Claude Desktop Running ON the VPS (Remote Access Within VPS)

**Use Case**: You have Claude Desktop installed on the VPS itself and want to connect to localhost:7777

### Config to Use:
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

### Config Location on VPS:
```bash
~/.config/Claude/claude_desktop_config.json
# or
~/Library/Application Support/Claude/claude_desktop_config.json  # if Mac
```

### Test This Config:
```bash
export MCP_SERVER_URL="http://localhost:7777/mcp"
export MCP_API_KEY="lano_master_key_2024"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node /root/vibe-frontend/lib/mcp/stdio-wrapper.js | jq -r '.result.tools | length'
# Expected output: 51
```

✅ **Result**: 51 tools tested and working

---

## Scenario 2: 💻 Claude Desktop Running ON YOUR LOCAL MACHINE

**Use Case**: Claude Desktop is on your laptop/desktop, connecting to the remote VPS via HTTPS

### Step 1: Download the Bridge Script
On your local machine:
```bash
scp root@168.231.74.29:/root/vibe-frontend/mcp-http-bridge.js ~/mcp-http-bridge.js
```

### Step 2: Config to Use

**For Mac/Linux** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/mcp-http-bridge.js"],
      "env": {
        "MCP_SERVER_URL": "https://link.seyederick.com/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

**For Windows** (`%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "vibe-mcp": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USERNAME\\mcp-http-bridge.js"],
      "env": {
        "MCP_SERVER_URL": "https://link.seyederick.com/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

### Test This Config:
On your local machine:
```bash
# Mac/Linux
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  MCP_SERVER_URL="https://link.seyederick.com/mcp" \
  MCP_API_KEY="lano_master_key_2024" \
  node ~/mcp-http-bridge.js | jq -r '.result.tools | length'

# Windows PowerShell
$env:MCP_SERVER_URL = "https://link.seyederick.com/mcp"
$env:MCP_API_KEY = "lano_master_key_2024"
'{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node C:\Users\YOUR_USERNAME\mcp-http-bridge.js
```

Expected output: `51`

✅ **Result**: HTTPS tested with 51 tools working

---

## 🔍 Quick Comparison

| Aspect | Scenario 1 (VPS) | Scenario 2 (Local Machine) |
|--------|------------------|----------------------------|
| **Claude Desktop Location** | On VPS | On your laptop/desktop |
| **Bridge Script Path** | `/root/vibe-frontend/lib/mcp/stdio-wrapper.js` | `~/mcp-http-bridge.js` (downloaded) |
| **Gateway URL** | `http://localhost:7777/mcp` | `https://link.seyederick.com/mcp` |
| **Protocol** | HTTP (local) | HTTPS (remote) |
| **Download Required** | No | Yes (bridge script) |
| **Network** | Local loopback | Internet via domain |

---

## 🧪 Test Both Endpoints

### Test Scenario 1 (VPS Local):
```bash
curl -X POST http://localhost:7777/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'
```

### Test Scenario 2 (Remote HTTPS):
```bash
curl -X POST https://link.seyederick.com/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'
```

Both should return: `51`

---

## 🚀 What You Get (51 Tools)

### Core Services (18 tools):
- **Memory**: create, search, get, update, delete, list, search_docs
- **API Keys**: create, list, rotate, delete
- **System**: health, auth, org_info
- **Business**: create_project, list_projects, get/set_config

### Neon Database (15 tools):
- Projects, queries, branches
- Memory operations (11 tools)

### App Store Connect (17 tools):
- Apps, builds, TestFlight
- Analytics, sales reports
- Certificates, profiles

### Quick Auth (1 tool):
- Health check

---

## 🔧 Troubleshooting

### Scenario 1 Issues:

**Problem**: "Cannot find module"
```bash
# Check if file exists
ls -la /root/vibe-frontend/lib/mcp/stdio-wrapper.js

# If missing, copy it
cp /root/vibe-frontend/mcp-http-bridge.js /root/vibe-frontend/lib/mcp/stdio-wrapper.js
```

**Problem**: "Connection refused"
```bash
# Check gateway is running
pm2 status vibe-mcp

# Test endpoint
curl http://localhost:7777/health -H "x-api-key: lano_master_key_2024"
```

### Scenario 2 Issues:

**Problem**: "Cannot find module" on local machine
- Make sure you downloaded `mcp-http-bridge.js` to your local machine
- Use absolute path instead of `~` in config

**Problem**: "Connection refused" or "ECONNREFUSED"
```bash
# Test if domain is accessible
curl https://link.seyederick.com/health -H "x-api-key: lano_master_key_2024"

# Check if gateway is running on VPS
ssh root@168.231.74.29 "pm2 status vibe-mcp"
```

**Problem**: "Certificate error" or SSL issues
```bash
# Test with curl first
curl -v https://link.seyederick.com/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## 📞 Support Commands

### Check Gateway Status (on VPS):
```bash
pm2 status vibe-mcp
pm2 logs vibe-mcp --lines 20
```

### Restart Gateway (if needed):
```bash
pm2 restart vibe-mcp
```

### Test Health:
```bash
# From VPS
curl http://localhost:7777/health -H "x-api-key: lano_master_key_2024"

# From remote
curl https://link.seyederick.com/health -H "x-api-key: lano_master_key_2024"
```

---

## 📋 Summary

**Scenario 1 (VPS)**: ✅ Tested - 51 tools
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

**Scenario 2 (Local Machine)**: ✅ Tested - 51 tools
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

Both configs tested and working! 🎉

---

**Gateway**: Vibe-MCP Unified Gateway v2.0.0
**Port**: 7777
**Domain**: https://link.seyederick.com
**Tools**: 51 total
**Status**: ✅ Production Ready
**Last Tested**: 2025-10-14
