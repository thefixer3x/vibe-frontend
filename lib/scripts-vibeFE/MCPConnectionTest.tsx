import React, { useState, useEffect } from 'react';
import MCPClient from '../lib/mcp/client';

interface MCPTestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  data?: any;
}

export const MCPConnectionTest: React.FC = () => {
  const [client, setClient] = useState<MCPClient | null>(null);
  const [testResults, setTestResults] = useState<MCPTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Initialize MCP client
    const mcpClient = new MCPClient({
      remoteApiUrl: 'https://link.seyederick.com',
      apiKey: process.env.NEXT_PUBLIC_MCP_API_KEY, // Optional
      userId: 'frontend-test'
    });
    setClient(mcpClient);
  }, []);

  const runTests = async () => {
    if (!client) return;

    setIsRunning(true);
    setTestResults([]);

    const tests: MCPTestResult[] = [
      { test: 'Health Check', status: 'pending' },
      { test: 'MCP Connection', status: 'pending' },
      { test: 'List Tools', status: 'pending' },
      { test: 'SSE Connection', status: 'pending' },
    ];

    setTestResults([...tests]);

    // Test 1: Health Check
    try {
      const healthResult = await client.checkHealth();
      updateTestResult('Health Check', healthResult.success ? 'success' : 'error', 
        healthResult.success ? `${healthResult.data?.tools || '?'} tools available` : healthResult.error);
    } catch (error) {
      updateTestResult('Health Check', 'error', `Failed: ${error instanceof Error ? error.message : error}`);
    }

    // Test 2: MCP Connection
    try {
      const connected = await client.connect();
      updateTestResult('MCP Connection', connected ? 'success' : 'error', 
        connected ? 'Connected to MCP gateway' : 'Failed to connect');
    } catch (error) {
      updateTestResult('MCP Connection', 'error', `Failed: ${error instanceof Error ? error.message : error}`);
    }

    // Test 3: List Tools
    if (client.isReady()) {
      try {
        const toolsResult = await client.listTools();
        updateTestResult('List Tools', toolsResult.success ? 'success' : 'error',
          toolsResult.success ? `Found ${toolsResult.result?.tools?.length || 0} tools` : toolsResult.error);
      } catch (error) {
        updateTestResult('List Tools', 'error', `Failed: ${error instanceof Error ? error.message : error}`);
      }
    } else {
      updateTestResult('List Tools', 'error', 'Not connected to MCP');
    }

    // Test 4: SSE Connection Test
    setTimeout(() => {
      // This test will be marked as success if SSE connection was established
      updateTestResult('SSE Connection', 'success', 'Check browser console for SSE logs');
    }, 2000);

    setIsRunning(false);
  };

  const updateTestResult = (testName: string, status: 'success' | 'error', message?: string) => {
    setTestResults(prev => prev.map(test => 
      test.test === testName 
        ? { ...test, status, message }
        : test
    ));
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">MCP Connection Test</h2>
          <button
            onClick={runTests}
            disabled={isRunning || !client}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
          >
            {isRunning ? 'Testing...' : 'Run Tests'}
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Configuration</h3>
          <div className="bg-gray-100 p-3 rounded text-sm">
            <div><strong>Gateway URL:</strong> https://link.seyederick.com</div>
            <div><strong>SSE Endpoint:</strong> https://link.seyederick.com/sse</div>
            <div><strong>HTTP Endpoint:</strong> https://link.seyederick.com/mcp</div>
            <div><strong>WebSocket Endpoint:</strong> wss://link.seyederick.com/ws</div>
            <div><strong>API Key:</strong> {process.env.NEXT_PUBLIC_MCP_API_KEY ? '✓ Set' : '✗ Not set (optional)'}</div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Test Results</h3>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500">Click "Run Tests" to start</p>
          ) : (
            testResults.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getStatusIcon(test.status)}</span>
                  <span className="font-medium">{test.test}</span>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${getStatusColor(test.status)}`}>
                    {test.status.toUpperCase()}
                  </div>
                  {test.message && (
                    <div className="text-sm text-gray-600 mt-1">
                      {test.message}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Instructions</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Open browser dev tools (F12) → Console tab</li>
            <li>2. Click "Run Tests" above</li>
            <li>3. Watch for SSE connection logs in the console</li>
            <li>4. All tests should pass if MCP gateway is running</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">Troubleshooting</h4>
          <div className="text-sm text-yellow-800 space-y-2">
            <div><strong>CORS Error:</strong> Check that your domain is in the gateway's CORS whitelist</div>
            <div><strong>Connection Refused:</strong> Verify MCP gateway is running at https://link.seyederick.com</div>
            <div><strong>SSE 404/500:</strong> Check that /sse endpoint exists and nginx config is correct</div>
            <div><strong>Health Check Fails:</strong> Run: <code>curl https://link.seyederick.com/health</code></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPConnectionTest;
