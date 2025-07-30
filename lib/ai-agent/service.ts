import { executeToolCall, getToolDefinitions, ToolCall, ToolResult } from './tools';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string; // For tool calls
  tool_calls?: ToolCall[];
  tool_call_id?: string; // For tool responses
}

export interface AgentResponse {
  message: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  reasoning?: string;
  confidence?: number;
}

class AIAgentService {
  private systemPrompt = `You are a Memory Assistant AI agent with access to a comprehensive memory management system. You can help users:

1. **Search and retrieve memories** using semantic search
2. **Create new memories** with proper categorization
3. **Analyze memory statistics** and provide insights
4. **Navigate the application** to different sections
5. **Check system health** and service status

Available memory types:
- context: General contextual information
- project: Project-specific knowledge
- knowledge: Educational or reference material
- reference: Quick reference information
- personal: User-specific private memories
- workflow: Process and procedure documentation

When users ask questions or make requests:
1. Determine if you need to use tools to fulfill the request
2. Use the appropriate tools to gather information
3. Provide helpful, contextual responses based on the results
4. Suggest related actions or memory creation when appropriate

Always be helpful, accurate, and provide context for your responses. If you use tools, explain what you're doing and why.`;

  private mockLLMCall = async (messages: Message[]): Promise<{
    content: string;
    tool_calls?: ToolCall[];
  }> => {
    // This is a mock LLM implementation
    // In a real implementation, you would call an actual LLM API like OpenAI, Anthropic, etc.
    
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return { content: 'How can I help you with your memories today?' };
    }

    const query = lastUserMessage.content.toLowerCase();

    // Simple pattern matching for demo purposes
    // In reality, the LLM would understand the intent and decide which tools to use
    
    if (query.includes('search') || query.includes('find')) {
      const searchQuery = query.replace(/^.*(?:search|find)\s+(?:for\s+)?/i, '').trim();
      return {
        content: `I'll search for memories related to "${searchQuery}".`,
        tool_calls: [{
          name: 'search_memories',
          arguments: { query: searchQuery, limit: 10 }
        }]
      };
    }

    if (query.includes('create memory') || query.includes('save memory')) {
      // Extract title and content from the query (simplified)
      const titleMatch = query.match(/create memory[:\s]+"([^"]+)"/i);
      const contentMatch = query.match(/content[:\s]+"([^"]+)"/i) || query.match(/"([^"]+)"\s*$/);
      
      if (titleMatch) {
        return {
          content: `I'll create a new memory with the title "${titleMatch[1]}".`,
          tool_calls: [{
            name: 'create_memory',
            arguments: {
              title: titleMatch[1],
              content: contentMatch?.[1] || titleMatch[1],
              type: 'context'
            }
          }]
        };
      }
    }

    if (query.includes('list') && query.includes('memor')) {
      return {
        content: "I'll get a list of your memories.",
        tool_calls: [{
          name: 'list_memories',
          arguments: { limit: 20 }
        }]
      };
    }

    if (query.includes('stats') || query.includes('statistics') || query.includes('analyze')) {
      return {
        content: "I'll analyze your memory statistics.",
        tool_calls: [{
          name: 'analyze_memory_stats',
          arguments: {}
        }]
      };
    }

    if (query.includes('health') || query.includes('status') || query.includes('service')) {
      return {
        content: "I'll check the health status of all services.",
        tool_calls: [{
          name: 'check_service_health',
          arguments: {}
        }]
      };
    }

    if (query.includes('open') || query.includes('navigate') || query.includes('go to')) {
      if (query.includes('visualiz')) {
        return {
          content: "I'll navigate to the memory visualizer.",
          tool_calls: [{
            name: 'navigate_to_page',
            arguments: { page: 'memory-visualizer' }
          }]
        };
      }
      if (query.includes('upload')) {
        return {
          content: "I'll navigate to the memory upload page.",
          tool_calls: [{
            name: 'navigate_to_page',
            arguments: { page: 'memory-upload' }
          }]
        };
      }
      if (query.includes('dashboard')) {
        return {
          content: "I'll navigate to the dashboard.",
          tool_calls: [{
            name: 'navigate_to_page',
            arguments: { page: 'dashboard' }
          }]
        };
      }
    }

    // Default response
    return {
      content: `I understand you're asking about "${query}". I can help you with:
      
• **Searching memories**: "search for API documentation"
• **Creating memories**: "create memory 'Meeting Notes' with content about today's discussion"
• **Listing memories**: "list my memories" or "show all project memories"
• **Memory statistics**: "analyze my memory stats"
• **Service health**: "check service status"
• **Navigation**: "open memory visualizer" or "go to upload page"

What would you like me to help you with?`
    };
  };

  async processMessage(userMessage: string, conversationHistory: Message[] = []): Promise<AgentResponse> {
    try {
      // Build conversation context
      const messages: Message[] = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      // Get initial response from LLM
      const llmResponse = await this.mockLLMCall(messages);
      
      let toolResults: ToolResult[] = [];
      let finalMessage = llmResponse.content;

      // Execute tool calls if any
      if (llmResponse.tool_calls && llmResponse.tool_calls.length > 0) {
        toolResults = await Promise.all(
          llmResponse.tool_calls.map(toolCall => executeToolCall(toolCall))
        );

        // Process tool results and generate final response
        finalMessage = this.formatResponseWithToolResults(
          llmResponse.content,
          llmResponse.tool_calls,
          toolResults
        );
      }

      return {
        message: finalMessage,
        toolCalls: llmResponse.tool_calls,
        toolResults,
        confidence: 0.8,
        reasoning: llmResponse.tool_calls ? 
          `Executed ${llmResponse.tool_calls.length} tool(s) to fulfill the request.` : 
          'Provided direct response based on query analysis.'
      };
    } catch (error) {
      return {
        message: `I encountered an error while processing your request: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        confidence: 0.0
      };
    }
  }

  private formatResponseWithToolResults(
    initialMessage: string,
    toolCalls: ToolCall[],
    toolResults: ToolResult[]
  ): string {
    let response = initialMessage + "\n\n";

    toolCalls.forEach((toolCall, index) => {
      const result = toolResults[index];
      
      if (!result.success) {
        response += `❌ **${toolCall.name}** failed: ${result.error}\n\n`;
        return;
      }

      switch (toolCall.name) {
        case 'search_memories':
          const searchData = result.data as any;
          if (searchData.memories?.length > 0) {
            response += `🔍 **Found ${searchData.memories.length} memories:**\n`;
            searchData.memories.slice(0, 5).forEach((memory: any, i: number) => {
              response += `${i + 1}. **${memory.title}** (${memory.type})\n   ${memory.content.substring(0, 100)}...\n`;
            });
            if (searchData.memories.length > 5) {
              response += `   ... and ${searchData.memories.length - 5} more results\n`;
            }
          } else {
            response += "🔍 No memories found matching your search.\n";
          }
          break;

        case 'create_memory':
          const createData = result.data as any;
          response += `✅ **Memory created successfully!**\n   Title: "${createData.title}"\n   Type: ${createData.type}\n   ID: ${createData.id}\n`;
          break;

        case 'list_memories':
          const listData = result.data as any;
          response += `📋 **Memory List** (${listData.memories.length} of ${listData.total}):\n`;
          listData.memories.slice(0, 10).forEach((memory: any, i: number) => {
            response += `${i + 1}. **${memory.title}** (${memory.type})\n`;
          });
          if (listData.memories.length > 10) {
            response += `   ... and ${listData.memories.length - 10} more\n`;
          }
          break;

        case 'analyze_memory_stats':
          const statsData = result.data as any;
          response += `📊 **Memory Analysis:**\n`;
          response += `• Total memories: ${statsData.total}\n`;
          response += `• Memory types: ${Object.entries(statsData.byType).map(([type, count]) => `${type}(${count})`).join(', ')}\n`;
          response += `• Average content length: ${statsData.statistics.averageContentLength} characters\n`;
          response += `• Total unique tags: ${statsData.statistics.totalTags}\n`;
          if (statsData.topTags.length > 0) {
            response += `• Top tags: ${statsData.topTags.slice(0, 5).map(([tag, count]: any) => `${tag}(${count})`).join(', ')}\n`;
          }
          break;

        case 'check_service_health':
          const healthData = result.data as any;
          response += `🏥 **Service Health Check:**\n`;
          response += `• Total services: ${healthData.summary.total}\n`;
          response += `• Connected: ${healthData.summary.connected}\n`;
          response += `• Errors: ${healthData.summary.errors}\n\n`;
          healthData.services.forEach((service: any) => {
            const emoji = service.status === 'connected' ? '🟢' : service.status === 'error' ? '🔴' : '🟡';
            response += `${emoji} **${service.name}**: ${service.status}\n`;
            if (service.error) {
              response += `   Error: ${service.error}\n`;
            }
          });
          break;

        case 'navigate_to_page':
          const navData = result.data as any;
          response += `🧭 **Navigation**: ${navData.message}\n   URL: ${navData.url}\n`;
          break;

        default:
          response += `✅ **${toolCall.name}** completed successfully.\n`;
          if (result.data) {
            response += `   Result: ${JSON.stringify(result.data, null, 2)}\n`;
          }
      }

      response += "\n";
    });

    return response.trim();
  }

  getAvailableTools() {
    return getToolDefinitions();
  }
}

export const aiAgentService = new AIAgentService();