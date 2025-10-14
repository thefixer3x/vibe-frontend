# SSE Client Configuration Examples

Complete configuration examples for connecting to the Vibe-MCP Gateway on port 7777 using different transport channels.

## Server Information
- **Host**: `localhost` (or your VPS IP/domain)
- **Port**: `7777`
- **API Key**: `lano_master_key_2024`
- **Gateway**: vibe-mcp-unified-gateway v2.0.0
- **Tools Available**: 51 tools from 4 sources

---

## 1. Server-Sent Events (SSE)

### cURL (Command Line)
```bash
# Basic SSE connection with 30s heartbeat
curl -N http://localhost:7777/api/v1/events \
  -H "Accept: text/event-stream" \
  -H "x-api-key: lano_master_key_2024"

# With timeout (60 seconds)
curl -N http://localhost:7777/api/v1/events \
  -H "Accept: text/event-stream" \
  -H "x-api-key: lano_master_key_2024" \
  --max-time 60
```

### JavaScript/Node.js (EventSource)
```javascript
// Note: EventSource doesn't support custom headers, use fetch instead
const response = await fetch('http://localhost:7777/api/v1/events', {
  headers: {
    'Accept': 'text/event-stream',
    'x-api-key': 'lano_master_key_2024'
  }
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('event:')) {
      console.log('Event type:', line.slice(7));
    } else if (line.startsWith('data:')) {
      const data = JSON.parse(line.slice(6));
      console.log('Event data:', data);
    }
  }
}
```

### JavaScript/Node.js (eventsource library)
```javascript
const EventSource = require('eventsource');

const eventSource = new EventSource('http://localhost:7777/api/v1/events', {
  headers: {
    'x-api-key': 'lano_master_key_2024'
  }
});

eventSource.addEventListener('connected', (e) => {
  const data = JSON.parse(e.data);
  console.log('Connected:', data);
});

eventSource.addEventListener('message', (e) => {
  const data = JSON.parse(e.data);
  console.log('Message:', data);
});

eventSource.addEventListener('heartbeat', (e) => {
  const data = JSON.parse(e.data);
  console.log('Heartbeat:', data.timestamp);
});

eventSource.addEventListener('tools_update', (e) => {
  const data = JSON.parse(e.data);
  console.log('Tools update:', data.totalTools, 'tools available');
});

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};
```

### Python (sseclient-py)
```python
import sseclient
import requests
import json

headers = {
    'Accept': 'text/event-stream',
    'x-api-key': 'lano_master_key_2024'
}

response = requests.get('http://localhost:7777/api/v1/events',
                       headers=headers,
                       stream=True)

client = sseclient.SSEClient(response)

for event in client.events():
    print(f"Event: {event.event}")
    data = json.loads(event.data)
    print(f"Data: {data}")
```

### Python (httpx)
```python
import httpx
import json

async def listen_sse():
    async with httpx.AsyncClient() as client:
        async with client.stream(
            'GET',
            'http://localhost:7777/api/v1/events',
            headers={
                'Accept': 'text/event-stream',
                'x-api-key': 'lano_master_key_2024'
            },
            timeout=None
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith('event:'):
                    event_type = line[7:]
                    print(f"Event: {event_type}")
                elif line.startswith('data:'):
                    data = json.loads(line[6:])
                    print(f"Data: {data}")

# Run
import asyncio
asyncio.run(listen_sse())
```

---

## 2. WebSocket

### cURL (websocat)
```bash
# Install websocat first: cargo install websocat
# or download from: https://github.com/vi/websocat/releases

# Connect to WebSocket
websocat ws://localhost:7777/ws \
  -H="x-api-key: lano_master_key_2024"

# Send MCP initialize request
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}' | \
  websocat ws://localhost:7777/ws -H="x-api-key: lano_master_key_2024"
```

### JavaScript/Node.js (ws library)
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:7777/ws', {
  headers: {
    'x-api-key': 'lano_master_key_2024'
  }
});

ws.on('open', () => {
  console.log('WebSocket connected');

  // Send MCP initialize
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'node-test-client',
        version: '1.0.0'
      }
    }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);

  if (message.id === 1) {
    // Initialize response received, send initialized notification
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }));
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket closed');
});
```

### JavaScript/Browser
```javascript
const ws = new WebSocket('ws://localhost:7777/ws');

ws.onopen = () => {
  console.log('Connected');

  // Send MCP initialize
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'browser-client',
        version: '1.0.0'
      }
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('Error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Python (websockets)
```python
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:7777/ws"
    headers = {
        "x-api-key": "lano_master_key_2024"
    }

    async with websockets.connect(uri, extra_headers=headers) as websocket:
        # Send initialize
        init_message = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "python-test-client",
                    "version": "1.0.0"
                }
            }
        }
        await websocket.send(json.dumps(init_message))

        # Receive messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

            if data.get('id') == 1:
                # Send initialized notification
                await websocket.send(json.dumps({
                    "jsonrpc": "2.0",
                    "method": "notifications/initialized"
                }))

# Run
asyncio.run(test_websocket())
```

---

## 3. HTTP REST API

### cURL (List Tools)
```bash
# List all available tools
curl -X POST http://localhost:7777/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### cURL (Call Tool)
```bash
# Example: Call create_memory tool
curl -X POST http://localhost:7777/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "create_memory",
      "arguments": {
        "title": "Test Memory",
        "content": "This is a test memory created via HTTP",
        "type": "note",
        "tags": ["test", "http"]
      }
    }
  }'
```

### JavaScript/Node.js (axios)
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:7777',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'lano_master_key_2024'
  }
});

// List tools
async function listTools() {
  const response = await client.post('/mcp', {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  });
  return response.data;
}

// Call a tool
async function callTool(name, args) {
  const response = await client.post('/mcp', {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: name,
      arguments: args
    }
  });
  return response.data;
}

// Example usage
(async () => {
  const tools = await listTools();
  console.log('Available tools:', tools.result.tools.length);

  const result = await callTool('create_memory', {
    title: 'Test Memory',
    content: 'Created via Node.js',
    type: 'note',
    tags: ['test']
  });
  console.log('Tool result:', result);
})();
```

### JavaScript/Browser (fetch)
```javascript
async function listTools() {
  const response = await fetch('http://localhost:7777/mcp', {
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
  return await response.json();
}

async function callTool(name, args) {
  const response = await fetch('http://localhost:7777/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'lano_master_key_2024'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name, arguments: args }
    })
  });
  return await response.json();
}
```

### Python (requests)
```python
import requests
import json

class MCPClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key
        }
        self.request_id = 0

    def list_tools(self):
        self.request_id += 1
        response = requests.post(
            f'{self.base_url}/mcp',
            headers=self.headers,
            json={
                'jsonrpc': '2.0',
                'id': self.request_id,
                'method': 'tools/list'
            }
        )
        return response.json()

    def call_tool(self, name, arguments):
        self.request_id += 1
        response = requests.post(
            f'{self.base_url}/mcp',
            headers=self.headers,
            json={
                'jsonrpc': '2.0',
                'id': self.request_id,
                'method': 'tools/call',
                'params': {
                    'name': name,
                    'arguments': arguments
                }
            }
        )
        return response.json()

# Usage
client = MCPClient('http://localhost:7777', 'lano_master_key_2024')

# List tools
tools = client.list_tools()
print(f"Available tools: {len(tools['result']['tools'])}")

# Call a tool
result = client.call_tool('create_memory', {
    'title': 'Test Memory',
    'content': 'Created via Python',
    'type': 'note',
    'tags': ['test', 'python']
})
print(f"Result: {result}")
```

---

## 4. Health Check

### cURL
```bash
# Check gateway health
curl http://localhost:7777/health \
  -H "x-api-key: lano_master_key_2024"
```

### Response
```json
{
  "status": "healthy",
  "gateway": "vibe-mcp-unified-gateway",
  "version": "2.0.0",
  "port": 7777,
  "uptime": 3600,
  "sources": {
    "mcp-core": "healthy",
    "quick-auth": "healthy",
    "neon-bridge": "healthy",
    "appstore-bridge": "healthy"
  },
  "tools": {
    "total": 51,
    "by_source": {
      "mcp-core": 18,
      "quick-auth": 1,
      "neon-bridge": 15,
      "appstore-bridge": 17
    }
  }
}
```

---

## Environment Variables for Remote Access

If connecting from a remote client (not localhost):

```bash
# Replace localhost with your VPS IP or domain
export MCP_HOST="168.231.74.29"  # Your VPS IP
# or
export MCP_HOST="link.seyederick.com"  # Your domain

# Then use in URLs
# SSE: http://${MCP_HOST}:7777/api/v1/events
# WS:  ws://${MCP_HOST}:7777/ws
# HTTP: http://${MCP_HOST}:7777/mcp
```

---

## Testing All Channels

### Quick Test Script (Bash)
```bash
#!/bin/bash
API_KEY="lano_master_key_2024"
HOST="localhost:7777"

echo "=== Testing HTTP REST API ==="
curl -s -X POST http://${HOST}/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'

echo -e "\n=== Testing Health Check ==="
curl -s http://${HOST}/health \
  -H "x-api-key: ${API_KEY}" | jq '.status'

echo -e "\n=== Testing SSE (10 seconds) ==="
timeout 10 curl -N http://${HOST}/api/v1/events \
  -H "Accept: text/event-stream" \
  -H "x-api-key: ${API_KEY}" &
sleep 11
echo "SSE test complete"

echo -e "\n=== Testing WebSocket ==="
# Requires websocat: cargo install websocat
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  timeout 5 websocat ws://${HOST}/ws -H="x-api-key: ${API_KEY}" 2>/dev/null || echo "WebSocket test timed out"
```

---

## Available Tools (51 total)

### MCP Core (18 tools)
- Memory: `create_memory`, `search_memories`, `get_memory`, `update_memory`, `delete_memory`, `list_memories`, `search_lanonasis_docs`
- API Keys: `create_api_key`, `list_api_keys`, `rotate_api_key`, `delete_api_key`
- System: `get_health_status`, `get_auth_status`, `get_organization_info`
- Business: `create_project`, `list_projects`, `get_config`, `set_config`

### Quick Auth (1 tool)
- `quick_authenticate`

### Neon Bridge (15 tools)
- Database operations, migrations, branches, etc.

### App Store Connect Bridge (17 tools)
- App management, TestFlight, analytics, etc.

---

## Troubleshooting

### Connection Refused
```bash
# Check if service is running
pm2 status vibe-mcp

# Check logs
pm2 logs vibe-mcp --lines 50

# Restart if needed
pm2 restart vibe-mcp
```

### Authentication Failed
Make sure you include the API key header:
```
x-api-key: lano_master_key_2024
```

### SSE Not Streaming
- Ensure `Accept: text/event-stream` header is set
- Disable nginx buffering if using reverse proxy
- Use `-N` flag with cURL for no buffering

### WebSocket Disconnects Immediately
- Send MCP initialize handshake immediately after connecting
- Follow with `notifications/initialized` after receiving initialize response

---

## Production Deployment

For production use with your domain `link.seyederick.com`:

```javascript
// Production config
const MCP_CONFIG = {
  http: 'https://link.seyederick.com/mcp',
  ws: 'wss://link.seyederick.com/ws',
  sse: 'https://link.seyederick.com/api/v1/events',
  apiKey: process.env.MCP_API_KEY || 'lano_master_key_2024'
};
```

Make sure your nginx configuration forwards WebSocket and SSE correctly:
```nginx
location /ws {
    proxy_pass http://localhost:7777;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

location /api/v1/events {
    proxy_pass http://localhost:7777;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
    proxy_buffering off;
    proxy_cache off;
}
```
