interface Memory {
  id: string;
  title: string;
  content: string;
  type: 'context' | 'project' | 'knowledge' | 'reference' | 'personal' | 'workflow';
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface CreateMemoryRequest {
  title: string;
  content: string;
  type: Memory['type'];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface SearchMemoryRequest {
  query: string;
  type?: Memory['type'];
  tags?: string[];
  limit?: number;
  threshold?: number;
}

interface MemoryListResponse {
  memories: Memory[];
  total: number;
  page: number;
  limit: number;
}

interface SearchMemoryResponse {
  memories: Array<Memory & { similarity: number }>;
  total: number;
}

class MemoryClient {
  private baseUrl = '/api/memory';

  async createMemory(data: CreateMemoryRequest): Promise<Memory> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create memory');
    }

    return response.json();
  }

  async getMemory(id: string): Promise<Memory> {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get memory');
    }

    return response.json();
  }

  async updateMemory(id: string, data: Partial<CreateMemoryRequest>): Promise<Memory> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update memory');
    }

    return response.json();
  }

  async deleteMemory(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete memory');
    }
  }

  async listMemories(params?: {
    page?: number;
    limit?: number;
    type?: Memory['type'];
    tags?: string[];
  }): Promise<MemoryListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.type) searchParams.set('type', params.type);
    if (params?.tags?.length) searchParams.set('tags', params.tags.join(','));

    const response = await fetch(`${this.baseUrl}?${searchParams}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list memories');
    }

    return response.json();
  }

  async searchMemories(data: SearchMemoryRequest): Promise<SearchMemoryResponse> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search memories');
    }

    return response.json();
  }
}

export const memoryClient = new MemoryClient();
export type { Memory, CreateMemoryRequest, SearchMemoryRequest, MemoryListResponse, SearchMemoryResponse };