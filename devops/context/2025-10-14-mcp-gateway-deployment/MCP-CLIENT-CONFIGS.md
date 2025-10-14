# MCP Client Configuration Files (Copy & Paste Ready)

Ready-to-use configuration files for connecting to Vibe-MCP Gateway on port 7777.

---

## 1. Claude Desktop Configuration

### Location: `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)
### Location: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
### Location: `~/.config/Claude/claude_desktop_config.json` (Linux)

```json
{
  "mcpServers": {
    "vibe-mcp-gateway": {
      "url": "http://localhost:7777/mcp",
      "transport": "http",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    },
    "vibe-mcp-sse": {
      "url": "http://localhost:7777/api/v1/events",
      "transport": "sse",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    },
    "vibe-mcp-websocket": {
      "url": "ws://localhost:7777/ws",
      "transport": "websocket",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    }
  }
}
```

### For Remote Access (Replace localhost with your VPS IP/domain):
```json
{
  "mcpServers": {
    "vibe-mcp-gateway": {
      "url": "http://168.231.74.29:7777/mcp",
      "transport": "http",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    },
    "vibe-mcp-sse": {
      "url": "http://168.231.74.29:7777/api/v1/events",
      "transport": "sse",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    },
    "vibe-mcp-websocket": {
      "url": "ws://168.231.74.29:7777/ws",
      "transport": "websocket",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    }
  }
}
```

### With Domain (link.seyederick.com):
```json
{
  "mcpServers": {
    "vibe-mcp-gateway": {
      "url": "https://link.seyederick.com/mcp",
      "transport": "http",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    },
    "vibe-mcp-sse": {
      "url": "https://link.seyederick.com/api/v1/events",
      "transport": "sse",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    },
    "vibe-mcp-websocket": {
      "url": "wss://link.seyederick.com/ws",
      "transport": "websocket",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    }
  }
}
```

---

## 2. Cline (VS Code Extension) Configuration

### Location: VS Code Settings → Cline → MCP Settings

```json
{
  "cline.mcpServers": {
    "vibe-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/client"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:7777/mcp",
        "MCP_API_KEY": "lano_master_key_2024"
      }
    }
  }
}
```

### Or use HTTP transport directly:
```json
{
  "cline.mcpServers": {
    "vibe-mcp-http": {
      "url": "http://localhost:7777/mcp",
      "transport": "http",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    }
  }
}
```

---

## 3. Continue.dev Configuration

### Location: `~/.continue/config.json`

```json
{
  "mcpServers": [
    {
      "name": "vibe-mcp-gateway",
      "url": "http://localhost:7777/mcp",
      "transport": "http",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    }
  ]
}
```

---

## 4. Cursor IDE Configuration

### Location: Cursor Settings → MCP Servers

```json
{
  "mcpServers": {
    "vibe-mcp": {
      "url": "http://localhost:7777/mcp",
      "headers": {
        "x-api-key": "lano_master_key_2024"
      }
    }
  }
}
```

---

## 5. Zed Editor Configuration

### Location: `~/.config/zed/settings.json`

```json
{
  "context_servers": {
    "vibe-mcp": {
      "settings": {
        "url": "http://localhost:7777/mcp",
        "headers": {
          "x-api-key": "lano_master_key_2024"
        }
      }
    }
  }
}
```

---

## 6. Generic MCP Client Configuration

### For any MCP-compatible client:

```json
{
  "name": "vibe-mcp-gateway",
  "version": "2.0.0",
  "serverInfo": {
    "name": "vibe-mcp-unified-gateway",
    "version": "2.0.0"
  },
  "transport": {
    "type": "http",
    "url": "http://localhost:7777/mcp",
    "headers": {
      "Content-Type": "application/json",
      "x-api-key": "lano_master_key_2024"
    }
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": true
  }
}
```

---

## 7. Environment Variables (for CLI tools)

### Bash/Zsh (.bashrc, .zshrc):
```bash
# Vibe-MCP Gateway Configuration
export MCP_SERVER_URL="http://localhost:7777/mcp"
export MCP_SSE_URL="http://localhost:7777/api/v1/events"
export MCP_WS_URL="ws://localhost:7777/ws"
export MCP_API_KEY="lano_master_key_2024"
export MCP_HEALTH_URL="http://localhost:7777/health"

# Helper aliases
alias mcp-health='curl -s $MCP_HEALTH_URL -H "x-api-key: $MCP_API_KEY" | jq'
alias mcp-tools='curl -s -X POST $MCP_SERVER_URL -H "Content-Type: application/json" -H "x-api-key: $MCP_API_KEY" -d '"'"'{"jsonrpc":"2.0","id":1,"method":"tools/list"}'"'"' | jq ".result.tools | length"'
alias mcp-sse='curl -N $MCP_SSE_URL -H "Accept: text/event-stream" -H "x-api-key: $MCP_API_KEY"'
```

### PowerShell (profile.ps1):
```powershell
# Vibe-MCP Gateway Configuration
$env:MCP_SERVER_URL = "http://localhost:7777/mcp"
$env:MCP_SSE_URL = "http://localhost:7777/api/v1/events"
$env:MCP_WS_URL = "ws://localhost:7777/ws"
$env:MCP_API_KEY = "lano_master_key_2024"
$env:MCP_HEALTH_URL = "http://localhost:7777/health"

# Helper functions
function Get-MCPHealth {
    $headers = @{ "x-api-key" = $env:MCP_API_KEY }
    Invoke-RestMethod -Uri $env:MCP_HEALTH_URL -Headers $headers
}

function Get-MCPTools {
    $headers = @{
        "Content-Type" = "application/json"
        "x-api-key" = $env:MCP_API_KEY
    }
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/list"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri $env:MCP_SERVER_URL -Method Post -Headers $headers -Body $body
}
```

---

## 8. Docker Compose Configuration

### docker-compose.yml:
```yaml
version: '3.8'

services:
  mcp-client:
    image: node:20-alpine
    environment:
      - MCP_SERVER_URL=http://host.docker.internal:7777/mcp
      - MCP_API_KEY=lano_master_key_2024
    extra_hosts:
      - "host.docker.internal:host-gateway"
    command: >
      sh -c "npm install -g @modelcontextprotocol/client &&
             mcp connect $$MCP_SERVER_URL --header 'x-api-key: $$MCP_API_KEY'"
```

---

## 9. Nginx Reverse Proxy Configuration

### /etc/nginx/sites-available/mcp-gateway:
```nginx
server {
    listen 80;
    server_name link.seyederick.com;

    # HTTP API
    location /mcp {
        proxy_pass http://localhost:7777/mcp;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:7777/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # SSE Endpoint
    location /api/v1/events {
        proxy_pass http://localhost:7777/api/v1/events;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header X-Accel-Buffering no;
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:7777/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

---

## 10. Quick Connection Test (Copy & Run)

### Test All Channels:
```bash
#!/bin/bash
echo "🔍 Testing Vibe-MCP Gateway on port 7777..."
echo ""

API_KEY="lano_master_key_2024"
HOST="localhost:7777"

echo "✅ 1. Health Check:"
curl -s http://${HOST}/health -H "x-api-key: ${API_KEY}" | jq -r '.status' || echo "❌ Failed"
echo ""

echo "✅ 2. HTTP API (List Tools):"
curl -s -X POST http://${HOST}/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq -r '.result.tools | length' | xargs echo "Tools available:" || echo "❌ Failed"
echo ""

echo "✅ 3. SSE Connection (5 seconds):"
timeout 5 curl -N http://${HOST}/api/v1/events \
  -H "Accept: text/event-stream" \
  -H "x-api-key: ${API_KEY}" 2>&1 | head -5 && echo "✅ SSE Working" || echo "❌ SSE Failed"
echo ""

echo "✅ 4. WebSocket (requires websocat):"
if command -v websocat &> /dev/null; then
    echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
      timeout 3 websocat ws://${HOST}/ws -H="x-api-key: ${API_KEY}" 2>&1 | head -1 && echo "✅ WebSocket Working" || echo "⚠️  WebSocket test timed out"
else
    echo "⚠️  websocat not installed (cargo install websocat)"
fi
echo ""

echo "🎉 All tests complete!"
```

---

## Quick Start Guide

### Step 1: Choose your client (Claude Desktop, Cursor, etc.)
### Step 2: Copy the JSON config for that client
### Step 3: Paste into the appropriate config file location
### Step 4: Restart the client application
### Step 5: Verify connection with the test script

**Available Tools**: 51 total
- 18 from MCP Core (memory, API keys, system)
- 1 from Quick Auth
- 15 from Neon Database Bridge
- 17 from Apple App Store Connect Bridge

**Authentication**: All requests require header `x-api-key: lano_master_key_2024`

**Support**: Check logs with `pm2 logs vibe-mcp`
