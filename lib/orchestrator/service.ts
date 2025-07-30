import { memoryClient } from '@/lib/memory/client';

export interface ServiceStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  url?: string;
  lastCheck: Date;
  error?: string;
}

export interface OrchestratorCommand {
  action: string;
  target: string;
  parameters: Record<string, unknown>;
  confidence?: number;
  tool?: string;
}

export interface OrchestratorResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  executionTime: number;
  command: OrchestratorCommand;
}

class OrchestratorService {
  private services: Map<string, ServiceStatus> = new Map();

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Initialize known services
    const isProduction = process.env.NODE_ENV === 'production';
    const memoryServiceUrl = process.env.MEMORY_SERVICE_URL || 
      (isProduction ? 'https://your-memory-service.herokuapp.com' : 'http://localhost:3001');
    const frontendUrl = process.env.BASE_URL || 
      (isProduction ? 'https://your-vibe-frontend.netlify.app' : 'http://localhost:3000');

    this.services.set('memory', {
      name: 'Memory Service',
      status: 'disconnected',
      url: memoryServiceUrl,
      lastCheck: new Date()
    });

    this.services.set('frontend', {
      name: 'Frontend Application',
      status: 'connected',
      url: frontendUrl,
      lastCheck: new Date()
    });
  }

  async checkServiceHealth(serviceName: string): Promise<ServiceStatus> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    try {
      if (serviceName === 'memory') {
        // Try to list memories to check if memory service is responsive
        // Use a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service timeout')), 5000)
        );
        
        await Promise.race([
          memoryClient.listMemories({ limit: 1 }),
          timeoutPromise
        ]);
        
        service.status = 'connected';
        service.error = undefined;
      } else if (serviceName === 'frontend') {
        // Frontend is always connected if we're running this code
        service.status = 'connected';
        service.error = undefined;
      }
    } catch (error) {
      service.status = 'error';
      
      // Handle different error types appropriately
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          service.error = 'Cannot connect to memory service - check URL and network';
        } else if (error.message.includes('timeout')) {
          service.error = 'Service timeout - memory service may be down';
        } else if (error.message.includes('cors')) {
          service.error = 'CORS error - check memory service configuration';
        } else {
          service.error = error.message;
        }
      } else {
        service.error = 'Unknown error';
      }
    }

    service.lastCheck = new Date();
    this.services.set(serviceName, service);
    return service;
  }

  async getAllServiceStatuses(): Promise<ServiceStatus[]> {
    const statuses: ServiceStatus[] = [];
    
    for (const serviceName of this.services.keys()) {
      const status = await this.checkServiceHealth(serviceName);
      statuses.push(status);
    }
    
    return statuses;
  }

  parseCommand(input: string): OrchestratorCommand {
    const command = input.toLowerCase().trim();
    
    // Memory service commands
    if (command.includes('search') && (command.includes('memor') || command.includes('find'))) {
      const queryMatch = command.match(/(?:search|find)\s+(?:for\s+)?(.+)/);
      const query = queryMatch?.[1] || '';
      
      return {
        action: 'search',
        target: 'memories',
        tool: 'memory',
        parameters: { query },
        confidence: 0.8
      };
    }

    if (command.includes('create memor')) {
      const titleMatch = command.match(/create\s+memor\w*\s+"([^"]+)"/);
      const contentMatch = command.match(/create\s+memor\w*\s+"[^"]+"\s+"([^"]+)"/);
      
      return {
        action: 'create',
        target: 'memory',
        tool: 'memory',
        parameters: {
          title: titleMatch?.[1] || 'New Memory',
          content: contentMatch?.[1] || input,
          type: 'context'
        },
        confidence: titleMatch && contentMatch ? 0.9 : 0.6
      };
    }

    if (command.includes('list') && command.includes('memor')) {
      return {
        action: 'list',
        target: 'memories',
        tool: 'memory',
        parameters: { limit: 10 },
        confidence: 0.9
      };
    }

    if (command.includes('stats') || command.includes('statistic')) {
      return {
        action: 'stats',
        target: 'memories',
        tool: 'memory',
        parameters: {},
        confidence: 0.8
      };
    }

    // UI navigation commands
    if (command.includes('open') && command.includes('dashboard')) {
      return {
        action: 'navigate',
        target: 'dashboard',
        tool: 'ui',
        parameters: { url: '/dashboard' },
        confidence: 0.9
      };
    }

    if (command.includes('open') && command.includes('memor')) {
      return {
        action: 'navigate',
        target: 'memory-dashboard',
        tool: 'ui',
        parameters: { url: '/dashboard/memory' },
        confidence: 0.9
      };
    }

    // Service management commands
    if (command.includes('status') || command.includes('health')) {
      return {
        action: 'check-health',
        target: 'services',
        tool: 'orchestrator',
        parameters: {},
        confidence: 0.8
      };
    }

    // Default fallback
    return {
      action: 'unknown',
      target: input,
      tool: 'orchestrator',
      parameters: { original: input },
      confidence: 0.1
    };
  }

  async executeCommand(command: OrchestratorCommand): Promise<OrchestratorResult> {
    const startTime = Date.now();
    
    try {
      let result: Record<string, unknown> = {};

      switch (command.tool) {
        case 'memory':
          result = await this.executeMemoryCommand(command);
          break;
        
        case 'ui':
          result = await this.executeUICommand(command);
          break;
        
        case 'orchestrator':
          result = await this.executeOrchestratorCommand(command);
          break;
        
        default:
          throw new Error(`Unknown tool: ${command.tool}`);
      }

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        command
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        command
      };
    }
  }

  private async executeMemoryCommand(command: OrchestratorCommand): Promise<Record<string, unknown>> {
    switch (command.action) {
      case 'search':
        const searchResults = await memoryClient.searchMemories({
          query: command.parameters.query as string,
          limit: 10
        });
        return {
          memories: searchResults.memories,
          total: searchResults.total
        };

      case 'create':
        const newMemory = await memoryClient.createMemory({
          title: command.parameters.title as string,
          content: command.parameters.content as string,
          type: (command.parameters.type as any) || 'context'
        });
        return {
          id: newMemory.id,
          title: newMemory.title,
          message: 'Memory created successfully'
        };

      case 'list':
        const listResults = await memoryClient.listMemories({
          limit: command.parameters.limit as number || 10
        });
        return {
          memories: listResults.memories,
          total: listResults.total
        };

      case 'stats':
        const statsResults = await memoryClient.listMemories({ limit: 1000 });
        const byType = statsResults.memories.reduce((acc, memory) => {
          acc[memory.type] = (acc[memory.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          total_memories: statsResults.total,
          by_type: byType
        };

      default:
        throw new Error(`Unknown memory action: ${command.action}`);
    }
  }

  private async executeUICommand(command: OrchestratorCommand): Promise<Record<string, unknown>> {
    switch (command.action) {
      case 'navigate':
        return {
          action: 'navigate',
          url: command.parameters.url,
          message: `Navigate to ${command.target}`,
          target: command.target
        };

      default:
        throw new Error(`Unknown UI action: ${command.action}`);
    }
  }

  private async executeOrchestratorCommand(command: OrchestratorCommand): Promise<Record<string, unknown>> {
    switch (command.action) {
      case 'check-health':
        const statuses = await this.getAllServiceStatuses();
        return {
          services: statuses,
          summary: {
            total: statuses.length,
            connected: statuses.filter(s => s.status === 'connected').length,
            errors: statuses.filter(s => s.status === 'error').length
          }
        };

      default:
        throw new Error(`Unknown orchestrator action: ${command.action}`);
    }
  }

  async processNaturalLanguage(input: string): Promise<OrchestratorResult> {
    const command = this.parseCommand(input);
    return await this.executeCommand(command);
  }
}

export const orchestratorService = new OrchestratorService();