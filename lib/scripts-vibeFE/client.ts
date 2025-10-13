/**
 * Vibe Frontend MCP Client
 * Fixed to use correct endpoints for seyederick-mcp gateway
 */

interface MCPConfig {
  // Remote MCP Gateway (Production)
  remoteApiUrl: string;
  apiKey?: string;
  
  // Local development (optional fallback)
  localServerUrl?: string;
  
  // User context
  userId?: string;
}

interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  result?: T;
}

export class MCPClient {
  private config: MCPConfig;
  private sseConnection: EventSource | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private updateCallbacks: Array<(update: any) => void> = [];

  constructor(config: Partial<MCPConfig> = {}) {
    // Use spread to avoid duplicate property assignment
    const defaultConfig: MCPConfig = {
      remoteApiUrl: 'https://link.seyederick.com',
      apiKey: 'vibe_frontend_key_2024',
    };
    
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

  async connect(): Promise<boolean> {
    try {
      // Try remote connection first (production)
      const remoteConnected = await this.connectRemote();
      if (remoteConnected) {
        return true;
      }

      // Fallback to local WebSocket (development)
      const localConnected = await this.connectLocal();
      return localConnected;
    } catch (error) {
      console.error('Failed to connect to MCP:', error);
      return false;
    }
  }

  private async connectRemote(): Promise<boolean> {
    try {
      // Test the MCP gateway health first
      const healthResponse = await fetch(`${this.config.remoteApiUrl}/health`);
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      const health = await healthResponse.json();
      console.log('MCP Gateway health:', health);

      // Initialize SSE for real-time updates
      this.initializeSSE();
      
      this.isConnected = true;
      console.log('✅ Connected to remote MCP gateway');
      return true;
    } catch (error) {
      console.warn('Remote MCP connection failed:', error);
      return false;
    }
  }

  private async connectLocal(): Promise<boolean> {
    try {
      if (!this.config.localServerUrl) {
        console.info('Local MCP URL not configured');
        return false;
      }

      // For development, we can skip local connection if not available
      console.warn('Local WebSocket connection not implemented yet');
      return false;
    } catch (error) {
      console.warn('Failed to connect to local MCP server:', error);
      return false;
    }
  }

  private initializeSSE(): void {
    if (typeof window === 'undefined') {
      console.info('SSE not available in server-side environment');
      return;
    }
    
    // Fixed: Use correct SSE endpoint
    const sseUrl = `${this.config.remoteApiUrl}/sse`;
    const url = new URL(sseUrl);
    
    // Add API key if available
    if (this.config.apiKey) {
      url.searchParams.set('apiKey', this.config.apiKey);
    }
    
    if (this.config.userId) {
      url.searchParams.set('userId', this.config.userId);
    }
    
    try {
      console.log('🔗 Connecting to SSE:', url.toString());
      this.sseConnection = new EventSource(url.toString());
      
      this.sseConnection.onopen = () => {
        console.log('✅ SSE connection established');
        this.reconnectAttempts = 0;
      };
      
      this.sseConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 SSE message:', data);
          this.handleSSEMessage(data);
        } catch (error) {
          console.warn('Failed to parse SSE message:', error);
        }
      };
      
      this.sseConnection.onerror = (error) => {
        console.warn('🚨 SSE connection error:', error);
        this.handleSSEError();
      };
      
    } catch (error) {
      console.error('Failed to initialize SSE connection:', error);
    }
  }

  private handleSSEMessage(data: any): void {
    // Handle different message types
    switch (data.type) {
      case 'connected':
        console.log('SSE session established:', data.sessionId);
        break;
      case 'memory.created':
      case 'memory.updated':
      case 'memory.deleted':
        this.notifyUpdateCallbacks({ type: data.type, data: data.payload });
        break;
      default:
        console.log('Unknown SSE message type:', data.type);
    }
  }

  private handleSSEError(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      console.log(`🔄 Reconnecting SSE in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.sseConnection?.close();
        this.initializeSSE();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Tool execution methods
  async listTools(): Promise<MCPResponse> {
    if (!this.isConnected) {
      return { success: false, error: 'Not connected to MCP' };
    }

    try {
      // Fixed: Use correct HTTP endpoint
      const response = await fetch(`${this.config.remoteApiUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey })
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        return { success: false, error: data.error.message };
      }

      return { success: true, result: data.result };
    } catch (error) {
      console.error('Failed to list tools:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async callTool(name: string, arguments_: Record<string, any> = {}): Promise<MCPResponse> {
    if (!this.isConnected) {
      return { success: false, error: 'Not connected to MCP' };
    }

    try {
      const response = await fetch(`${this.config.remoteApiUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey })
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name,
            arguments: arguments_
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        return { success: false, error: data.error.message };
      }

      return { success: true, result: data.result };
    } catch (error) {
      console.error(`Failed to call tool ${name}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Memory operations (using core_memory tools)
  async createMemory(content: string, metadata?: Record<string, any>): Promise<MCPResponse> {
    return this.callTool('core_memory_create', {
      content,
      metadata: metadata || {}
    });
  }

  async searchMemory(query: string, limit: number = 10): Promise<MCPResponse> {
    return this.callTool('core_memory_search', {
      query,
      limit
    });
  }

  async getMemory(id: string): Promise<MCPResponse> {
    return this.callTool('core_memory_get', { id });
  }

  async updateMemory(id: string, content?: string, metadata?: Record<string, any>): Promise<MCPResponse> {
    const params: any = { id };
    if (content !== undefined) params.content = content;
    if (metadata !== undefined) params.metadata = metadata;
    
    return this.callTool('core_memory_update', params);
  }

  async deleteMemory(id: string): Promise<MCPResponse> {
    return this.callTool('core_memory_delete', { id });
  }

  async listMemories(limit: number = 50): Promise<MCPResponse> {
    return this.callTool('core_memory_list', { limit });
  }

  // Event handling
  onUpdate(callback: (update: any) => void): void {
    this.updateCallbacks.push(callback);
  }

  private notifyUpdateCallbacks(update: any): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });
  }

  // Connection management
  isReady(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    this.sseConnection?.close();
    this.sseConnection = null;
    this.isConnected = false;
    console.log('🔌 Disconnected from MCP');
  }

  // Health check
  async checkHealth(): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.config.remoteApiUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      const health = await response.json();
      return { success: true, data: health };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export default MCPClient;
