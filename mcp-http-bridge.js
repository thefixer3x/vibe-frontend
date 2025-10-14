#!/usr/bin/env node

/**
 * MCP stdio-to-HTTP Bridge
 *
 * This bridge allows Claude Desktop (and other stdio-based MCP clients)
 * to connect to the Vibe-MCP Gateway HTTP API on port 7777.
 *
 * Usage in claude_desktop_config.json:
 * {
 *   "mcpServers": {
 *     "vibe-mcp": {
 *       "command": "node",
 *       "args": ["/root/vibe-frontend/mcp-http-bridge.js"]
 *     }
 *   }
 * }
 */

const http = require('http');
const https = require('https');
const readline = require('readline');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:7777/mcp';
const MCP_API_KEY = process.env.MCP_API_KEY || 'lano_master_key_2024';

// Setup stdio interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Log to stderr (Claude Desktop reads stdout for MCP messages)
function log(message) {
  console.error(`[MCP Bridge] ${message}`);
}

// Send JSON-RPC response to stdout
function sendResponse(data) {
  console.log(JSON.stringify(data));
}

// Forward JSON-RPC request to HTTP endpoint
async function forwardRequest(request) {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_SERVER_URL);
    const postData = JSON.stringify(request);

    // Use https module for https:// URLs
    const protocol = url.protocol === 'https:' ? https : http;
    const defaultPort = url.protocol === 'https:' ? 443 : 80;

    const options = {
      hostname: url.hostname,
      port: url.port || defaultPort,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-api-key': MCP_API_KEY
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`HTTP request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Process incoming JSON-RPC messages
rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    log(`Received request: ${request.method} (id: ${request.id})`);

    const response = await forwardRequest(request);
    log(`Forwarding response for id: ${request.id}`);

    sendResponse(response);
  } catch (error) {
    log(`Error: ${error.message}`);

    // Send JSON-RPC error response
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: error.message
      }
    };

    sendResponse(errorResponse);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down...');
  process.exit(0);
});

log(`MCP HTTP Bridge started`);
log(`Forwarding to: ${MCP_SERVER_URL}`);
log(`API Key: ${MCP_API_KEY.substring(0, 10)}...`);
