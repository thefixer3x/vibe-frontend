# Remote MCP Configuration Guide

Your MCP gateway now supports **Server-Sent Events (SSE)** protocol for remote access without wrappers!

## 🔧 Configuration for Different Clients

### 1. Claude Desktop (Recommended)

**Location**: `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)  
**Location**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse"
    }
  }
}
```

**Note**: The `/sse` endpoint is required for Claude Desktop. It won't work with just the base URL.

### 2. Cursor IDE

**Location**: `.cursor/mcp.json` in your project root

```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse",
      "transport": "sse"
    }
  }
}
```

### 3. Cline (VSCode Extension)

**Location**: VSCode Settings → Extensions → Cline

```json
{
  "cline.mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse"
    }
  }
}
```

### 4. Custom MCP Client (JavaScript/TypeScript)

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const transport = new SSEClientTransport(
  new URL('https://link.seyederick.com/sse')
);

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Call a tool
const result = await client.callTool({
  name: 'core_some_tool',
  arguments: { /* your args */ }
});
```

## 🌐 Available Protocols

Your gateway now supports **three** protocols:

| Protocol | Endpoint | Use Case |
|----------|----------|----------|
| **SSE** | `https://link.seyederick.com/sse` | Remote clients (Claude Desktop, Cursor) |
| **WebSocket** | `wss://link.seyederick.com/ws` | Real-time bidirectional communication |
| **HTTP/JSON-RPC** | `https://link.seyederick.com/mcp` | Direct API calls, testing with curl |

## 🧪 Testing Your SSE Connection

### Test with curl:

```bash
# 1. Open SSE stream in one terminal
curl -N https://link.seyederick.com/sse

# 2. Send a message in another terminal (use sessionId from step 1)
curl -X POST https://link.seyederick.com/messages \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_1234567890_abc123",
    "method": "tools/list",
    "id": 1
  }'
```

### Test initialization:

```bash
# Get SSE stream (keep this running)
curl -N "https://link.seyederick.com/sse?sessionId=test123"

# In another terminal, initialize
curl -X POST https://link.seyederick.com/messages \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "method": "initialize",
    "id": 1,
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    }
  }'
```

## 🔐 API Key Authentication

If you need API key authentication, add it to the headers:

```bash
curl -N https://link.seyederick.com/sse \
  -H "X-API-Key: your_api_key_here"
```

For Claude Desktop config with API key:

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

## 🚀 Deploying to Production

Make sure your reverse proxy (nginx/caddy) supports SSE:

### Nginx Configuration:

```nginx
location /sse {
    proxy_pass http://localhost:7777;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_set_header X-Accel-Buffering no;
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding off;
    proxy_read_timeout 86400s;
}

location /messages {
    proxy_pass http://localhost:7777;
    proxy_http_version 1.1;
}
```

### Caddy Configuration:

```caddy
link.seyederick.com {
    reverse_proxy /sse localhost:7777 {
        flush_interval -1
    }
    
    reverse_proxy /messages localhost:7777
    reverse_proxy localhost:7777
}
```

## ✅ Verification

Check if everything is working:

```bash
# 1. Check health
curl https://link.seyederick.com/health

# 2. Verify SSE endpoint
curl -N https://link.seyederick.com/sse

# 3. Check tool list
curl -X POST https://link.seyederick.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## 🎯 Benefits of SSE Transport

- ✅ **No wrapper needed** - Direct URL configuration
- ✅ **Firewall friendly** - Uses standard HTTP/HTTPS
- ✅ **Automatic reconnection** - Built into SSE protocol
- ✅ **Real-time updates** - Server can push notifications
- ✅ **Works with Claude.ai** - Compatible with web version
- ✅ **Cross-platform** - Works on any OS without local setup

## 🐛 Troubleshooting

### "Session not found" error
- SSE sessions expire after 10 minutes of inactivity
- Reconnect by opening a new SSE stream

### "Connection refused" error
- Check if gateway is running: `curl https://link.seyederick.com/health`
- Verify firewall allows outbound HTTPS

### Tools not showing up
- Check source status: `curl https://link.seyederick.com/health | jq .sourceDetails`
- Restart gateway to refresh connections

### Claude Desktop not connecting
- Make sure you're using `/sse` endpoint, not base URL
- Check Claude logs: `~/Library/Logs/Claude/` (Mac)
- Restart Claude Desktop after config change

