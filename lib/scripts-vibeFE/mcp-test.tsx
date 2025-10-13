import React from 'react';
import Head from 'next/head';
import MCPConnectionTest from '../components/MCPConnectionTest';

export default function MCPTestPage() {
  return (
    <>
      <Head>
        <title>MCP Connection Test - Vibe Frontend</title>
        <meta name="description" content="Test connections to the MCP Gateway" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MCP Gateway Connection Test
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Testing connectivity to your Supabase MCP Server
            </p>
            <p className="text-sm text-gray-500">
              Gateway: <code className="bg-gray-200 px-2 py-1 rounded">https://link.seyederick.com</code>
            </p>
          </div>
          
          <MCPConnectionTest />
          
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Manual Testing Commands
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">1. Health Check</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    <code>curl https://link.seyederick.com/health</code>
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">2. Test SSE Connection</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    <code>curl -N https://link.seyederick.com/sse</code>
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">3. List Tools via HTTP</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    <code>{`curl -X POST https://link.seyederick.com/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</code>
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">4. Test WebSocket (Advanced)</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    <code>wscat -c wss://link.seyederick.com/ws</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-900 mb-4">
                Common Errors & Solutions
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-red-800">CORS Error</h3>
                  <p className="text-red-700 text-sm mb-2">
                    If you see "Access to fetch at '...' has been blocked by CORS policy"
                  </p>
                  <div className="bg-red-100 p-3 rounded text-sm">
                    <p><strong>Solution:</strong> Add your domain to the MCP gateway CORS whitelist</p>
                    <p>Edit: <code>/root/vibe-frontend/lib/mcp/gateway/unified-gateway.ts</code></p>
                    <p>Add your domain to the CORS origins array</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-red-800">Connection Refused (502/503/504)</h3>
                  <p className="text-red-700 text-sm mb-2">
                    Gateway is not running or not accessible
                  </p>
                  <div className="bg-red-100 p-3 rounded text-sm">
                    <p><strong>Solution:</strong> Restart the MCP gateway</p>
                    <p><code>pm2 restart unified-gateway</code></p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-red-800">SSE 404/500 Error</h3>
                  <p className="text-red-700 text-sm mb-2">
                    SSE endpoint not found or server error
                  </p>
                  <div className="bg-red-100 p-3 rounded text-sm">
                    <p><strong>Solution:</strong> Check nginx configuration</p>
                    <p>Verify: <code>/etc/nginx/sites-available/link.seyederick.com</code></p>
                    <p>Look for the <code>location /sse</code> block</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
