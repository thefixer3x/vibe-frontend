import { memoryClient } from '@/lib/memory/client';
import { orchestratorService } from '@/lib/orchestrator/service';

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      required?: boolean;
    }>;
    required: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

// Memory management tools
const memoryTools: Tool[] = [
  {
    name: 'search_memories',
    description: 'Search through memories using semantic search or filters',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for semantic search'
        },
        type: {
          type: 'string',
          description: 'Filter by memory type',
          enum: ['context', 'project', 'knowledge', 'reference', 'personal', 'workflow']
        },
        tags: {
          type: 'string',
          description: 'Comma-separated tags to filter by'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)'
        }
      },
      required: ['query']
    },
    execute: async (args) => {
      try {
        const result = await memoryClient.searchMemories({
          query: args.query as string,
          memory_type: args.type as 'context' | 'project' | 'knowledge' | 'reference' | 'personal' | 'workflow' | undefined,
          tags: args.tags ? (args.tags as string).split(',').map(t => t.trim()) : undefined,
          limit: (args.limit as number) || 10
        });

        return {
          success: true,
          data: {
            memories: result.results,
            total: result.total,
            query: args.query
          },
          metadata: {
            searchType: 'semantic',
            resultsCount: result.results.length
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Search failed'
        };
      }
    }
  },
  
  {
    name: 'create_memory',
    description: 'Create a new memory with title, content, type, and optional tags',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the memory'
        },
        content: {
          type: 'string',
          description: 'Content/body of the memory'
        },
        type: {
          type: 'string',
          description: 'Type of memory',
          enum: ['context', 'project', 'knowledge', 'reference', 'personal', 'workflow']
        },
        tags: {
          type: 'string',
          description: 'Comma-separated tags for the memory'
        }
      },
      required: ['title', 'content', 'type']
    },
    execute: async (args) => {
      try {
        const result = await memoryClient.createMemory({
          title: args.title as string,
          content: args.content as string,
          memory_type: args.type as 'context' | 'project' | 'knowledge' | 'reference' | 'personal' | 'workflow',
          tags: args.tags ? (args.tags as string).split(',').map(t => t.trim()) : undefined
        });

        return {
          success: true,
          data: {
            id: result.id,
            title: result.title,
            type: result.memory_type,
            message: 'Memory created successfully'
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create memory'
        };
      }
    }
  },

  {
    name: 'get_memory',
    description: 'Retrieve a specific memory by ID',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Memory ID to retrieve'
        }
      },
      required: ['id']
    },
    execute: async (args) => {
      try {
        const result = await memoryClient.getMemory(args.id as string);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get memory'
        };
      }
    }
  },

  {
    name: 'list_memories',
    description: 'List all memories with optional filtering and pagination',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Filter by memory type',
          enum: ['context', 'project', 'knowledge', 'reference', 'personal', 'workflow']
        },
        tags: {
          type: 'string',
          description: 'Comma-separated tags to filter by'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        }
      },
      required: []
    },
    execute: async (args) => {
      try {
        const result = await memoryClient.listMemories({
          memory_type: args.type as 'context' | 'project' | 'knowledge' | 'reference' | 'personal' | 'workflow' | undefined,
          tags: args.tags ? (args.tags as string).split(',').map(t => t.trim()) : undefined,
          limit: (args.limit as number) || 20,
          page: (args.page as number) || 1
        });

        return {
          success: true,
          data: {
            memories: result.data,
            total: result.total,
            page: result.page,
            limit: result.limit
          },
          metadata: {
            hasMore: result.data.length === result.limit,
            totalPages: Math.ceil(result.total / result.limit)
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list memories'
        };
      }
    }
  }
];

// System management tools
const systemTools: Tool[] = [
  {
    name: 'check_service_health',
    description: 'Check the health status of all connected services',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: async () => {
      try {
        const statuses = await orchestratorService.getAllServiceStatuses();
        const summary = {
          total: statuses.length,
          connected: statuses.filter(s => s.status === 'connected').length,
          errors: statuses.filter(s => s.status === 'error').length
        };

        return {
          success: true,
          data: {
            services: statuses,
            summary
          },
          metadata: {
            healthy: summary.errors === 0,
            lastCheck: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check service health'
        };
      }
    }
  },

  {
    name: 'navigate_to_page',
    description: 'Navigate to a specific page in the application',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          description: 'Page to navigate to',
          enum: ['dashboard', 'memory', 'memory-visualizer', 'memory-upload', 'apis', 'activity', 'security', 'general']
        }
      },
      required: ['page']
    },
    execute: async (args) => {
      const pageMap: Record<string, string> = {
        'dashboard': '/dashboard',
        'memory': '/dashboard/memory',
        'memory-visualizer': '/dashboard/memory/visualizer',
        'memory-upload': '/dashboard/memory/upload',
        'apis': '/dashboard/apis',
        'activity': '/dashboard/activity',
        'security': '/dashboard/security',
        'general': '/dashboard/general'
      };

      const url = pageMap[args.page as string];
      if (!url) {
        return {
          success: false,
          error: `Unknown page: ${args.page}`
        };
      }

      return {
        success: true,
        data: {
          action: 'navigate',
          url,
          page: args.page,
          message: `Navigating to ${args.page}`
        }
      };
    }
  }
];

// Utility tools
const utilityTools: Tool[] = [
  {
    name: 'analyze_memory_stats',
    description: 'Analyze memory statistics and provide insights',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: async () => {
      try {
        const result = await memoryClient.listMemories({ limit: 1000 });
        
        // Analyze memory distribution
        const byType = result.data.reduce((acc, memory) => {
          acc[memory.memory_type] = (acc[memory.memory_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Analyze tags
        const allTags = result.data.flatMap(m => m.tags || []);
        const tagCounts = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topTags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);

        // Calculate content statistics
        const contentLengths = result.data.map(m => m.content.length);
        const avgContentLength = contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length;

        return {
          success: true,
          data: {
            total: result.total,
            byType,
            topTags,
            statistics: {
              averageContentLength: Math.round(avgContentLength),
              totalTags: Object.keys(tagCounts).length,
              uniqueTypes: Object.keys(byType).length
            }
          },
          metadata: {
            analyzedAt: new Date().toISOString(),
            sampleSize: result.data.length
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to analyze memory stats'
        };
      }
    }
  }
];

// Apple App Store Connect tools
const appleTools: Tool[] = [
  {
    name: 'apple_list_apps',
    description: 'List Apple App Store Connect apps (requires Apple env vars enabled)',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      try {
        const res = await fetch('/api/appstore/apps');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to list apps');
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to list apps' };
      }
    }
  },
  {
    name: 'apple_list_builds',
    description: 'List builds across apps from App Store Connect',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      try {
        const res = await fetch('/api/appstore/builds');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to list builds');
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to list builds' };
      }
    }
  },
  {
    name: 'apple_list_beta_groups',
    description: 'List TestFlight beta groups for a given app id',
    parameters: {
      type: 'object',
      properties: { app_id: { type: 'string', description: 'App Store Connect app ID' } },
      required: ['app_id']
    },
    execute: async (args) => {
      try {
        const res = await fetch(`/api/appstore/apps/${args.app_id}/beta-groups`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to list beta groups');
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to list beta groups' };
      }
    }
  }
];

// Stripe tools
const stripeTools: Tool[] = [
  {
    name: 'stripe_get_portal_url',
    description: 'Get a Stripe customer portal URL for managing subscription and billing',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      try {
        const res = await fetch('/api/stripe/portal');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get portal URL');
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to get portal URL' };
      }
    }
  }
];

// All available tools
export const availableTools: Tool[] = [
  ...memoryTools,
  ...systemTools,
  ...utilityTools,
  ...appleTools,
  ...stripeTools,
];

// Tool registry for easy lookup
export const toolRegistry = new Map<string, Tool>();
availableTools.forEach(tool => {
  toolRegistry.set(tool.name, tool);
});

// Function to execute a tool call
export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const tool = toolRegistry.get(toolCall.name);
  
  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${toolCall.name}`
    };
  }

  try {
    return await tool.execute(toolCall.arguments);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tool execution failed'
    };
  }
}

// Function to get tool definitions for AI models
export function getToolDefinitions(): Array<{
  name: string;
  description: string;
  parameters: Tool['parameters'];
}> {
  return availableTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}
