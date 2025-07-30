'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orchestratorService, OrchestratorResult, OrchestratorCommand } from '@/lib/orchestrator/service';
import { aiAgentService, Message as AIMessage } from '@/lib/ai-agent/service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, Loader2, CheckCircle, XCircle, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'system' | 'result' | 'error' | 'ai-assistant';
  content: string;
  timestamp: Date;
  command?: OrchestratorCommand;
  result?: OrchestratorResult;
  toolCalls?: any[];
  confidence?: number;
}

interface OrchestratorInterfaceProps {
  className?: string;
  onCommandExecuted?: (result: OrchestratorResult) => void;
  placeholder?: string;
  disabled?: boolean;
  showServiceStatus?: boolean;
  useAIAgent?: boolean;
}

export function OrchestratorInterface({
  className = '',
  onCommandExecuted,
  placeholder = 'Type a command... (e.g., "search for project notes", "create memory", "open dashboard")',
  disabled = false,
  showServiceStatus = true,
  useAIAgent = true
}: OrchestratorInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [commandPreview, setCommandPreview] = useState<OrchestratorCommand | null>(null);
  const [serviceStatuses, setServiceStatuses] = useState<any[]>([]);
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]);
  const [mode, setMode] = useState<'orchestrator' | 'ai-agent'>(useAIAgent ? 'ai-agent' : 'orchestrator');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message and check service status
    if (messages.length === 0) {
      const welcomeMessage = mode === 'ai-agent' ? 
        `🤖 **AI Memory Agent Ready**

I'm your intelligent assistant with advanced tool calling capabilities. I can:

• **Search memories**: "search for API documentation"
• **Create memories**: "create memory about today's meeting"  
• **Analyze data**: "analyze my memory statistics"
• **Navigate app**: "open memory visualizer"
• **System health**: "check service status"
• **Memory management**: "list my project memories"

I'll use the appropriate tools to help you accomplish your tasks!` :
        `🧠 **Memory Orchestrator Ready**
        
Try natural language commands like:
• "search for API documentation"
• "create memory about today's meeting"  
• "show my project memories"
• "open memory dashboard"
• "check service status"
• "list my memories"

Type your command below and press Enter!`;

      addMessage({
        type: 'system',
        content: welcomeMessage,
      });
      
      if (showServiceStatus) {
        checkServices();
      }
    }
  }, [mode]);

  const checkServices = async () => {
    try {
      const statuses = await orchestratorService.getAllServiceStatuses();
      setServiceStatuses(statuses);
    } catch (error) {
      console.error('Failed to check service status:', error);
    }
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleInputChange = async (value: string) => {
    setInput(value);
    
    // Show command preview for non-empty input
    if (value.trim() && value.length > 3) {
      try {
        const preview = orchestratorService.parseCommand(value);
        setCommandPreview(preview);
        setShowPreview(true);
      } catch {
        setCommandPreview(null);
        setShowPreview(false);
      }
    } else {
      setShowPreview(false);
      setCommandPreview(null);
    }
  };

  const executeCommand = async (command: string) => {
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    setShowPreview(false);
    setInput('');

    // Add user message
    addMessage({
      type: 'user',
      content: command,
    });

    try {
      if (mode === 'ai-agent') {
        // Use AI Agent with tool calling
        const agentResponse = await aiAgentService.processMessage(command, conversationHistory);
        
        // Update conversation history
        const newHistory: AIMessage[] = [
          ...conversationHistory,
          { role: 'user', content: command },
          { role: 'assistant', content: agentResponse.message }
        ];
        setConversationHistory(newHistory);

        // Add AI assistant response
        addMessage({
          type: 'ai-assistant',
          content: agentResponse.message,
          toolCalls: agentResponse.toolCalls,
          confidence: agentResponse.confidence
        });

        // Handle navigation tool calls
        if (agentResponse.toolCalls) {
          const navCall = agentResponse.toolCalls.find(tc => tc.name === 'navigate_to_page');
          if (navCall && agentResponse.toolResults) {
            const navResult = agentResponse.toolResults.find(r => r.success);
            const url = navResult?.data && typeof navResult.data === 'object' && 'url' in navResult.data 
              ? navResult.data.url as string : null;
            if (url) {
              setTimeout(() => {
                router.push(url);
              }, 1000);
            }
          }
        }
      } else {
        // Use traditional orchestrator
        const result = await orchestratorService.processNaturalLanguage(command);
        
        if (result.success) {
          // Add success result
          addMessage({
            type: 'result',
            content: formatSuccessResult(result),
            command: result.command,
            result,
          });

          // Handle UI navigation
          if (result.command.tool === 'ui' && result.command.action === 'navigate') {
            const url = result.data?.url as string;
            if (url) {
              setTimeout(() => {
                router.push(url);
              }, 1000);
            }
          }

          // Update service status if health check was performed
          if (result.command.tool === 'orchestrator' && result.command.action === 'check-health') {
            setServiceStatuses(result.data?.services as any[] || []);
          }

          // Callback for parent component
          if (onCommandExecuted) {
            onCommandExecuted(result);
          }
        } else {
          // Add error message
          addMessage({
            type: 'error',
            content: `❌ **Error**: ${result.error}`,
            command: result.command,
            result,
          });
        }
      }
    } catch (error) {
      addMessage({
        type: 'error',
        content: `❌ **Unexpected Error**: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const formatSuccessResult = (result: OrchestratorResult): string => {
    const { command, data, executionTime } = result;
    
    let content = `✅ **${command.tool}.${command.action}** (${executionTime}ms)`;
    
    // Format based on command type
    switch (command.tool) {
      case 'memory':
        content += data ? formatMemoryResult(command.action, data) : '';
        break;
      case 'ui':
        content += data ? formatUIResult(command.action, data) : '';
        break;
      case 'orchestrator':
        content += data ? formatOrchestratorResult(command.action, data) : '';
        break;
      default:
        if (data) {
          content += `\n\n${JSON.stringify(data, null, 2)}`;
        }
    }
    
    return content;
  };

  const formatMemoryResult = (action: string, data: Record<string, unknown>): string => {
    switch (action) {
      case 'search':
        if (Array.isArray(data.memories) && data.memories.length > 0) {
          return `\n\nFound **${data.memories.length}** memories:\n${data.memories.map((m: any) => 
            `• **${m.title}** (${m.type}) - ${String(m.content).substring(0, 100)}...`
          ).join('\n')}`;
        }
        return '\n\nNo memories found matching your query.';
        
      case 'create':
        return `\n\n**Created**: "${data.title}" (ID: ${data.id})`;
        
      case 'list':
        if (Array.isArray(data.memories) && data.memories.length > 0) {
          return `\n\n**${data.memories.length} memories**:\n${data.memories.map((m: any) => 
            `• ${m.title} (${m.type})`
          ).join('\n')}`;
        }
        return '\n\nNo memories found.';
        
      case 'stats':
        return `\n\n**Memory Statistics**:\n• Total: ${data.total_memories}\n• By Type: ${JSON.stringify(data.by_type, null, 2)}`;
        
      default:
        return data ? `\n\n${JSON.stringify(data, null, 2)}` : '';
    }
  };

  const formatUIResult = (action: string, data: Record<string, unknown>): string => {
    switch (action) {
      case 'navigate':
        return `\n\n${data.message}\n🔗 Navigating to ${data.url}...`;
      default:
        return data?.message ? `\n\n${data.message}` : '';
    }
  };

  const formatOrchestratorResult = (action: string, data: Record<string, unknown>): string => {
    if (action === 'check-health' && data.services && Array.isArray(data.services)) {
      const summary = data.summary as any;
      let result = `\n\n**Service Health Check**:\n• Total Services: ${summary.total}\n• Connected: ${summary.connected}\n• Errors: ${summary.errors}\n\n`;
      
      result += data.services.map((service: any) => {
        const statusIcon = service.status === 'connected' ? '🟢' : service.status === 'error' ? '🔴' : '🟡';
        return `${statusIcon} **${service.name}**: ${service.status}${service.error ? ` (${service.error})` : ''}`;
      }).join('\n');
      
      return result;
    }
    return data ? `\n\n${JSON.stringify(data, null, 2)}` : '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand(input);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const examples = mode === 'ai-agent' ? [
    'search for API documentation',
    'create memory "Meeting Notes" "Discussed project timeline and deliverables"',
    'analyze my memory statistics',
    'open memory visualizer', 
    'check service status',
    'list my project memories'
  ] : [
    'search for API documentation',
    'create memory "Meeting Notes" "Discussed project timeline and deliverables"',
    'show my project memories',
    'open memory dashboard',
    'check service status',
    'list my memories'
  ];

  return (
    <div className={`flex flex-col h-full bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          {mode === 'ai-agent' ? (
            <Bot className="w-5 h-5 text-purple-500" />
          ) : (
            <Brain className="w-5 h-5 text-blue-500" />
          )}
          <h3 className="font-semibold text-gray-900">
            {mode === 'ai-agent' ? 'AI Memory Agent' : 'Memory Orchestrator'}
          </h3>
          {useAIAgent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode(mode === 'ai-agent' ? 'orchestrator' : 'ai-agent')}
              className="ml-2"
            >
              {mode === 'ai-agent' ? 'Switch to Orchestrator' : 'Switch to AI Agent'}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showServiceStatus && serviceStatuses.length > 0 && (
            <div className="flex gap-1">
              {serviceStatuses.map((service) => (
                <Badge
                  key={service.name}
                  variant={service.status === 'connected' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {service.status === 'connected' ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {service.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-500">
            {mode === 'ai-agent' ? 'AI Tool Calling' : 'Natural Language Commands'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : message.type === 'system'
                  ? 'bg-gray-50 text-gray-700 border'
                  : message.type === 'ai-assistant'
                  ? 'bg-purple-50 text-purple-900 border border-purple-200'
                  : 'bg-green-50 text-green-900 border border-green-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'ai-assistant' && (
                  <Bot className="w-4 h-4 mt-0.5 text-purple-600" />
                )}
                {message.type === 'user' && (
                  <User className="w-4 h-4 mt-0.5 text-white" />
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  {message.command && (
                    <div className="mt-2 text-xs opacity-70">
                      Confidence: {Math.round((message.command.confidence || 0) * 100)}%
                    </div>
                  )}
                  {message.confidence !== undefined && (
                    <div className="mt-2 text-xs opacity-70">
                      AI Confidence: {Math.round(message.confidence * 100)}%
                    </div>
                  )}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs opacity-70 mb-1">Tool Calls:</div>
                      <div className="flex flex-wrap gap-1">
                        {message.toolCalls.map((toolCall, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {toolCall.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Command Preview */}
      {showPreview && commandPreview && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <div className="text-xs text-blue-700">
            <strong>Preview:</strong> {commandPreview.tool}.{commandPreview.action} 
            <span className="ml-2 text-blue-500">
              ({Math.round((commandPreview.confidence || 0) * 100)}% confidence)
            </span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <Button
            onClick={() => executeCommand(input)}
            disabled={!input.trim() || isProcessing}
            size="sm"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Examples */}
        {messages.length <= 1 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-2">Try these examples:</div>
            <div className="flex flex-wrap gap-1">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}