'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LightBulbIcon, 
  ChatBubbleLeftIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { ActionCategory, BusinessDomain, WorkflowNode, AISuggestion } from '@/lib/orchestrator/types';

interface AIGuidancePanelProps {
  currentWorkflow: WorkflowNode[];
  domain?: BusinessDomain;
  onAcceptSuggestion: (suggestion: AISuggestion) => void;
  onUserQuery: (query: string) => void;
  className?: string;
}


export function AIGuidancePanel({ 
  currentWorkflow, 
  domain, 
  onAcceptSuggestion, 
  onUserQuery,
  className = '' 
}: AIGuidancePanelProps) {
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'ai';
    message: string;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    analyzeWorkflowAndProvideSuggestions();
  }, [currentWorkflow, domain]);

  const analyzeWorkflowAndProvideSuggestions = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis - replace with actual AI service call
      const suggestions = await generateAISuggestions(currentWorkflow, domain);
      setAISuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUserQuery = async () => {
    if (!userQuery.trim()) return;

    const timestamp = new Date().toISOString();
    const newUserMessage = { type: 'user' as const, message: userQuery, timestamp };
    
    setConversationHistory(prev => [...prev, newUserMessage]);
    onUserQuery(userQuery);

    // Simulate AI response - replace with actual AI service call
    const aiResponse = await generateAIResponse(userQuery, currentWorkflow, domain);
    const aiMessage = { type: 'ai' as const, message: aiResponse, timestamp };
    
    setConversationHistory(prev => [...prev, aiMessage]);
    setUserQuery('');
  };

  const handleAcceptSuggestion = (suggestion: AISuggestion) => {
    onAcceptSuggestion(suggestion);
    setAISuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const getSuggestionIcon = (type: AISuggestion['suggestion_type']) => {
    switch (type) {
      case 'optimization':
        return <SparklesIcon className="h-4 w-4" />;
      case 'error_prevention':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'alternative_path':
        return <ArrowRightIcon className="h-4 w-4" />;
      default:
        return <LightBulbIcon className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (type: AISuggestion['suggestion_type']) => {
    switch (type) {
      case 'optimization':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'error_prevention':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'alternative_path':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`ai-guidance-panel space-y-4 ${className}`}>
      {/* AI Assistant Chat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ChatBubbleLeftIcon className="h-5 w-5" />
            AI Process Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conversation History */}
          <ScrollArea className="h-48 w-full border rounded-md p-3">
            {conversationHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask me anything about building your workflow! I can help with:
                <br />• Suggesting next steps
                <br />• Optimizing processes
                <br />• Identifying potential issues
                <br />• Recommending best practices
              </p>
            ) : (
              <div className="space-y-3">
                {conversationHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-2 text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Query Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask the AI assistant for help with your workflow..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleUserQuery();
                }
              }}
              className="min-h-[80px]"
            />
            <Button 
              onClick={handleUserQuery} 
              disabled={!userQuery.trim()}
              size="sm"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LightBulbIcon className="h-5 w-5" />
            Smart Suggestions
            {isAnalyzing && (
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isAnalyzing 
                ? 'Analyzing your workflow for optimization opportunities...'
                : 'No suggestions available. Add some actions to your workflow to get AI recommendations.'}
            </p>
          ) : (
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getSuggestionColor(suggestion.suggestion_type)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSuggestionIcon(suggestion.suggestion_type)}
                        <Badge variant="outline" className="text-xs">
                          {suggestion.suggestion_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.confidence_score}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span>Impact: {suggestion.potential_impact}</span>
                        <span>Effort: {suggestion.implementation_effort}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcceptSuggestion(suggestion)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Health Check */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircleIcon className="h-5 w-5" />
            Process Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProcessHealthIndicators workflow={currentWorkflow} />
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessHealthIndicators({ workflow }: { workflow: WorkflowNode[] }) {
  const healthChecks = [
    {
      name: 'Error Handling',
      status: workflow.some(node => node.data.configuration?.error_handling) ? 'good' : 'warning',
      description: workflow.some(node => node.data.configuration?.error_handling) 
        ? 'Error handling configured' 
        : 'Consider adding error handling to critical steps'
    },
    {
      name: 'User Experience',
      status: workflow.some(node => node.type === ActionCategory.USER_INPUT_REQUEST) ? 'good' : 'info',
      description: 'User interaction points identified'
    },
    {
      name: 'Parallel Processing',
      status: workflow.length > 3 ? 'warning' : 'good',
      description: workflow.length > 3 
        ? 'Consider parallel execution for better performance' 
        : 'Workflow complexity is optimal'
    },
    {
      name: 'Monitoring',
      status: 'warning',
      description: 'Add monitoring and analytics for production use'
    }
  ];

  return (
    <div className="space-y-3">
      {healthChecks.map((check, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              check.status === 'good' ? 'bg-green-500' :
              check.status === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`} />
            <span className="text-sm font-medium">{check.name}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {check.status}
          </Badge>
        </div>
      ))}
      <div className="pt-2 text-xs text-muted-foreground">
        {workflow.length} actions configured
      </div>
    </div>
  );
}

// Mock AI functions - replace with actual AI service calls
async function generateAISuggestions(
  workflow: WorkflowNode[], 
  domain?: BusinessDomain
): Promise<AISuggestion[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const suggestions: AISuggestion[] = [];

  // Add domain-specific suggestions
  if (domain === BusinessDomain.HR && workflow.length > 0) {
    suggestions.push({
      suggestion_type: 'optimization',
      description: 'Consider adding automated HRIS integration to streamline employee data management',
      confidence_score: 85,
      potential_impact: 'high',
      implementation_effort: 'moderate'
    });
  }

  if (workflow.length > 2 && !workflow.some(n => n.type === ActionCategory.APPROVAL_WORKFLOW)) {
    suggestions.push({
      suggestion_type: 'error_prevention',
      description: 'Add approval checkpoints to prevent unauthorized process execution',
      confidence_score: 92,
      potential_impact: 'medium',
      implementation_effort: 'easy'
    });
  }

  if (workflow.length > 4) {
    suggestions.push({
      suggestion_type: 'optimization',
      description: 'Group independent actions for parallel execution to improve performance',
      confidence_score: 78,
      potential_impact: 'medium',
      implementation_effort: 'easy'
    });
  }

  return suggestions;
}

async function generateAIResponse(
  query: string, 
  workflow: WorkflowNode[], 
  domain?: BusinessDomain
): Promise<string> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock responses based on query content
  if (query.toLowerCase().includes('optimize')) {
    return 'To optimize your workflow, I recommend: 1) Adding parallel execution for independent tasks, 2) Implementing caching for frequently accessed data, and 3) Setting up monitoring to identify bottlenecks.';
  }

  if (query.toLowerCase().includes('error') || query.toLowerCase().includes('fail')) {
    return 'For robust error handling, consider: 1) Adding retry logic with exponential backoff, 2) Implementing fallback actions, 3) Setting up notifications for critical failures, and 4) Creating manual intervention points for complex decisions.';
  }

  if (query.toLowerCase().includes('user') || query.toLowerCase().includes('approval')) {
    return 'For user interactions, I suggest: 1) Clear approval workflows with defined SLAs, 2) Multiple notification channels (email, Slack, dashboard), 3) Escalation rules for timeouts, and 4) Mobile-friendly approval interfaces.';
  }

  return `Based on your ${domain || 'business'} workflow with ${workflow.length} actions, I can help you improve efficiency, add error handling, optimize user experience, or integrate with additional systems. What specific aspect would you like to focus on?`;
}