# Migration Guide: From Wrapper to Direct SSE

## 🔄 Before (Using Wrapper)

### Your Current Setup

**File**: `~/mcp-stdio-wrapper.js`
```javascript
// Wrapper that converts stdio to HTTP calls
const axios = require('axios');
// ... wrapper logic
```

**Claude Desktop Config**: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "command": "node",
      "args": ["/Users/seyederick/mcp-stdio-wrapper.js"],
      "env": {},
      "working_directory": null
    }
  }
}
```

### Problems with Wrapper Approach
- ❌ Requires Node.js installed locally
- ❌ Requires wrapper file on every client machine
- ❌ Harder to debug and maintain
- ❌ Can't use from web clients
- ❌ Each client needs separate setup

---

## ✅ After (Direct SSE)

### New Setup (Much Simpler!)

**Claude Desktop Config**: Just one line!
```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse"
    }
  }
}
```

### Benefits of Direct SSE
- ✅ No local dependencies needed
- ✅ No wrapper file required
- ✅ Works from anywhere with internet
- ✅ Same config works on all machines
- ✅ Can use from Claude.ai (web version)
- ✅ Easier to debug (standard HTTP)
- ✅ Better error handling
- ✅ Automatic reconnection

---

## 📋 Step-by-Step Migration

### Step 1: Update Your Gateway
Your gateway has been updated with SSE support. Restart it:

```bash
cd /root/vibe-frontend
pm2 restart unified-gateway
# or
node lib/mcp/gateway/unified-gateway.ts
```

### Step 2: Test SSE Endpoint
```bash
# Test that SSE is working
curl -N https://link.seyederick.com/sse

# Expected output:
# data: {"type":"connected","sessionId":"session_1234567890_abc123"}
```

### Step 3: Update Claude Desktop Config

**Mac/Linux**:
```bash
# Backup old config
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json \
   ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup

# Edit config
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**:
```powershell
# Backup old config
Copy-Item "$env:APPDATA\Claude\claude_desktop_config.json" `
          "$env:APPDATA\Claude\claude_desktop_config.json.backup"

# Edit config
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

**Replace** the old config:
```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse"
    }
  }
}
```

### Step 4: Restart Claude Desktop
Close and reopen Claude Desktop completely (not just the window).

### Step 5: Verify Connection
In Claude, ask:
> "Can you list the available MCP tools?"

You should see all your tools listed!

### Step 6: Remove Old Wrapper (Optional)
Once everything works, you can remove the wrapper:
```bash
rm ~/mcp-stdio-wrapper.js
```

---

## 🔧 Advanced Configuration

### Add API Key Authentication
```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse",
      "headers": {
        "X-API-Key": "your_api_key_here"
      }
    }
  }
}
```

### Use Local Development Server
```json
{
  "mcpServers": {
    "seyederick-mcp-local": {
      "url": "http://localhost:7777/sse"
    }
  }
}
```

### Multiple MCP Servers
```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse"
    },
    "local-dev": {
      "url": "http://localhost:7777/sse"
    },
    "other-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/files"]
    }
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Connection failed" in Claude Desktop

**Solution 1**: Check gateway is running
```bash
curl https://link.seyederick.com/health
```

**Solution 2**: Check reverse proxy supports SSE
- Nginx: Ensure `proxy_buffering off;` is set
- Caddy: Ensure `flush_interval -1` is set

**Solution 3**: Check firewall
```bash
# Test from external network
curl -N https://link.seyederick.com/sse
```

### Issue: "Session not found" errors

SSE sessions expire after 10 minutes of inactivity. This is normal - Claude will automatically reconnect.

### Issue: Tools not showing up

Check source status:
```bash
curl https://link.seyederick.com/health | jq .sourceDetails
```

If sources are offline, restart them:
```bash
pm2 restart all
```

### Issue: "Method not found" errors

Your gateway might need restarting to load the new SSE endpoints:
```bash
pm2 restart unified-gateway
# or kill and restart manually
```

---

## 📊 Comparing Both Approaches

| Feature | Wrapper (stdio) | Direct SSE |
|---------|----------------|------------|
| Setup complexity | High (requires wrapper file) | Low (just URL) |
| Dependencies | Node.js required locally | None |
| Portability | Low (per-machine setup) | High (works anywhere) |
| Debugging | Hard (stdio streams) | Easy (HTTP requests) |
| Web client support | No | Yes |
| Firewall friendly | Yes (local) | Yes (HTTP) |
| Performance | Good | Good |
| Maintenance | High | Low |

---

## 🎯 Next Steps

1. ✅ Update gateway with SSE support
2. ✅ Test SSE endpoint with curl
3. ✅ Update Claude Desktop config
4. ✅ Restart Claude
5. ✅ Test tools are accessible
6. ✅ Remove old wrapper file
7. ✅ Share config with team members

---

## 💡 Pro Tips

### Use Environment Variables
Create `.env` with different endpoints:
```bash
# .env
PROD_MCP_URL=https://link.seyederick.com/sse
DEV_MCP_URL=http://localhost:7777/sse
```

### Test Before Deploying
Always test with curl before updating clients:
```bash
# Quick test
curl -N https://link.seyederick.com/sse

# Full test
./lib/mcp/gateway/test-sse.sh https://link.seyederick.com
```

### Monitor Sessions
Check active sessions:
```bash
curl https://link.seyederick.com/health | jq .sessions
```

### Set Up Monitoring
Add health check to your monitoring:
```bash
# Add to cron or monitoring tool
curl -f https://link.seyederick.com/health || alert_ops
```

---

## 🎉 Success!

You've now migrated from a wrapper-based setup to a modern, direct SSE connection!

Your MCP tools are now accessible from:
- 🖥️ Claude Desktop (any machine)
- 🌐 Claude.ai (web version)
- 📱 Mobile clients (future)
- 🔧 Custom integrations
- 🤖 Other AI assistants

No wrapper needed! 🚀

