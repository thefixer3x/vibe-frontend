# Unified MCP Gateway

A production-ready Model Context Protocol (MCP) gateway that aggregates multiple MCP sources and provides remote access via SSE, WebSocket, and HTTP protocols.

## 🌟 Features

- **Multi-Protocol Support**: SSE, WebSocket, and HTTP/JSON-RPC
- **Remote Access**: No wrapper needed - direct URL configuration
- **Source Aggregation**: Combines multiple MCP tools into one endpoint
- **Production Ready**: Health checks, session management, auto-reconnection
- **Secure**: API key authentication, CORS protection
- **Observable**: Logging, metrics, session tracking

## 🚀 Quick Start

### 1. Start the Gateway

```bash
cd /root/vibe-frontend
node lib/mcp/gateway/unified-gateway.ts

# Or with PM2
pm2 start lib/mcp/gateway/unified-gateway.ts --name unified-gateway
```

### 2. Configure Your Client

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse"
    }
  }
}
```

### 3. Restart and Test

Restart Claude Desktop and ask:
> "What MCP tools are available?"

Done! 🎉

See [QUICK_START.md](QUICK_START.md) for more.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | Get started in 2 minutes |
| [REMOTE_CONFIG.md](REMOTE_CONFIG.md) | Complete configuration guide for all clients |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Migrate from wrapper to direct SSE |
| [test-sse.sh](test-sse.sh) | Automated test suite |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified MCP Gateway                      │
│                 (ports 7777 primary, 7778 fallback)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Protocols:                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐             │
│  │   SSE    │  │WebSocket │  │  HTTP/JSON   │             │
│  │  /sse    │  │   /ws    │  │    /mcp      │             │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘             │
│       └─────────────┴────────────────┘                     │
│                      │                                      │
│              ┌───────▼────────┐                            │
│              │  Tool Router   │                            │
│              └───────┬────────┘                            │
│                      │                                      │
│       ┌──────────────┼──────────────┐                     │
│       │              │              │                     │
│  ┌────▼────┐   ┌────▼────┐   ┌────▼────┐                │
│  │  Core   │   │  Neon   │   │AppStore │                │
│  │  (18)   │   │  (15)   │   │  (17)   │                │
│  └─────────┘   └─────────┘   └─────────┘                │
│                                                             │
│  Total: 50+ Tools Available                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Supported Protocols

### 1. SSE (Server-Sent Events) - **Recommended for Remote Access**
- **Endpoint**: `https://link.seyederick.com/sse`
- **Use Case**: Claude Desktop, Cursor, web clients
- **Benefits**: Firewall-friendly, auto-reconnect, no wrapper needed

### 2. WebSocket
- **Endpoint**: `wss://link.seyederick.com/ws`
- **Use Case**: Real-time bidirectional communication
- **Benefits**: Low latency, persistent connection

### 3. HTTP/JSON-RPC
- **Endpoint**: `https://link.seyederick.com/mcp`
- **Use Case**: Direct API calls, testing, integrations
- **Benefits**: Simple, stateless, easy to debug

---

## 📡 Available Sources

| Source | Tools | Type | Status |
|--------|-------|------|--------|
| **Core** | 18 | Bridge | ✅ Online |
| **Neon** | 15 | Bridge | ✅ Online |
| **App Store Connect** | 17 | Bridge | ✅ Online |
| **Quick Auth** | Auth | HTTP | 🟡 Auth Only |

Check current status:
```bash
curl https://link.seyederick.com/health | jq .sourceDetails
```

---

## 🔐 Security

### API Key Authentication

**Environment Variables** (`.env.local`):
```env
MASTER_API_KEY=your_master_key
VIBE_API_KEY=your_vibe_key
```

**Client Configuration**:
```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse",
      "headers": {
        "X-API-Key": "your_api_key"
      }
    }
  }
}
```

### CORS Configuration

Allowed origins (edit in `unified-gateway.ts`):
- `https://vibe.seyederick.com`
- `https://link.seyederick.com`
- `https://dashboard.lanonasis.com`
- `http://localhost:3000`
- `http://localhost:5173`

---

## 🧪 Testing

### Automated Test Suite

```bash
cd /root/vibe-frontend/lib/mcp/gateway

# Test production
./test-sse.sh https://link.seyederick.com

# Test local
./test-sse.sh http://localhost:7777
```

### Manual Testing

```bash
# 1. Health check
curl https://link.seyederick.com/health

# 2. SSE connection
curl -N https://link.seyederick.com/sse

# 3. List tools (HTTP)
curl -X POST https://link.seyederick.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## 🔄 Session Management

- **SSE Sessions**: Auto-expire after 10 minutes of inactivity
- **Keep-Alive**: Pings every 30 seconds
- **Cleanup**: Stale sessions removed every 5 minutes
- **Reconnection**: Automatic with exponential backoff

Check active sessions:
```bash
curl https://link.seyederick.com/health | jq .sessions
```

---

## 📊 Monitoring

### Health Endpoint

```bash
curl https://link.seyederick.com/health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "seyederick-mcp",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "ports": {
    "primary": 7777,
    "fallback": 7778
  },
  "protocols": {
    "http": "http://localhost:7777/mcp",
    "websocket": {
      "primary": "ws://localhost:7777/ws",
      "fallback": "ws://localhost:7778/ws"
    },
    "sse": "http://localhost:7777/sse"
  },
  "sessions": {
    "active": 3,
    "websocket": 1
  },
  "sources": 4,
  "activeSources": 3,
  "sourceDetails": { ... }
}
```

### Logs

**File**: `/var/log/mcp-gateway.log`

**Console**: Real-time with `winston`

---

## 🚀 Deployment

### Environment Variables

```env
# Port Configuration
PRIMARY_PORT=7777
FALLBACK_PORT=7778
ENABLE_PRIMARY=true
ENABLE_FALLBACK=true

# API Keys
MASTER_API_KEY=your_master_key
VIBE_API_KEY=your_vibe_key

# External Services
NEON_API_KEY=your_neon_key
APP_STORE_CONNECT_KEY=your_appstore_key
```

### Reverse Proxy

**Nginx** (`/etc/nginx/sites-available/link.seyederick.com`):
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

location / {
    proxy_pass http://localhost:7777;
    proxy_http_version 1.1;
}
```

**Caddy** (`Caddyfile`):
```caddy
link.seyederick.com {
    reverse_proxy /sse localhost:7777 {
        flush_interval -1
    }
    reverse_proxy localhost:7777
}
```

### Process Manager

```bash
# PM2
pm2 start lib/mcp/gateway/unified-gateway.ts --name unified-gateway
pm2 save
pm2 startup

# Systemd
sudo cp mcp-gateway.service /etc/systemd/system/
sudo systemctl enable mcp-gateway
sudo systemctl start mcp-gateway
```

---

## 🐛 Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| Connection refused | `curl https://link.seyederick.com/health` | Start gateway |
| Session not found | Normal after 10min idle | Auto-reconnects |
| Method not found | Endpoint loaded? | Restart gateway |
| Tools missing | Source status? | Check `/health` |
| Port in use | Another process? | Change port or kill process |

**View Logs**:
```bash
# Real-time
tail -f /var/log/mcp-gateway.log

# PM2
pm2 logs unified-gateway

# Filter errors
grep ERROR /var/log/mcp-gateway.log
```

---

## 🎯 Best Practices

1. **Use SSE for remote clients** - Most compatible and reliable
2. **Monitor `/health` endpoint** - Set up alerts for downtime
3. **Rotate logs regularly** - Prevent disk space issues
4. **Use API keys in production** - Don't expose publicly without auth
5. **Test before deploying** - Run test suite on every change
6. **Keep connections stateless** - Don't rely on long-lived sessions

---

## 📦 Dependencies

- `express` - Web framework
- `cors` - CORS middleware
- `winston` - Logging
- `axios` - HTTP client
- `ws` - WebSocket support
- `dotenv` - Environment variables

---

## 🤝 Contributing

1. Test your changes: `./test-sse.sh`
2. Check for errors: `npm run lint`
3. Update documentation if needed
4. Create PR with description

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- **Production**: https://link.seyederick.com
- **Health Check**: https://link.seyederick.com/health
- **SSE Endpoint**: https://link.seyederick.com/sse
- **WebSocket**: wss://link.seyederick.com/ws

---

## 💬 Support

- **Issues**: Create an issue in the repository
- **Documentation**: Check the docs/ folder
- **Logs**: `/var/log/mcp-gateway.log`

---

**Built with ❤️ for the Lanonasis Control Room**

Last Updated: January 2025
Version: 2.0.0

