'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { memoryClient } from '@/lib/memory/client';
import { getMCPClient } from '@/lib/mcp/client';
import { orchestratorService } from '@/lib/orchestrator/service';
import { Loader2, CheckCircle, XCircle, Zap } from 'lucide-react';

export default function MCPTestPage() {
  const [mcpStatus, setMcpStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mcpClient = getMCPClient();

  useEffect(() => {
    checkMCPStatus();
  }, []);

  const checkMCPStatus = async () => {
    const status = memoryClient.getMCPConnectionStatus();
    const aiStatus = await fetch('/api/health').then(r => r.json()).catch(() => ({ status: 'error' }));
    
    setMcpStatus({
      memory: status,
      orchestrator: orchestratorService?.getMCPStatus?.() || { connected: false, mode: 'disabled' },
      ai: aiStatus
    });
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const endTime = Date.now();
      
      setTestResults(prev => [...prev, {
        name: testName,
        success: true,
        result,
        time: endTime - startTime,
        timestamp: new Date()
      }]);
    } catch (error) {
      const endTime = Date.now();
      
      setTestResults(prev => [...prev, {
        name: testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        time: endTime - startTime,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const testMCPConnection = () => runTest('MCP Connection', async () => {
    const connected = await mcpClient.connect();
    return { connected, mode: mcpClient.getConnectionMode() };
  });

  const testMCPTools = () => runTest('List MCP Tools', async () => {
    const tools = await memoryClient.getMCPTools();
    return { count: tools.length, tools: tools.slice(0, 3) };
  });

  const testMemoryCreate = () => runTest('Create Memory (MCP)', async () => {
    const memory = await memoryClient.createMemory({
      title: 'MCP Test Memory',
      content: 'This is a test memory created via MCP',
      memory_type: 'context'
    });
    return { id: memory.id, title: memory.title };
  });

  const testMemorySearch = () => runTest('Search Memory (MCP)', async () => {
    const results = await memoryClient.searchMemories({
      query: 'test',
      limit: 5
    });
    return { total: results.total, found: results.results.length };
  });

  const clearResults = () => setTestResults([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MCP Integration Test</h1>
        <p className="text-gray-600 mt-2">Test Model Context Protocol integration across the platform</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2">
            Memory Client Status
          </h3>
          <div className="mt-2">
            <Badge variant={mcpStatus?.memory?.connected ? 'default' : 'secondary'}>
              {mcpStatus?.memory?.connected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected ({mcpStatus.memory.mode})
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">MCP Client Mode</h3>
          <div className="mt-2">
            <Badge variant="outline" className="border-purple-500 text-purple-700">
              <Zap className="w-3 h-3 mr-1" />
              {mcpStatus?.memory?.mode || 'Not configured'}
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">Environment</h3>
          <div className="mt-2 text-sm text-gray-600">
            {process.env.NEXT_PUBLIC_MCP_MODE || 'Default (auto)'}
          </div>
        </Card>
      </div>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Run Tests</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={testMCPConnection} disabled={isLoading}>
            Test MCP Connection
          </Button>
          <Button onClick={testMCPTools} disabled={isLoading}>
            List MCP Tools
          </Button>
          <Button onClick={testMemoryCreate} disabled={isLoading}>
            Create Test Memory
          </Button>
          <Button onClick={testMemorySearch} disabled={isLoading}>
            Search Memories
          </Button>
          <Button onClick={clearResults} variant="outline">
            Clear Results
          </Button>
        </div>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{result.time}ms</span>
                </div>
                <div className="mt-2 text-sm">
                  {result.success ? (
                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-red-600">{result.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Running test...</span>
        </div>
      )}
    </div>
  );
}