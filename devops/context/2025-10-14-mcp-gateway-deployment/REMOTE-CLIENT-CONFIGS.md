# 📱 Remote Client Configurations (Mobile & Web Apps)

For connecting to Vibe-MCP Gateway **remotely** without stdio bridge (mobile apps, web clients, API integrations).

**Gateway URL**: `http://168.231.74.29:7777` (or `https://link.seyederick.com`)
**API Key**: `lano_master_key_2024`

---

## 🌐 Direct HTTP/REST API (Universal - Works Everywhere)

### cURL (Command Line / Shell Scripts):
```bash
# List all tools
curl -X POST http://168.231.74.29:7777/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'

# Call a tool (create memory)
curl -X POST http://168.231.74.29:7777/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "core_create_memory",
      "arguments": {
        "title": "Test Memory",
        "content": "Created from mobile",
        "type": "note",
        "tags": ["mobile", "test"]
      }
    }
  }'

# Health check
curl http://168.231.74.29:7777/health \
  -H "x-api-key: lano_master_key_2024"
```

---

## 📱 Mobile Apps (iOS/Android)

### Swift (iOS):
```swift
import Foundation

class MCPClient {
    let baseURL = "http://168.231.74.29:7777"
    let apiKey = "lano_master_key_2024"

    struct JSONRPCRequest: Codable {
        let jsonrpc = "2.0"
        let id: Int
        let method: String
        let params: [String: Any]?

        enum CodingKeys: String, CodingKey {
            case jsonrpc, id, method, params
        }

        func encode(to encoder: Encoder) throws {
            var container = encoder.container(keyedBy: CodingKeys.self)
            try container.encode(jsonrpc, forKey: .jsonrpc)
            try container.encode(id, forKey: .id)
            try container.encode(method, forKey: .method)
            if let params = params {
                try container.encode(params, forKey: .params)
            }
        }
    }

    func listTools(completion: @escaping (Result<Data, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/mcp") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")

        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            if let data = data {
                completion(.success(data))
            }
        }.resume()
    }

    func callTool(name: String, arguments: [String: Any], completion: @escaping (Result<Data, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/mcp") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")

        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": [
                "name": name,
                "arguments": arguments
            ]
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            if let data = data {
                completion(.success(data))
            }
        }.resume()
    }
}

// Usage
let client = MCPClient()

// List tools
client.listTools { result in
    switch result {
    case .success(let data):
        if let json = try? JSONSerialization.jsonObject(with: data) {
            print("Tools:", json)
        }
    case .failure(let error):
        print("Error:", error)
    }
}

// Create memory
client.callTool(name: "core_create_memory", arguments: [
    "title": "iOS Memory",
    "content": "Created from iPhone",
    "type": "note",
    "tags": ["ios", "mobile"]
]) { result in
    switch result {
    case .success(let data):
        if let json = try? JSONSerialization.jsonObject(with: data) {
            print("Result:", json)
        }
    case .failure(let error):
        print("Error:", error)
    }
}
```

### Kotlin (Android):
```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class MCPClient {
    private val baseURL = "http://168.231.74.29:7777"
    private val apiKey = "lano_master_key_2024"
    private val client = OkHttpClient()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    fun listTools(callback: (String?) -> Unit) {
        val json = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("id", 1)
            put("method", "tools/list")
        }

        val body = json.toString().toRequestBody(JSON)
        val request = Request.Builder()
            .url("$baseURL/mcp")
            .addHeader("x-api-key", apiKey)
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
            }

            override fun onResponse(call: Call, response: Response) {
                callback(response.body?.string())
            }
        })
    }

    fun callTool(name: String, arguments: JSONObject, callback: (String?) -> Unit) {
        val params = JSONObject().apply {
            put("name", name)
            put("arguments", arguments)
        }

        val json = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("id", 2)
            put("method", "tools/call")
            put("params", params)
        }

        val body = json.toString().toRequestBody(JSON)
        val request = Request.Builder()
            .url("$baseURL/mcp")
            .addHeader("x-api-key", apiKey)
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
            }

            override fun onResponse(call: Call, response: Response) {
                callback(response.body?.string())
            }
        })
    }
}

// Usage
val mcpClient = MCPClient()

// List tools
mcpClient.listTools { response ->
    println("Tools: $response")
}

// Create memory
val args = JSONObject().apply {
    put("title", "Android Memory")
    put("content", "Created from Android")
    put("type", "note")
    put("tags", JSONArray(listOf("android", "mobile")))
}

mcpClient.callTool("core_create_memory", args) { response ->
    println("Result: $response")
}
```

---

## 🌊 Server-Sent Events (SSE) - Real-time Updates

### JavaScript (Web/Mobile):
```javascript
// Connect to SSE endpoint
const eventSource = new EventSource(
  'http://168.231.74.29:7777/api/v1/events',
  {
    headers: {
      'x-api-key': 'lano_master_key_2024'
    }
  }
);

// Note: EventSource doesn't support custom headers in browsers
// Use fetch + ReadableStream instead:

async function connectSSE() {
  const response = await fetch('http://168.231.74.29:7777/api/v1/events', {
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
        console.log('Event:', line.slice(7));
      } else if (line.startsWith('data:')) {
        const data = JSON.parse(line.slice(6));
        console.log('Data:', data);

        // Handle different event types
        if (data.type === 'gateway_info') {
          console.log('Gateway:', data.data.gateway);
          console.log('Sources:', data.data.sources);
        }
      }
    }
  }
}

// Start listening
connectSSE();
```

### Python (Requests + SSE):
```python
import requests
import json

def listen_sse():
    url = 'http://168.231.74.29:7777/api/v1/events'
    headers = {
        'Accept': 'text/event-stream',
        'x-api-key': 'lano_master_key_2024'
    }

    response = requests.get(url, headers=headers, stream=True)

    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')

            if line.startswith('event:'):
                event_type = line[7:]
                print(f"Event: {event_type}")
            elif line.startswith('data:'):
                data = json.loads(line[6:])
                print(f"Data: {data}")

# Run
listen_sse()
```

---

## 🔌 WebSocket (Real-time Bidirectional)

### JavaScript (Web/Mobile):
```javascript
const ws = new WebSocket('ws://168.231.74.29:7777/ws');

// Note: WebSocket doesn't support custom headers
// API key should be sent in first message or use query param

ws.onopen = () => {
  console.log('Connected to MCP Gateway');

  // Send MCP initialize
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'mobile-client',
        version: '1.0.0'
      }
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);

  if (message.id === 1) {
    // Initialize response - send initialized notification
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }));

    // Now you can call tools
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    }));
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Python (websockets):
```python
import asyncio
import websockets
import json

async def connect_websocket():
    uri = "ws://168.231.74.29:7777/ws"

    async with websockets.connect(uri) as websocket:
        # Send initialize
        await websocket.send(json.dumps({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "python-client",
                    "version": "1.0.0"
                }
            }
        }))

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

                # List tools
                await websocket.send(json.dumps({
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "tools/list"
                }))

# Run
asyncio.run(connect_websocket())
```

---

## 🌍 Web App (React/Vue/Angular)

### React Hook:
```typescript
import { useState, useEffect } from 'react';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

const useMCPGateway = () => {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(false);

  const baseURL = 'http://168.231.74.29:7777';
  const apiKey = 'lano_master_key_2024';

  const listTools = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list'
        })
      });

      const data = await response.json();
      setTools(data.result.tools);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const callTool = async (name: string, args: any) => {
    try {
      const response = await fetch(`${baseURL}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name,
            arguments: args
          }
        })
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  useEffect(() => {
    listTools();
  }, []);

  return { tools, loading, callTool, listTools };
};

// Usage in component
function App() {
  const { tools, loading, callTool } = useMCPGateway();

  const createMemory = async () => {
    const result = await callTool('core_create_memory', {
      title: 'Web App Memory',
      content: 'Created from React',
      type: 'note',
      tags: ['web', 'react']
    });

    console.log('Created:', result);
  };

  return (
    <div>
      <h1>MCP Gateway - {tools.length} tools</h1>
      {loading ? 'Loading...' : (
        <ul>
          {tools.map(tool => (
            <li key={tool.name}>{tool.name}</li>
          ))}
        </ul>
      )}
      <button onClick={createMemory}>Create Memory</button>
    </div>
  );
}
```

---

## 🔐 Authentication

All requests require the API key header:
```
x-api-key: lano_master_key_2024
```

---

## 🚀 Quick Test (Any Device with curl)

```bash
# From your phone/tablet (using Termux or iSH)
curl -X POST http://168.231.74.29:7777/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: lano_master_key_2024" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'
```

---

## 📱 Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Vibe-MCP Gateway",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "x-api-key",
            "value": "lano_master_key_2024"
          }
        ],
        "url": "http://168.231.74.29:7777/health"
      }
    },
    {
      "name": "List Tools",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "x-api-key",
            "value": "lano_master_key_2024"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/list\"\n}"
        },
        "url": "http://168.231.74.29:7777/mcp"
      }
    },
    {
      "name": "Create Memory",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "x-api-key",
            "value": "lano_master_key_2024"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 2,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"core_create_memory\",\n    \"arguments\": {\n      \"title\": \"Test Memory\",\n      \"content\": \"Created via Postman\",\n      \"type\": \"note\",\n      \"tags\": [\"test\", \"postman\"]\n    }\n  }\n}"
        },
        "url": "http://168.231.74.29:7777/mcp"
      }
    }
  ]
}
```

---

## 🌐 Production URLs (With HTTPS)

If using domain with SSL:

**Base URL**: `https://link.seyederick.com`
**HTTP API**: `https://link.seyederick.com/mcp`
**SSE**: `https://link.seyederick.com/api/v1/events`
**WebSocket**: `wss://link.seyederick.com/ws`

Replace all `http://168.231.74.29:7777` with `https://link.seyederick.com` in examples above.

---

**Gateway**: Vibe-MCP Unified Gateway v2.0.0
**Tools**: 51 total (18 Core + 1 Auth + 15 Neon + 17 AppStore)
**Protocols**: HTTP/REST, SSE, WebSocket
**Auth**: API Key header required
**Status**: ✅ Production Ready for Remote Access
