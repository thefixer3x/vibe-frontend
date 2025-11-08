#!/usr/bin/env node
/**
 * MCP Stdio-to-HTTP Wrapper
 * Translates stdio MCP protocol to HTTP requests for seyederick-mcp
 */

const readline = require('readline');
const https = require('https');

const API_URL = 'https://link.seyederick.com/mcp';
const API_KEY = 'lano_master_key_2024';

// Create readline interface for stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Log to stderr to avoid polluting stdout
function log(message) {
  console.error(`[MCP-Wrapper] ${message}`);
}

// Send HTTP request to MCP server
async function sendRequest(request) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const postData = JSON.stringify(request);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-API-Key': API_KEY
      }
    };

    const req = https.request(options, (res) => {
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
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Handle incoming messages
rl.on('line', async (line) => {
  if (!line.trim()) return;

  try {
    const request = JSON.parse(line);
    log(`Received: ${request.method}`);

    // Special handling for notifications (no response expected)
    if (request.method && request.method.startsWith('notifications/')) {
      log(`Ignoring notification: ${request.method}`);
      return;
    }

    // Send request to HTTP server
    const response = await sendRequest(request);

    // Write response to stdout
    console.log(JSON.stringify(response));
    log(`Sent response for: ${request.method}`);

  } catch (error) {
    log(`Error: ${error.message}`);

    // Try to get request ID from the line
    let requestId = null;
    try {
      const req = JSON.parse(line);
      requestId = req.id;
    } catch (e) {
      // Ignore
    }

    // Send error response
    const errorResponse = {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32603,
        message: error.message
      }
    };
    console.log(JSON.stringify(errorResponse));
  }
});

rl.on('close', () => {
  log('Connection closed');
  process.exit(0);
});

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, exiting...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, exiting...');
  process.exit(0);
});

log('MCP Stdio-to-HTTP Wrapper started');
log(`Connecting to: ${API_URL}`);
