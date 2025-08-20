import { executeToolCall, getToolDefinitions, ToolCall, ToolResult } from './tools';
import { getMCPClient } from '@/lib/mcp/client';

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
  mcpMode?: 'local' | 'remote' | 'disabled' | 'disconnected';
}

class AIAgentService {
  private systemPrompt = `You are a Memory Assistant AI agent with access to a comprehensive memory management system through MCP (Model Context Protocol). You can help users:

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

You have access to both MCP tools (when available) and standard tools. MCP provides a more efficient and standardized way to interact with memory services.

Always be helpful, accurate, and provide context for your responses. If you use tools, explain what you're doing and why.`;

  private mcpClient = getMCPClient();
  private useMCP = true;

  constructor() {
    // Initialize MCP connection
    this.initializeMCP();
  }

  private async initializeMCP() {
    try {
      const connected = await this.mcpClient.connect();
      if (connected) {
        console.log('AI Agent: MCP connected, mode:', this.mcpClient.getConnectionMode());
      }
    } catch (error) {
      console.warn('AI Agent: MCP connection failed, will use fallback tools', error);
      this.useMCP = false;
    }
  }

  private async callMCPTool(toolName: string, args: any): Promise<ToolResult> {
    try {
      const result = await this.mcpClient.callTool({
        name: toolName,
        arguments: args
      });

      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'MCP tool call failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeMCPOrFallback(toolCall: ToolCall): Promise<ToolResult> {
    // Map standard tool names to MCP tool names
    const toolMapping: Record<string, string> = {
      'search_memories': 'memory_search_memories',
      'create_memory': 'memory_create_memory',
      'list_memories': 'memory_list_memories',
      'get_memory': 'memory_get_memory',
      'update_memory': 'memory_update_memory',
      'delete_memory': 'memory_delete_memory'
    };

    const mcpToolName = toolMapping[toolCall.name];
    
    if (this.useMCP && mcpToolName && this.mcpClient.isConnectedToServer()) {
      // Try MCP first
      const mcpResult = await this.callMCPTool(mcpToolName, toolCall.arguments);
      if (mcpResult.success) {
        return mcpResult;
      }
      // Fall through to standard tool if MCP fails
      console.warn(`MCP tool ${mcpToolName} failed, falling back to standard tool`);
    }

    // Use standard tool execution
    return await executeToolCall(toolCall);
  }

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
              memory_type: 'context'
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

    if (query.includes('stats') || query.includes('statistic')) {
      return {
        content: "I'll get your memory statistics.",
        tool_calls: [{
          name: 'get_stats',
          arguments: {}
        }]
      };
    }

    if (query.includes('health') || query.includes('status')) {
      return {
        content: "I'll check the system health status.",
        tool_calls: [{
          name: 'check_health',
          arguments: {}
        }]
      };
    }

    if (query.includes('mcp') && (query.includes('status') || query.includes('connection'))) {
      const mcpStatus = this.mcpClient.getConnectionMode();
      return {
        content: `MCP is currently ${mcpStatus === 'disconnected' ? 'disconnected' : `connected in ${mcpStatus} mode`}.`
      };
    }

    if (query.includes('tools') || query.includes('capabilities')) {
      if (this.useMCP && this.mcpClient.isConnectedToServer()) {
        try {
          const mcpTools = await this.mcpClient.listTools();
          return {
            content: `I have access to ${mcpTools.length} MCP tools for memory management:\n${mcpTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}`
          };
        } catch (error) {
          // Fall through to standard tools
        }
      }
      
      const tools = getToolDefinitions();
      return {
        content: `I have access to ${tools.length} tools:\n${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}`
      };
    }

    if (query.includes('dashboard') || query.includes('navigate')) {
      const target = query.includes('memory') ? 'memory-dashboard' : 'dashboard';
      return {
        content: `I'll navigate you to the ${target}.`,
        tool_calls: [{
          name: 'navigate',
          arguments: { target }
        }]
      };
    }

    // Default response
    return {
      content: `I understand you're asking about: "${lastUserMessage.content}". I can help you search memories, create new ones, view statistics, or navigate the application. What would you like to do?`
    };
  }

  async processMessage(
    userMessage: string,
    conversationHistory: Message[] = []
  ): Promise<AgentResponse> {
    // Add system prompt if not present
    if (conversationHistory.length === 0 || conversationHistory[0].role !== 'system') {
      conversationHistory = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory
      ];
    }

    // Add user message
    conversationHistory.push({ role: 'user', content: userMessage });

    try {
      // Get LLM response
      const llmResponse = await this.mockLLMCall(conversationHistory);
      
      // Execute tool calls if any
      let toolResults: ToolResult[] = [];
      if (llmResponse.tool_calls && llmResponse.tool_calls.length > 0) {
        for (const toolCall of llmResponse.tool_calls) {
          const result = await this.executeMCPOrFallback(toolCall);
          toolResults.push(result);
        }
      }

      return {
        message: llmResponse.content,
        toolCalls: llmResponse.tool_calls,
        toolResults,
        confidence: 0.8,
        mcpMode: this.mcpClient.getConnectionMode()
      };
    } catch (error) {
      return {
        message: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0.1,
        mcpMode: 'disabled'
      };
    }
  }

  async getAvailableTools() {
    const tools = [];
    
    // Get MCP tools if available
    if (this.useMCP && this.mcpClient.isConnectedToServer()) {
      try {
        const mcpTools = await this.mcpClient.listTools();
        tools.push(...mcpTools.map(t => ({
          ...t,
          source: 'mcp' as const
        })));
      } catch (error) {
        console.warn('Failed to get MCP tools:', error);
      }
    }
    
    // Always include standard tools as fallback
    const standardTools = getToolDefinitions();
    tools.push(...standardTools.map(t => ({
      ...t,
      source: 'standard' as const
    })));
    
    return tools;
  }

  getMCPStatus() {
    return {
      connected: this.mcpClient.isConnectedToServer(),
      mode: this.mcpClient.getConnectionMode(),
      enabled: this.useMCP
    };
  }

  async reconnectMCP() {
    this.useMCP = true;
    await this.initializeMCP();
  }
}

export const aiAgentService = new AIAgentService();