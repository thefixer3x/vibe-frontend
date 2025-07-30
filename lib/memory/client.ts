import { getMCPClient, MCPClient } from '@/lib/mcp/client';

interface Memory {
  id: string;
  title: string;
  content: string;
  memory_type: 'context' | 'project' | 'knowledge' | 'reference' | 'personal' | 'workflow';
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  user_id?: string;
  access_count?: number;
  last_accessed?: string;
  relevance_score?: number;
}

interface CreateMemoryRequest {
  title: string;
  content: string;
  memory_type: Memory['memory_type'];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface SearchMemoryRequest {
  query: string;
  memory_type?: Memory['memory_type'];
  tags?: string[];
  limit?: number;
  threshold?: number;
}

interface MemoryListResponse {
  data: Memory[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface SearchMemoryResponse {
  results: Array<Memory & { similarity_score: number }>;
  total: number;
  query: string;
  threshold: number;
}

interface MemoryStats {
  total_memories: number;
  memories_by_type: Record<string, number>;
  recent_activity: number;
  storage_used: number;
  avg_similarity_score: number;
}

class MemoryClient {
  private baseUrl: string;
  private apiKey: string | null = null;
  private mcpClient: MCPClient | null = null;
  private useMCP: boolean = true;

  constructor() {
    // Use environment variables or fallback to API proxy
    this.baseUrl = process.env.NEXT_PUBLIC_MEMORY_API_URL || '/api/memory';
    this.apiKey = process.env.NEXT_PUBLIC_MEMORY_API_KEY || null;
    
    // Initialize MCP client if enabled
    if (this.useMCP) {
      this.mcpClient = getMCPClient({
        mode: 'auto',
        apiKey: this.apiKey || undefined
      });
    }
  }

  async ensureMCPConnected(): Promise<boolean> {
    if (!this.mcpClient || !this.useMCP) return false;
    
    if (!this.mcpClient.isConnectedToServer()) {
      return await this.mcpClient.connect();
    }
    
    return true;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // If using direct Supabase endpoints, add API key
    if (this.apiKey && this.baseUrl !== '/api/memory') {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  async createMemory(data: CreateMemoryRequest): Promise<Memory> {
    // Try MCP first if available
    const mcpConnected = await this.ensureMCPConnected();
    if (mcpConnected && this.mcpClient) {
      try {
        const result = await this.mcpClient.callTool({
          name: 'memory_create_memory',
          arguments: data
        });
        
        if (result.success && result.data) {
          return result.data;
        }
      } catch (error) {
        console.warn('MCP call failed, falling back to REST:', error);
      }
    }
    
    // Fallback to REST API
    const headers = await this.getHeaders();
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to create memory');
    }

    const result = await response.json();
    return result.data || result;
  }

  async getMemory(id: string): Promise<Memory> {
    // Try MCP first if available
    const mcpConnected = await this.ensureMCPConnected();
    if (mcpConnected && this.mcpClient) {
      try {
        const result = await this.mcpClient.callTool({
          name: 'memory_get_memory',
          arguments: { memory_id: id }
        });
        
        if (result.success && result.data) {
          return result.data;
        }
      } catch (error) {
        console.warn('MCP call failed, falling back to REST:', error);
      }
    }
    
    // Fallback to REST API
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/${id}`, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to get memory');
    }

    const result = await response.json();
    return result.data || result;
  }

  async updateMemory(id: string, data: Partial<CreateMemoryRequest>): Promise<Memory> {
    // Try MCP first if available
    const mcpConnected = await this.ensureMCPConnected();
    if (mcpConnected && this.mcpClient) {
      try {
        const result = await this.mcpClient.callTool({
          name: 'memory_update_memory',
          arguments: { memory_id: id, ...data }
        });
        
        if (result.success && result.data) {
          return result.data;
        }
      } catch (error) {
        console.warn('MCP call failed, falling back to REST:', error);
      }
    }
    
    // Fallback to REST API
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to update memory');
    }

    const result = await response.json();
    return result.data || result;
  }

  async deleteMemory(id: string): Promise<void> {
    // Try MCP first if available
    const mcpConnected = await this.ensureMCPConnected();
    if (mcpConnected && this.mcpClient) {
      try {
        const result = await this.mcpClient.callTool({
          name: 'memory_delete_memory',
          arguments: { memory_id: id }
        });
        
        if (result.success) {
          return;
        }
      } catch (error) {
        console.warn('MCP call failed, falling back to REST:', error);
      }
    }
    
    // Fallback to REST API
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to delete memory');
    }
  }

  async listMemories(params?: {
    page?: number;
    limit?: number;
    memory_type?: Memory['memory_type'];
    tags?: string[];
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<MemoryListResponse> {
    // Try MCP first if available
    const mcpConnected = await this.ensureMCPConnected();
    if (mcpConnected && this.mcpClient) {
      try {
        const result = await this.mcpClient.callTool({
          name: 'memory_list_memories',
          arguments: params || {}
        });
        
        if (result.success && result.data) {
          return result.data;
        }
      } catch (error) {
        console.warn('MCP call failed, falling back to REST:', error);
      }
    }
    
    // Fallback to REST API
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.memory_type) searchParams.set('type', params.memory_type);
    if (params?.tags?.length) searchParams.set('tags', params.tags.join(','));
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);

    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}?${searchParams}`, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to list memories');
    }

    return response.json();
  }

  async searchMemories(data: SearchMemoryRequest): Promise<SearchMemoryResponse> {
    // Try MCP first if available
    const mcpConnected = await this.ensureMCPConnected();
    if (mcpConnected && this.mcpClient) {
      try {
        const result = await this.mcpClient.callTool({
          name: 'memory_search_memories',
          arguments: data
        });
        
        if (result.success && result.data) {
          return result.data;
        }
      } catch (error) {
        console.warn('MCP call failed, falling back to REST:', error);
      }
    }
    
    // Fallback to REST API
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to search memories');
    }

    return response.json();
  }

  async getMemoryStats(): Promise<MemoryStats> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/stats`, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to get memory stats');
    }

    const result = await response.json();
    return result.data || result;
  }

  async bulkDeleteMemories(ids: string[]): Promise<{ deleted_count: number }> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/bulk/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ memory_ids: ids }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to bulk delete memories');
    }

    const result = await response.json();
    return result.data || result;
  }

  async exportMemories(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/export?format=${format}`, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to export memories');
    }

    return response.blob();
  }

  // MCP-specific methods
  async getMCPTools() {
    if (!this.mcpClient) {
      throw new Error('MCP client not initialized');
    }
    
    const connected = await this.ensureMCPConnected();
    if (!connected) {
      throw new Error('Failed to connect to MCP server');
    }
    
    return await this.mcpClient.listTools();
  }

  getMCPConnectionStatus() {
    if (!this.mcpClient) {
      return { connected: false, mode: 'disabled' as const };
    }
    
    return {
      connected: this.mcpClient.isConnectedToServer(),
      mode: this.mcpClient.getConnectionMode()
    };
  }

  onMCPUpdate(callback: (data: any) => void): () => void {
    if (!this.mcpClient) {
      return () => {}; // No-op unsubscribe
    }
    
    return this.mcpClient.onUpdate(callback);
  }

  setUseMCP(enabled: boolean) {
    this.useMCP = enabled;
    
    if (enabled && !this.mcpClient) {
      this.mcpClient = getMCPClient({
        mode: 'auto',
        apiKey: this.apiKey || undefined
      });
    }
  }
}

export const memoryClient = new MemoryClient();
export type { 
  Memory, 
  CreateMemoryRequest, 
  SearchMemoryRequest, 
  MemoryListResponse, 
  SearchMemoryResponse,
  MemoryStats
};