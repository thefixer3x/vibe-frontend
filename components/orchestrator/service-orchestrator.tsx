'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Zap, 
  Brain, 
  Database, 
  Globe,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from 'lucide-react';
import { getUnifiedServiceManager } from '@/lib/services/unified-service-manager';

interface WorkflowStep {
  id: string;
  name: string;
  service: string;
  action: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  duration?: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'draft' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: Date;
  lastRun?: Date;
  totalDuration?: number;
}

export function ServiceOrchestrator() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  
  const serviceManager = getUnifiedServiceManager();

  const availableServices = [
    { id: 'mcp', name: 'MCP Server', icon: Brain, capabilities: ['memory', 'ai-tools', 'semantic-search'] },
    { id: 'sse', name: 'SSE Service', icon: Globe, capabilities: ['real-time', 'notifications', 'events'] },
    { id: 'ws', name: 'WebSocket', icon: Database, capabilities: ['communication', 'bidirectional', 'low-latency'] }
  ];

  const availableActions = {
    mcp: [
      { id: 'memory_search', name: 'Search Memories', description: 'Semantic search across memory database' },
      { id: 'memory_create', name: 'Create Memory', description: 'Add new knowledge to memory system' },
      { id: 'memory_update', name: 'Update Memory', description: 'Modify existing memory entry' },
      { id: 'memory_delete', name: 'Delete Memory', description: 'Remove memory from database' },
      { id: 'ai_analysis', name: 'AI Analysis', description: 'Perform AI-powered analysis' }
    ],
    sse: [
      { id: 'send_notification', name: 'Send Notification', description: 'Push real-time notification' },
      { id: 'broadcast_event', name: 'Broadcast Event', description: 'Send event to all connected clients' },
      { id: 'update_status', name: 'Update Status', description: 'Update service status' }
    ],
    ws: [
      { id: 'send_message', name: 'Send Message', description: 'Send message to WebSocket clients' },
      { id: 'broadcast_data', name: 'Broadcast Data', description: 'Broadcast data to all connections' },
      { id: 'get_connections', name: 'Get Connections', description: 'List active WebSocket connections' }
    ]
  };

  const createNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      description: '',
      steps: [],
      status: 'draft',
      createdAt: new Date()
    };
    setCurrentWorkflow(newWorkflow);
  };

  const addStep = (serviceId: string, actionId: string) => {
    if (!currentWorkflow) return;

    const service = availableServices.find(s => s.id === serviceId);
    const action = availableActions[serviceId as keyof typeof availableActions]?.find(a => a.id === actionId);
    
    if (!service || !action) return;

    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: action.name,
      service: serviceId,
      action: actionId,
      parameters: {},
      status: 'pending'
    };

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newStep]
    });
  };

  const updateStepParameters = (stepId: string, parameters: Record<string, any>) => {
    if (!currentWorkflow) return;

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.map(step => 
        step.id === stepId ? { ...step, parameters } : step
      )
    });
  };

  const removeStep = (stepId: string) => {
    if (!currentWorkflow) return;

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.filter(step => step.id !== stepId)
    });
  };

  const executeWorkflow = async () => {
    if (!currentWorkflow || currentWorkflow.steps.length === 0) return;

    setIsExecuting(true);
    setExecutionLogs([]);
    
    const startTime = Date.now();
    const updatedWorkflow = { ...currentWorkflow, status: 'running' as const };
    setCurrentWorkflow(updatedWorkflow);

    try {
      for (let i = 0; i < currentWorkflow.steps.length; i++) {
        const step = currentWorkflow.steps[i];
        const stepStartTime = Date.now();
        
        // Update step status to running
        const runningStep = { ...step, status: 'running' as const };
        setCurrentWorkflow(prev => ({
          ...prev!,
          steps: prev!.steps.map(s => s.id === step.id ? runningStep : s)
        }));

        setExecutionLogs(prev => [...prev, `Executing step ${i + 1}: ${step.name}`]);

        try {
          const result = await serviceManager.executeServiceAction(
            step.service,
            step.action,
            step.parameters
          );

          const stepDuration = Date.now() - stepStartTime;
          const completedStep = { 
            ...runningStep, 
            status: 'completed' as const, 
            result,
            duration: stepDuration
          };

          setCurrentWorkflow(prev => ({
            ...prev!,
            steps: prev!.steps.map(s => s.id === step.id ? completedStep : s)
          }));

          setExecutionLogs(prev => [...prev, `✓ Step ${i + 1} completed in ${stepDuration}ms`]);

        } catch (error) {
          const stepDuration = Date.now() - stepStartTime;
          const failedStep = { 
            ...runningStep, 
            status: 'failed' as const, 
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: stepDuration
          };

          setCurrentWorkflow(prev => ({
            ...prev!,
            steps: prev!.steps.map(s => s.id === step.id ? failedStep : s)
          }));

          setExecutionLogs(prev => [...prev, `✗ Step ${i + 1} failed: ${failedStep.error}`]);
          break; // Stop execution on failure
        }
      }

      const totalDuration = Date.now() - startTime;
      const finalStatus = currentWorkflow.steps.every(s => s.status === 'completed') ? 'completed' : 'failed';
      
      setCurrentWorkflow(prev => ({
        ...prev!,
        status: finalStatus,
        lastRun: new Date(),
        totalDuration
      }));

      setExecutionLogs(prev => [...prev, `Workflow ${finalStatus} in ${totalDuration}ms`]);

    } catch (error) {
      setExecutionLogs(prev => [...prev, `Workflow execution failed: ${error}`]);
      setCurrentWorkflow(prev => ({ ...prev!, status: 'failed' as const }));
    } finally {
      setIsExecuting(false);
    }
  };

  const saveWorkflow = () => {
    if (!currentWorkflow) return;
    
    setWorkflows(prev => {
      const existing = prev.find(w => w.id === currentWorkflow.id);
      if (existing) {
        return prev.map(w => w.id === currentWorkflow.id ? currentWorkflow : w);
      } else {
        return [...prev, currentWorkflow];
      }
    });
  };

  const loadWorkflow = (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
  };

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Orchestration</h2>
          <p className="text-gray-600">Create and execute workflows across all your services</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={createNewWorkflow}>
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
          {currentWorkflow && (
            <Button onClick={saveWorkflow}>
              <Settings className="w-4 h-4 mr-2" />
              Save Workflow
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Builder */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Workflow Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentWorkflow ? (
                <>
                  <div>
                    <Input
                      placeholder="Workflow name"
                      value={currentWorkflow.name}
                      onChange={(e) => setCurrentWorkflow({...currentWorkflow, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      placeholder="Workflow description"
                      value={currentWorkflow.description}
                      onChange={(e) => setCurrentWorkflow({...currentWorkflow, description: e.target.value})}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Workflow Steps</h4>
                    {currentWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStepStatusIcon(step.status)}
                            <span className="font-medium">{step.name}</span>
                            <Badge variant="outline">{step.service}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeStep(step.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-sm text-gray-600">
                          {step.duration && `Duration: ${step.duration}ms`}
                          {step.error && <div className="text-red-600">Error: {step.error}</div>}
                        </div>
                      </div>
                    ))}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableServices.map(service => (
                        <div key={service.id} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <service.icon className="w-4 h-4" />
                            <span className="font-medium">{service.name}</span>
                          </div>
                          <div className="space-y-1">
                            {availableActions[service.id as keyof typeof availableActions]?.map(action => (
                              <Button
                                key={action.id}
                                size="sm"
                                variant="outline"
                                className="w-full justify-start text-xs"
                                onClick={() => addStep(service.id, action.id)}
                              >
                                {action.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={executeWorkflow}
                      disabled={isExecuting || currentWorkflow.steps.length === 0}
                      className="flex-1"
                    >
                      {isExecuting ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Execute Workflow
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Create a new workflow to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Execution Logs */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Execution Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-3 h-64 overflow-y-auto">
                {executionLogs.length > 0 ? (
                  <div className="space-y-1">
                    {executionLogs.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                        <span className="ml-2">{log}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Execution logs will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Saved Workflows */}
          {workflows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workflows.map(workflow => (
                    <div key={workflow.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{workflow.name}</h4>
                          <p className="text-sm text-gray-600">{workflow.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{workflow.steps.length} steps</Badge>
                            {workflow.lastRun && (
                              <span className="text-xs text-gray-500">
                                Last run: {workflow.lastRun.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => loadWorkflow(workflow)}>
                          Load
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
