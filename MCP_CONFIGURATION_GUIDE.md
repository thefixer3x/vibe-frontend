# MCP Configuration Guide - Vibe Frontend

**Created:** August 21, 2025  
**Version:** 1.0  
**Last Updated:** August 21, 2025

## Overview

Vibe is a universal API warehouse and VPS management platform that integrates with MCP (Model Context Protocol) services for AI-powered memory management and context-aware interactions. This guide provides comprehensive configuration instructions for integrating MCP services into the Vibe frontend application.

## Architecture Overview

### MCP Integration Points
- **Memory System:** Vector-based knowledge storage and retrieval
- **AI Orchestrator:** Context-aware AI interactions (planned)
- **API Management:** Universal API integration with memory context
- **VPS Monitoring:** Server management with intelligent insights
- **Real-time Updates:** WebSocket and SSE connections for live data

### Integration Modes
```
Local Development:
├── Direct WebSocket - ws://localhost:9083/mcp (via Onasis-CORE)
├── Enhanced Tools - 17 tools including memory, API keys, system
├── Vector Search - Semantic memory search and retrieval
└── Real-time Sync - Live memory updates and notifications

Production:
├── HTTPS API Gateway - https://mcp.lanonasis.com
├── API Key Auth - Secure token-based authentication
├── CDN Distribution - Global edge network
└── High Availability - Multi-region deployment
```

## Quick Start Configuration

### 1. Environment Setup

Create or update `.env.local`:

```bash
# MCP Configuration - Auto-detection for dev/prod
NEXT_PUBLIC_MCP_MODE=auto
NEXT_PUBLIC_MCP_SERVER_URL=ws://localhost:9083/mcp
NEXT_PUBLIC_GATEWAY_URL=https://mcp.lanonasis.com

# Memory Service Authentication
NEXT_PUBLIC_MEMORY_API_KEY=your_memory_api_key_here

# Development Configuration
NODE_ENV=development

# Database (Neon PostgreSQL)
POSTGRES_URL=your_postgres_connection_string_here

# Authentication (Currently Disabled)
SINGLE_USER_MODE=true
BACKUP_USER_EMAIL=info@lanonasis.com
BACKUP_USER_PASSWORD=admin123

# Stripe Integration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Add MCP client dependencies (if not already present)
bun add @modelcontextprotocol/sdk ws
```

### 3. Verify MCP Integration

```bash
# Start development server
bun run dev

# Test MCP connection
curl http://localhost:3000/api/memory/test

# Check memory operations
curl http://localhost:3000/api/memory
```

## Integration Methods

### Method 1: Embedded MCP Client (Recommended)

The Vibe frontend includes a comprehensive MCP client that automatically detects and connects to available services.

#### Client Configuration
```typescript
// lib/mcp/client.ts - Already implemented

import { getMCPClient } from '@/lib/mcp/client';

// Auto-configured client
const mcpClient = getMCPClient({
  mode: 'auto', // Automatically detects local vs remote
  localServerUrl: 'ws://localhost:9083/mcp',
  remoteApiUrl: 'https://mcp.lanonasis.com',
  apiKey: process.env.NEXT_PUBLIC_MEMORY_API_KEY
});

// Connect and use
async function useMemoryService() {
  try {
    const connected = await mcpClient.connect();
    if (!connected) {
      console.warn('MCP service not available');
      return;
    }

    // Create memory
    const result = await mcpClient.callTool({
      name: 'memory_create_memory',
      arguments: {
        title: 'API Integration Notes',
        content: 'Important details about API configuration...',
        memory_type: 'knowledge',
        tags: ['api', 'integration', 'notes']
      }
    });

    console.log('Memory created:', result.data);
  } catch (error) {
    console.error('Memory operation failed:', error);
  }
}
```

#### React Hook Integration
```typescript
// lib/hooks/useMCP.ts - Custom hook for MCP operations

import { useState, useEffect } from 'react';
import { getMCPClient } from '@/lib/mcp/client';

export function useMCP() {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState('disconnected');

  useEffect(() => {
    const mcpClient = getMCPClient();
    
    const connectToMCP = async () => {
      try {
        const isConnected = await mcpClient.connect();
        setConnected(isConnected);
        setMode(mcpClient.getConnectionMode());
        setClient(mcpClient);
      } catch (error) {
        console.error('MCP connection failed:', error);
        setConnected(false);
        setMode('disconnected');
      }
    };

    connectToMCP();

    return () => {
      mcpClient.disconnect();
    };
  }, []);

  const createMemory = async (data) => {
    if (!connected || !client) {
      throw new Error('MCP not connected');
    }

    return await client.callTool({
      name: 'memory_create_memory',
      arguments: data
    });
  };

  const searchMemories = async (query, options = {}) => {
    if (!connected || !client) {
      throw new Error('MCP not connected');
    }

    return await client.callTool({
      name: 'memory_search_memories',
      arguments: { query, ...options }
    });
  };

  const getMemory = async (id) => {
    if (!connected || !client) {
      throw new Error('MCP not connected');
    }

    return await client.callTool({
      name: 'memory_get_memory',
      arguments: { _memory_id: id }
    });
  };

  return {
    connected,
    mode,
    createMemory,
    searchMemories,
    getMemory,
    client
  };
}
```

### Method 2: Component Integration

#### Memory Management Component
```typescript
// components/memory/MemoryManager.tsx

'use client';

import { useState, useEffect } from 'react';
import { useMCP } from '@/lib/hooks/useMCP';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export function MemoryManager() {
  const { connected, mode, createMemory, searchMemories } = useMCP();
  const [memories, setMemories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemory, setNewMemory] = useState({
    title: '',
    content: '',
    tags: []
  });

  const handleCreateMemory = async () => {
    if (!connected) {
      alert('MCP service not connected');
      return;
    }

    try {
      const result = await createMemory({
        title: newMemory.title,
        content: newMemory.content,
        memory_type: 'knowledge',
        tags: newMemory.tags
      });

      if (result.success) {
        setNewMemory({ title: '', content: '', tags: [] });
        handleSearch(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to create memory:', error);
    }
  };

  const handleSearch = async () => {
    if (!connected) return;

    try {
      const result = await searchMemories(searchQuery || 'recent memories', {
        limit: 10,
        threshold: 0.5
      });

      if (result.success) {
        setMemories(result.data.memories || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  useEffect(() => {
    if (connected) {
      handleSearch();
    }
  }, [connected]);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          connected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-sm">
          MCP Status: {connected ? `Connected (${mode})` : 'Disconnected'}
        </span>
      </div>

      {/* Create Memory */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Create Memory</h3>
        <div className="space-y-3">
          <Input
            placeholder="Memory title..."
            value={newMemory.title}
            onChange={(e) => setNewMemory(prev => ({ ...prev, title: e.target.value }))}
          />
          <Textarea
            placeholder="Memory content..."
            value={newMemory.content}
            onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
            rows={3}
          />
          <Button 
            onClick={handleCreateMemory}
            disabled={!connected || !newMemory.title || !newMemory.content}
          >
            Create Memory
          </Button>
        </div>
      </div>

      {/* Search Memories */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Search Memories</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleSearch} disabled={!connected}>
            Search
          </Button>
        </div>
      </div>

      {/* Memory List */}
      <div className="space-y-3">
        <h3 className="font-semibold">Recent Memories ({memories.length})</h3>
        {memories.map((memory, index) => (
          <div key={memory.id || index} className="border rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{memory.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {memory.content?.substring(0, 100)}...
                </p>
                <div className="flex gap-1 mt-2">
                  {memory.tags?.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              {memory.similarity_score && (
                <Badge variant="outline">
                  {(memory.similarity_score * 100).toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### AI Orchestrator Integration (Planned)
```typescript
// components/orchestrator/AIOrchestrator.tsx

'use client';

import { useState } from 'react';
import { useMCP } from '@/lib/hooks/useMCP';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function AIOrchestrator() {
  const { connected, searchMemories } = useMCP();
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState([]);
  const [response, setResponse] = useState('');

  const handleEnhancePrompt = async () => {
    if (!connected || !prompt) return;

    try {
      // Search for relevant context
      const contextResult = await searchMemories(prompt, {
        limit: 5,
        threshold: 0.7
      });

      if (contextResult.success) {
        setContext(contextResult.data.memories || []);
        
        // Here you would integrate with your AI service
        // The context provides relevant memories for the prompt
        const enhancedPrompt = `
Context from memory:
${contextResult.data.memories.map(m => `- ${m.title}: ${m.content}`).join('\n')}

User Prompt: ${prompt}
        `;
        
        // Send to AI service and get response
        // setResponse(aiResponse);
      }
    } catch (error) {
      console.error('Context enhancement failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">AI Orchestrator with Memory Context</h3>
        <p className="text-sm text-gray-600">
          Leverage your memory database for context-aware AI interactions
        </p>
      </div>

      <Textarea
        placeholder="Enter your prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
      />

      <Button 
        onClick={handleEnhancePrompt}
        disabled={!connected || !prompt}
      >
        Enhance with Memory Context
      </Button>

      {context.length > 0 && (
        <div className="border rounded-lg p-3">
          <h4 className="font-medium mb-2">Retrieved Context ({context.length})</h4>
          {context.map((item, index) => (
            <div key={index} className="text-sm bg-gray-50 p-2 rounded mb-2">
              <strong>{item.title}</strong>: {item.content.substring(0, 100)}...
            </div>
          ))}
        </div>
      )}

      {response && (
        <div className="border rounded-lg p-3">
          <h4 className="font-medium mb-2">AI Response</h4>
          <div className="text-sm">{response}</div>
        </div>
      )}
    </div>
  );
}
```

### Method 3: API Route Integration

#### Memory API Routes
```typescript
// app/api/memory/route.ts - Already implemented

import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp/client';

const mcpClient = getMCPClient();

export async function GET() {
  try {
    const connected = await mcpClient.connect();
    if (!connected) {
      return NextResponse.json(
        { error: 'MCP service unavailable' },
        { status: 503 }
      );
    }

    const result = await mcpClient.callTool({
      name: 'memory_list_memories',
      arguments: { limit: 20 }
    });

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to list memories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const connected = await mcpClient.connect();
    if (!connected) {
      return NextResponse.json(
        { error: 'MCP service unavailable' },
        { status: 503 }
      );
    }

    const result = await mcpClient.callTool({
      name: 'memory_create_memory',
      arguments: {
        title: body.title,
        content: body.content,
        memory_type: body.memory_type || 'knowledge',
        tags: body.tags || [],
        topic_id: body.topic_id
      }
    });

    if (result.success) {
      return NextResponse.json(result.data, { status: 201 });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    );
  }
}
```

#### Search API Route
```typescript
// app/api/memory/search/route.ts - Already implemented

import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp/client';

const mcpClient = getMCPClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const connected = await mcpClient.connect();
    if (!connected) {
      return NextResponse.json(
        { error: 'MCP service unavailable' },
        { status: 503 }
      );
    }

    const result = await mcpClient.callTool({
      name: 'memory_search_memories',
      arguments: {
        query: body.query,
        limit: body.limit || 10,
        threshold: body.threshold || 0.7,
        memory_type: body.memory_type,
        tags: body.tags
      }
    });

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

## Configuration Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_MCP_MODE` | Connection mode (auto/local/remote) | `auto` | No |
| `NEXT_PUBLIC_MCP_SERVER_URL` | Local MCP WebSocket URL | `ws://localhost:9083/mcp` | No |
| `NEXT_PUBLIC_GATEWAY_URL` | Remote MCP API URL | `https://mcp.lanonasis.com` | No |
| `NEXT_PUBLIC_MEMORY_API_KEY` | API key for memory service | - | Yes (remote) |
| `NODE_ENV` | Environment mode | `development` | No |

### MCP Client Configuration

```typescript
// lib/mcp/client.ts configuration options

interface MCPConfig {
  mode: 'local' | 'remote' | 'auto';
  localServerUrl?: string;
  remoteApiUrl?: string;
  apiKey?: string;
  userId?: string;
}

// Auto-detection logic:
// 1. If apiKey provided and mode=auto -> use remote
// 2. If localhost/local domain -> prefer local
// 3. If local fails and mode=auto -> fallback to remote
// 4. Production domains -> use remote by default
```

### Tool Mappings

The MCP client automatically maps tool calls to appropriate endpoints:

```typescript
// Local WebSocket (via Onasis-CORE)
'memory_create_memory' -> WebSocket MCP call
'memory_search_memories' -> WebSocket MCP call
'memory_get_memory' -> WebSocket MCP call

// Remote API (direct lanonasis-maas)
'memory_create_memory' -> POST /api/memory
'memory_search_memories' -> POST /api/memory/search
'memory_get_memory' -> GET /api/memory/${id}
```

## Dashboard Integration

### Memory Dashboard Page
```typescript
// app/(dashboard)/memory/page.tsx

import { MemoryManager } from '@/components/memory/MemoryManager';
import { MemoryStats } from '@/components/memory/MemoryStats';
import { MemorySearch } from '@/components/memory/MemorySearch';

export default function MemoryPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Memory Management</h1>
        <p className="text-gray-600">
          Manage your AI memory database with vector search capabilities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MemoryManager />
        </div>
        <div className="space-y-6">
          <MemoryStats />
          <MemorySearch />
        </div>
      </div>
    </div>
  );
}
```

### Memory Statistics Component
```typescript
// components/memory/MemoryStats.tsx

'use client';

import { useState, useEffect } from 'react';
import { useMCP } from '@/lib/hooks/useMCP';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MemoryStats() {
  const { connected, client } = useMCP();
  const [stats, setStats] = useState({
    total: 0,
    byType: {},
    topTags: []
  });

  useEffect(() => {
    if (!connected || !client) return;

    const fetchStats = async () => {
      try {
        // Get basic stats
        const listResult = await client.callTool({
          name: 'memory_list_memories',
          arguments: { limit: 1000 }
        });

        if (listResult.success) {
          const memories = listResult.data.memories || [];
          
          const byType = memories.reduce((acc, memory) => {
            acc[memory.memory_type] = (acc[memory.memory_type] || 0) + 1;
            return acc;
          }, {});

          const allTags = memories.flatMap(m => m.tags || []);
          const tagCounts = allTags.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
          }, {});

          const topTags = Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));

          setStats({
            total: memories.length,
            byType,
            topTags
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [connected, client]);

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memory Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">MCP service not connected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Memories</div>
        </div>

        <div>
          <h4 className="font-medium mb-2">By Type</h4>
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="flex justify-between text-sm">
              <span className="capitalize">{type}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-medium mb-2">Top Tags</h4>
          {stats.topTags.map(({ tag, count }) => (
            <div key={tag} className="flex justify-between text-sm">
              <span>{tag}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Security Configuration

### API Key Management

```typescript
// lib/security/apiKeys.ts

export class APIKeyManager {
  private static validateKeyFormat(key: string): boolean {
    // pk_live_org_random.sk_live_hash or pk_test_org_random.sk_test_hash
    const regex = /^pk_(live|test)_[a-zA-Z0-9]+\.[a-z]{2}_(live|test)_[a-zA-Z0-9]+$/;
    return regex.test(key);
  }

  static getKeyEnvironment(key: string): 'production' | 'development' | null {
    if (!this.validateKeyFormat(key)) return null;
    
    return key.includes('_live_') ? 'production' : 'development';
  }

  static shouldUseSecureConnection(key?: string): boolean {
    if (!key) return false;
    
    const env = this.getKeyEnvironment(key);
    return env === 'production';
  }

  static getRecommendedEndpoint(key?: string): string {
    if (!key) return 'ws://localhost:9083/mcp';
    
    const isProduction = this.shouldUseSecureConnection(key);
    return isProduction 
      ? 'https://mcp.lanonasis.com'
      : 'ws://localhost:9083/mcp';
  }
}
```

### CORS and CSP Configuration

```typescript
// next.config.ts - Security headers

const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' 
              ? '*' 
              : 'https://vibe.lanonasis.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-API-Key'
          }
        ]
      }
    ];
  },
  
  // Content Security Policy for MCP WebSocket connections
  async rewrites() {
    return [
      {
        source: '/mcp/:path*',
        destination: process.env.NODE_ENV === 'development'
          ? 'ws://localhost:9083/mcp/:path*'
          : 'https://mcp.lanonasis.com/:path*'
      }
    ];
  }
};
```

## Testing and Validation

### Component Testing

```typescript
// __tests__/components/memory/MemoryManager.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryManager } from '@/components/memory/MemoryManager';
import { useMCP } from '@/lib/hooks/useMCP';

// Mock the MCP hook
jest.mock('@/lib/hooks/useMCP');

const mockUseMCP = useMCP as jest.MockedFunction<typeof useMCP>;

describe('MemoryManager', () => {
  beforeEach(() => {
    mockUseMCP.mockReturnValue({
      connected: true,
      mode: 'local',
      createMemory: jest.fn(),
      searchMemories: jest.fn(),
      getMemory: jest.fn(),
      client: null
    });
  });

  it('renders connection status', () => {
    render(<MemoryManager />);
    
    expect(screen.getByText(/MCP Status: Connected \(local\)/)).toBeInTheDocument();
  });

  it('creates memory when form is submitted', async () => {
    const mockCreateMemory = jest.fn().mockResolvedValue({ success: true });
    mockUseMCP.mockReturnValue({
      connected: true,
      mode: 'local',
      createMemory: mockCreateMemory,
      searchMemories: jest.fn(),
      getMemory: jest.fn(),
      client: null
    });

    render(<MemoryManager />);

    fireEvent.change(screen.getByPlaceholderText('Memory title...'), {
      target: { value: 'Test Memory' }
    });
    fireEvent.change(screen.getByPlaceholderText('Memory content...'), {
      target: { value: 'Test content' }
    });
    fireEvent.click(screen.getByText('Create Memory'));

    await waitFor(() => {
      expect(mockCreateMemory).toHaveBeenCalledWith({
        title: 'Test Memory',
        content: 'Test content',
        memory_type: 'knowledge',
        tags: []
      });
    });
  });

  it('shows disconnected state when MCP is unavailable', () => {
    mockUseMCP.mockReturnValue({
      connected: false,
      mode: 'disconnected',
      createMemory: jest.fn(),
      searchMemories: jest.fn(),
      getMemory: jest.fn(),
      client: null
    });

    render(<MemoryManager />);
    
    expect(screen.getByText(/MCP Status: Disconnected/)).toBeInTheDocument();
    expect(screen.getByText('Create Memory')).toBeDisabled();
  });
});
```

### API Route Testing

```typescript
// __tests__/api/memory/route.test.ts

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/memory/route';
import { getMCPClient } from '@/lib/mcp/client';

// Mock the MCP client
jest.mock('@/lib/mcp/client');

const mockGetMCPClient = getMCPClient as jest.MockedFunction<typeof getMCPClient>;

describe('/api/memory', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      connect: jest.fn(),
      callTool: jest.fn()
    };
    mockGetMCPClient.mockReturnValue(mockClient);
  });

  describe('GET', () => {
    it('returns memories when MCP is connected', async () => {
      mockClient.connect.mockResolvedValue(true);
      mockClient.callTool.mockResolvedValue({
        success: true,
        data: { memories: [{ id: '1', title: 'Test' }] }
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.memories).toHaveLength(1);
    });

    it('returns 503 when MCP is disconnected', async () => {
      mockClient.connect.mockResolvedValue(false);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('MCP service unavailable');
    });
  });

  describe('POST', () => {
    it('creates memory with valid data', async () => {
      mockClient.connect.mockResolvedValue(true);
      mockClient.callTool.mockResolvedValue({
        success: true,
        data: { id: '1', title: 'New Memory' }
      });

      const request = new NextRequest('http://localhost:3000/api/memory', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Memory',
          content: 'Memory content',
          memory_type: 'knowledge'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('New Memory');
    });
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/mcp-integration.test.ts

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryManager } from '@/components/memory/MemoryManager';

// Integration test with real MCP connection (if available)
describe('MCP Integration', () => {
  it('connects to local MCP server in development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_MCP_SERVER_URL = 'ws://localhost:9083/mcp';

    render(<MemoryManager />);

    // Wait for connection attempt
    await waitFor(() => {
      const statusElement = screen.getByText(/MCP Status:/);
      expect(statusElement).toBeInTheDocument();
    }, { timeout: 5000 });

    // Check if it connected or shows appropriate error
    const statusText = screen.getByText(/MCP Status:/).textContent;
    expect(statusText).toMatch(/(Connected|Disconnected)/);
  });

  it('falls back to remote API when local is unavailable', async () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_MCP_MODE = 'auto';
    process.env.NEXT_PUBLIC_MEMORY_API_KEY = 'pk_test_demo.sk_test_demo';

    render(<MemoryManager />);

    await waitFor(() => {
      const statusElement = screen.getByText(/MCP Status:/);
      expect(statusElement).toBeInTheDocument();
    }, { timeout: 5000 });

    // Should either connect locally or fall back to remote
    const statusText = screen.getByText(/MCP Status:/).textContent;
    expect(statusText).toMatch(/(Connected \(local\)|Connected \(remote\)|Disconnected)/);
  });
});
```

## Monitoring and Debugging

### MCP Connection Monitoring

```typescript
// lib/monitoring/mcpMonitor.ts

export class MCPMonitor {
  private static instance: MCPMonitor;
  private connectionHistory: Array<{
    timestamp: Date;
    mode: string;
    success: boolean;
    error?: string;
  }> = [];

  static getInstance(): MCPMonitor {
    if (!this.instance) {
      this.instance = new MCPMonitor();
    }
    return this.instance;
  }

  logConnection(mode: string, success: boolean, error?: string) {
    this.connectionHistory.push({
      timestamp: new Date(),
      mode,
      success,
      error
    });

    // Keep only last 100 entries
    if (this.connectionHistory.length > 100) {
      this.connectionHistory = this.connectionHistory.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MCP] Connection ${success ? 'successful' : 'failed'} (${mode})`, error || '');
    }
  }

  getConnectionStats() {
    const recent = this.connectionHistory.slice(-10);
    const successRate = recent.filter(h => h.success).length / recent.length;
    
    return {
      recentAttempts: recent.length,
      successRate,
      lastSuccess: this.connectionHistory.find(h => h.success)?.timestamp,
      lastError: this.connectionHistory.find(h => !h.success)?.error
    };
  }

  async runDiagnostics() {
    const diagnostics = {
      environment: process.env.NODE_ENV,
      localServerUrl: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
      remoteApiUrl: process.env.NEXT_PUBLIC_GATEWAY_URL,
      hasApiKey: !!process.env.NEXT_PUBLIC_MEMORY_API_KEY,
      connectionStats: this.getConnectionStats()
    };

    // Test connectivity
    try {
      if (diagnostics.localServerUrl) {
        const wsTest = await this.testWebSocketConnection(diagnostics.localServerUrl);
        diagnostics.localConnectivity = wsTest;
      }

      if (diagnostics.remoteApiUrl) {
        const httpTest = await this.testHttpConnection(diagnostics.remoteApiUrl);
        diagnostics.remoteConnectivity = httpTest;
      }
    } catch (error) {
      diagnostics.diagnosticError = error.message;
    }

    return diagnostics;
  }

  private async testWebSocketConnection(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(url);
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      } catch {
        resolve(false);
      }
    });
  }

  private async testHttpConnection(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/api/v1/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### Debug Component

```typescript
// components/debug/MCPDebugPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { MCPMonitor } from '@/lib/monitoring/mcpMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function MCPDebugPanel() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const monitor = MCPMonitor.getInstance();
      const results = await monitor.runDiagnostics();
      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return <div>Loading diagnostics...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          MCP Debug Panel
          <Button 
            size="sm" 
            onClick={runDiagnostics}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Environment</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Mode: {diagnostics.environment}</div>
            <div>Has API Key: {diagnostics.hasApiKey ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Endpoints</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span>Local:</span>
              <code className="text-xs bg-gray-100 px-1 rounded">
                {diagnostics.localServerUrl || 'Not configured'}
              </code>
              {diagnostics.localConnectivity !== undefined && (
                <Badge variant={diagnostics.localConnectivity ? 'default' : 'destructive'}>
                  {diagnostics.localConnectivity ? 'Online' : 'Offline'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Remote:</span>
              <code className="text-xs bg-gray-100 px-1 rounded">
                {diagnostics.remoteApiUrl || 'Not configured'}
              </code>
              {diagnostics.remoteConnectivity !== undefined && (
                <Badge variant={diagnostics.remoteConnectivity ? 'default' : 'destructive'}>
                  {diagnostics.remoteConnectivity ? 'Online' : 'Offline'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {diagnostics.connectionStats && (
          <div>
            <h4 className="font-medium mb-2">Connection Stats</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Recent Attempts: {diagnostics.connectionStats.recentAttempts}</div>
              <div>Success Rate: {(diagnostics.connectionStats.successRate * 100).toFixed(1)}%</div>
              <div className="col-span-2">
                Last Success: {diagnostics.connectionStats.lastSuccess?.toLocaleString() || 'Never'}
              </div>
              {diagnostics.connectionStats.lastError && (
                <div className="col-span-2 text-red-600">
                  Last Error: {diagnostics.connectionStats.lastError}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Performance Optimization

### Connection Caching

```typescript
// lib/mcp/connectionCache.ts

export class MCPConnectionCache {
  private static connections = new Map<string, any>();
  private static lastCleanup = Date.now();

  static getConnection(key: string) {
    this.cleanup();
    return this.connections.get(key);
  }

  static setConnection(key: string, connection: any) {
    this.connections.set(key, {
      client: connection,
      timestamp: Date.now()
    });
  }

  static removeConnection(key: string) {
    const conn = this.connections.get(key);
    if (conn?.client?.disconnect) {
      conn.client.disconnect();
    }
    this.connections.delete(key);
  }

  private static cleanup() {
    const now = Date.now();
    
    // Run cleanup every 5 minutes
    if (now - this.lastCleanup < 5 * 60 * 1000) return;
    
    this.lastCleanup = now;
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [key, conn] of this.connections.entries()) {
      if (now - conn.timestamp > maxAge) {
        this.removeConnection(key);
      }
    }
  }
}
```

### Memory Operation Batching

```typescript
// lib/mcp/batchOperations.ts

export class MCPBatchOperations {
  private static batchQueue: Array<{
    operation: string;
    args: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private static batchTimeout: NodeJS.Timeout | null = null;

  static async batchCreateMemories(memories: Array<{ title: string; content: string }>) {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        operation: 'create_batch',
        args: { memories },
        resolve,
        reject
      });

      this.scheduleBatch();
    });
  }

  private static scheduleBatch() {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(async () => {
      await this.processBatch();
      this.batchTimeout = null;
    }, 100); // 100ms batch window
  }

  private static async processBatch() {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, 10); // Process up to 10 at once
    
    try {
      const results = await Promise.all(
        batch.map(async (item) => {
          // Execute batch operations
          return { success: true, data: item.args };
        })
      );

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error);
      });
    }
  }
}
```

## File References

### Core Implementation Files
- **`/lib/mcp/client.ts`** - Main MCP client implementation
- **`/lib/hooks/useMCP.ts`** - React hook for MCP operations
- **`/components/memory/MemoryManager.tsx`** - Memory management UI
- **`/app/api/memory/route.ts`** - Memory API endpoints
- **`/app/api/memory/search/route.ts`** - Search API endpoint

### Configuration Files
- **`/.env.local`** - Environment configuration
- **`/next.config.ts`** - Next.js configuration with security headers
- **`/package.json`** - Dependencies and scripts
- **`/CLAUDE.md`** - Project instructions and development guide

### UI Components
- **`/components/memory/`** - Memory-related components
- **`/components/orchestrator/`** - AI orchestrator components (planned)
- **`/components/ui/`** - Base UI components from shadcn/ui

### Testing Files
- **`/__tests__/components/memory/`** - Component tests
- **`/__tests__/api/memory/`** - API route tests
- **`/__tests__/integration/`** - Integration tests

## Production Checklist

### Deployment Configuration

```bash
# Production environment variables
NEXT_PUBLIC_MCP_MODE=remote
NEXT_PUBLIC_GATEWAY_URL=https://mcp.lanonasis.com
NEXT_PUBLIC_MEMORY_API_KEY=pk_live_org_abc123.sk_live_def456

# Remove development URLs
# NEXT_PUBLIC_MCP_SERVER_URL=ws://localhost:9083/mcp

# Database
POSTGRES_URL=postgresql://prod_user:prod_pass@prod_host:5432/prod_db

# Security
NODE_ENV=production
```

### Build Verification

```bash
# Type checking
bun run type-check

# Linting
bun run lint

# Build verification
bun run build

# Start production server
bun run start
```

### Performance Monitoring

```typescript
// lib/monitoring/performance.ts

export function measureMCPPerformance() {
  return {
    startTimer: () => performance.now(),
    endTimer: (start: number) => performance.now() - start,
    logOperation: (operation: string, duration: number) => {
      if (duration > 1000) { // Log slow operations
        console.warn(`[MCP] Slow operation: ${operation} took ${duration}ms`);
      }
    }
  };
}
```

## Support and Updates

- **Issues:** Report to vibe-frontend repository issues
- **Documentation:** Updated with new MCP features and integrations
- **Component Library:** Memory components available for reuse
- **Integration Examples:** Complete working examples in codebase

---

**Generated:** August 21, 2025  
**Next.js Version:** 15.0.0  
**MCP Client Version:** Latest  
**Integration Status:** Production Ready  
**Memory System:** Fully Integrated