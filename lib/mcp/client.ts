'use client';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { CallToolResult, ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

export interface MCPConfig {
  mode: 'local' | 'remote' | 'auto';
  localServerUrl?: string;
  remoteApiUrl?: string;
  apiKey?: string;
  userId?: string;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

class MCPClient {
  private client: Client | null = null;
  private config: MCPConfig;
  private isConnected = false;
  private sseConnection: EventSource | null = null;
  private onUpdateCallbacks: ((data: any) => void)[] = [];

  constructor(config?: Partial<MCPConfig>) {
    // Decide a safe default for local MCP only when actually on localhost
    let defaultLocalUrl: string | undefined = undefined;
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
        defaultLocalUrl = 'ws://localhost:3002/mcp';
      }
    } else {
      // Node context (SSR/build): leave undefined to avoid leaking localhost into client bundles
      defaultLocalUrl = undefined;
    }

    this.config = {
      mode: config?.mode || 'auto',
      localServerUrl: config?.localServerUrl || process.env.NEXT_PUBLIC_MCP_SERVER_URL || defaultLocalUrl,
      remoteApiUrl: config?.remoteApiUrl || process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://api.lanonasis.com',
      apiKey: config?.apiKey || process.env.NEXT_PUBLIC_MEMORY_API_KEY,
      userId: config?.userId
    };
  }

  async connect(): Promise<boolean> {
    try {
      let shouldUseRemote = this.shouldUseRemoteMode();
      // If no local server URL is available, prefer remote (or no-connection) to avoid localhost attempts in prod
      if (!this.config.localServerUrl) {
        shouldUseRemote = true;
      }
      
      if (shouldUseRemote) {
        return await this.connectRemote();
      } else {
        return await this.connectLocal();
      }
    } catch (error) {
      console.error('MCP connection error:', error);
      // Fallback to remote API if local fails
      if (this.config.mode === 'auto') {
        console.log('Falling back to remote MCP mode');
        return await this.connectRemote();
      }
      return false;
    }
  }

  private shouldUseRemoteMode(): boolean {
    if (this.config.mode === 'remote') return true;
    if (this.config.mode === 'local') return false;
    
    // Auto mode: use remote if we have API key, otherwise local
    return !!this.config.apiKey;
  }

  private async connectLocal(): Promise<boolean> {
    try {
      if (!this.config.localServerUrl) {
        throw new Error('Local MCP URL not configured');
      }
      const transport = new WebSocketClientTransport(new URL(this.config.localServerUrl));
      
      this.client = new Client({
        name: 'vibe-frontend',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await this.client.connect(transport);
      this.isConnected = true;
      console.log('Connected to local MCP server');
      return true;
    } catch (error) {
      // Avoid noisy errors on production domains where no local server exists
      console.warn('Failed to connect to local MCP server:', error);
      this.isConnected = false;
      return false;
    }
  }

  private async connectRemote(): Promise<boolean> {
    // For remote mode, we don't need a persistent connection
    // We'll use REST API calls that are MCP-compatible
    if (this.config.apiKey) {
      this.isConnected = true;
      
      // Initialize SSE for real-time updates
      this.initializeSSE();
      
      console.log('Connected to remote MCP via API');
      return true;
    }
    
    console.info('MCP remote mode not configured (missing API key)');
    return false;
  }

  private initializeSSE(): void {
    if (!this.config.apiKey || !this.config.remoteApiUrl) return;
    
    const sseUrl = new URL('/api/sse', this.config.remoteApiUrl);
    sseUrl.searchParams.set('apiKey', this.config.apiKey);
    if (this.config.userId) {
      sseUrl.searchParams.set('userId', this.config.userId);
    }
    
    this.sseConnection = new EventSource(sseUrl.toString());
    
    this.sseConnection.addEventListener('memory.created', (event) => {
      const data = JSON.parse(event.data);
      this.notifyUpdateCallbacks({ type: 'memory.created', data });
    });
    
    this.sseConnection.addEventListener('memory.updated', (event) => {
      const data = JSON.parse(event.data);
      this.notifyUpdateCallbacks({ type: 'memory.updated', data });
    });
    
    this.sseConnection.addEventListener('memory.deleted', (event) => {
      const data = JSON.parse(event.data);
      this.notifyUpdateCallbacks({ type: 'memory.deleted', data });
    });
    
    this.sseConnection.onerror = () => {
      console.error('SSE connection error');
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }
    
    this.isConnected = false;
  }

  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP server');
    }

    const shouldUseRemote = this.shouldUseRemoteMode();
    
    if (shouldUseRemote) {
      return await this.callRemoteTool(toolCall);
    } else {
      return await this.callLocalTool(toolCall);
    }
  }

  private async callLocalTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await this.client.callTool({
        name: toolCall.name,
        arguments: toolCall.arguments
      }) as CallToolResult;

      if (result.isError) {
        return {
          success: false,
          error: String(result.content[0]?.text || 'Tool call failed')
        };
      }

      return {
        success: true,
        data: result.content[0]?.text ? JSON.parse(String(result.content[0].text)) : null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async callRemoteTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    // Map MCP tool names to REST API endpoints
    const toolMappings: Record<string, {
      method: string;
      endpoint: (args: any) => string;
      body?: (args: any) => any;
    }> = {
      'memory_create_memory': {
        method: 'POST',
        endpoint: () => '/api/memory',
        body: (args) => args
      },
      'memory_search_memories': {
        method: 'POST',
        endpoint: () => '/api/memory/search',
        body: (args) => args
      },
      'memory_get_memory': {
        method: 'GET',
        endpoint: (args) => `/api/memory/${args._memory_id}`
      },
      'memory_update_memory': {
        method: 'PUT',
        endpoint: (args) => `/api/memory/${args._memory_id}`,
        body: (args) => {
          const { _memory_id, ...data } = args;
          return data;
        }
      },
      'memory_delete_memory': {
        method: 'DELETE',
        endpoint: (args) => `/api/memory/${args._memory_id}`
      },
      'memory_list_memories': {
        method: 'GET',
        endpoint: () => '/api/memory'
      }
    };

    const mapping = toolMappings[toolCall.name];
    if (!mapping) {
      return {
        success: false,
        error: `Unknown tool: ${toolCall.name}`
      };
    }

    try {
      const response = await fetch(mapping.endpoint(toolCall.arguments), {
        method: mapping.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey!
        },
        body: mapping.body ? JSON.stringify(mapping.body(toolCall.arguments)) : undefined
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || error.message || 'Tool call failed'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async listTools(): Promise<{ name: string; description: string }[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP server');
    }

    const shouldUseRemote = this.shouldUseRemoteMode();
    
    if (shouldUseRemote) {
      // Return hardcoded list for remote mode
      return [
        { name: 'memory_create_memory', description: 'Create a new memory entry' },
        { name: 'memory_search_memories', description: 'Search memories using semantic search' },
        { name: 'memory_get_memory', description: 'Get a specific memory by ID' },
        { name: 'memory_update_memory', description: 'Update an existing memory' },
        { name: 'memory_delete_memory', description: 'Delete a memory' },
        { name: 'memory_list_memories', description: 'List all memories with pagination' }
      ];
    } else {
      if (!this.client) {
        throw new Error('MCP client not initialized');
      }
      
      const result = await this.client.listTools() as ListToolsResult;
      return result.tools.map(tool => ({
        name: tool.name,
        description: tool.description || 'No description available'
      }));
    }
  }

  onUpdate(callback: (data: any) => void): () => void {
    this.onUpdateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.onUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.onUpdateCallbacks.splice(index, 1);
      }
    };
  }

  private notifyUpdateCallbacks(data: any): void {
    this.onUpdateCallbacks.forEach(callback => callback(data));
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  getConnectionMode(): 'local' | 'remote' | 'disconnected' {
    if (!this.isConnected) return 'disconnected';
    return this.shouldUseRemoteMode() ? 'remote' : 'local';
  }
}

// Singleton instance
let mcpClientInstance: MCPClient | null = null;

export function getMCPClient(config?: Partial<MCPConfig>): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient(config);
  }
  return mcpClientInstance;
}

export { MCPClient };
export default MCPClient;
