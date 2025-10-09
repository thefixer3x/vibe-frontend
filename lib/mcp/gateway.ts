#!/usr/bin/env tsx

/**
 * Vibe Frontend MCP Gateway
 * 
 * Simple gateway that exposes MCP tools via HTTP API
 */

import { createServer } from 'http';
import { parse } from 'url';

// Configuration
const UNIFIED_GATEWAY_URL = process.env.UNIFIED_GATEWAY_URL || 'http://localhost:7777/mcp';

// Log configuration
console.log('_gateway URL:', UNIFIED_GATEWAY_URL);

// HTTP server
const server = createServer(async (req, res) => {
  const parsedUrl = parse(req.url!, true);
  const { pathname, query } = parsedUrl;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'vibe-frontend-mcp-gateway',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // MCP endpoint
  if (pathname === '/mcp' && req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const request = JSON.parse(body);
          const { method, params, id } = request;
          
          if (method === 'tools/list') {
            console.log('Listing tools...');
            const tools = await mcpClient.listTools();
            console.log('Found', tools.length, 'tools');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id,
              result: { tools }
            }));
          } else if (method === 'tools/call') {
            console.log('Calling tool:', params.name);
            const toolCall = params;
            const result = await mcpClient.callTool(toolCall);
            console.log('Tool result:', JSON.stringify(result).substring(0, 200) + '...');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id,
              result
            }));
          } else {
            console.log('Unknown method:', method);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: `Method not found: ${method}`
              }
            }));
          }
        } catch (error) {
          console.error('Error processing request:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32603,
              message: 'Internal error'
            }
          }));
        }
      });
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error'
        }
      }));
    }
    return;
  }
  
  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found'
  }));
});

const PORT = process.env.PORT || 3002;

server.listen(PORT, async () => {
  console.log(`🚀 Vibe Frontend MCP Gateway listening on port ${PORT}`);
  await initialize();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
