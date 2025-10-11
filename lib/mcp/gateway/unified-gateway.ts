#!/usr/bin/env node

// @ts-nocheck
/**
 * Unified MCP Gateway
 *
 * Aggregates multiple MCP sources into a single endpoint:
 * - Local mcp-core (18 tools)
 * - Context7 documentation
 * - onasis-gateway (17 Credit tools)
 * - Any other MCP tools
 *
 * Single port access: http://localhost:3008/mcp
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import winston from 'winston';
import axios from 'axios';
import dotenv from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';
import type { RawData } from 'ws';
import { randomUUID } from 'crypto';
import { Pool, PoolClient } from 'pg';

// Type definitions
interface BaseSourceConfig {
  url: string;
  name: string;
  tools: number;
  categories: string[];
  protocols?: { stdio: number; http: number; websocket: number; sse: number };
  endpoint?: string;
  callEndpoint?: string;
  responseFormat?: string;
  database?: string;
  enabled?: boolean;
  protocol?: "stdio" | "http" | "websocket" | "sse";
  connection?: unknown;
  bridge?: unknown;
}

interface WebSocketMCPConnection {
  connect(): Promise<void>;
  close(): void;
  url: string;
  sourceId: string;
  ws: WebSocket | null;
  tools: Record<string, unknown>;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  connected: boolean;
}

type SourceKey = 'core' | 'quick-auth' | 'neon' | 'appstore';

// Load environment variables from vibe-frontend root
dotenv.config({ path: '/root/vibe-frontend/.env.local' });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/var/log/mcp-gateway.log' })
  ]
});

// Database connection pooling for SSE workloads (Neon / Postgres)
const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL
  || process.env.POSTGRES_URL
  || process.env.DATABASE_URL
  || process.env.POSTGRESQL_URL;

const dbPool = NEON_DATABASE_URL
  ? new Pool({
      connectionString: NEON_DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '5000', 10),
      maxUses: parseInt(process.env.DB_POOL_MAX_USES || '7500', 10),
      ssl: { rejectUnauthorized: false }
    })
  : null;

if (dbPool) {
  dbPool.on('error', (error) => {
    logger.error('Database pool error:', error);
  });
}

const app = express();
const PRIMARY_PORT = parseInt(process.env.PRIMARY_PORT || process.env.PORT || '7777');
const FALLBACK_PORT = parseInt(process.env.FALLBACK_PORT || '7778');
const ENABLE_PRIMARY = process.env.ENABLE_PRIMARY !== 'false';
const ENABLE_FALLBACK = process.env.ENABLE_FALLBACK !== 'false';

// Create HTTP server for both Express and WebSocket
import { createServer } from 'http';
const primaryServer = createServer(app);
const fallbackServer = createServer(app);

// Graceful error handling for port conflicts and server errors
primaryServer.on('error', (err: unknown) => {
  const error = err instanceof Error ? err : new Error(String(err));
  if (error && 'code' in error && error.code === 'EADDRINUSE') {
    logger.warn(`Primary port ${PRIMARY_PORT} is already in use. Continuing with fallback port ${FALLBACK_PORT} only.`);
  } else {
    logger.error('Primary server error:', error.message);
    // Non-port errors should still crash to avoid undefined state
    process.exit(1);
  }
});

fallbackServer.on('error', (err: unknown) => {
  const error = err instanceof Error ? err : new Error(String(err));
  if (error && 'code' in error && error.code === 'EADDRINUSE') {
    logger.error(`Fallback port ${FALLBACK_PORT} is already in use. No available ports to bind.`);
  } else {
    logger.error('Fallback server error:', error.message);
  }
});

// Create WebSocket servers for incoming MCP connections
const primaryWss = new WebSocketServer({
  server: primaryServer,
  path: '/ws'
});

const fallbackWss = new WebSocketServer({
  server: fallbackServer,
  path: '/ws'
});

// API Key Authentication
const API_KEYS = new Set([
  process.env.MASTER_API_KEY || 'lano_master_key_2024',
  process.env.VIBE_API_KEY || 'vibe_frontend_key_2024'
]);

// API Key validation middleware (optional for public endpoints)
function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || !API_KEYS.has(apiKey)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required. Get your key at https://link.seyederick.com'
    });
  }

  next();
}

// Handle WebSocket MCP connections
function handleWebSocketConnection(ws: WebSocket, serverPort: number) {
  logger.info(`New WebSocket client connected on port ${serverPort}`);

  ws.on('message', async (message: RawData) => {
    try {
      const request = JSON.parse(message.toString());
      const { method, params, id } = request;

      if (method === 'initialize') {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: false },
              prompts: { listChanged: false },
              resources: { subscribe: false, listChanged: false }
            },
            serverInfo: {
              name: 'seyederick-mcp',
              version: '1.0.0'
            }
          }
        }));
      } else if (method === 'tools/list') {
        const { tools, sources } = await aggregateTools();
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            tools,
            _meta: {
              gateway: 'mcp-unified-gateway',
              port: serverPort,
              sources,
              totalTools: tools.length,
              timestamp: new Date().toISOString()
            }
          }
        }));
      } else if (method === 'tools/call') {
        const toolName = params.name;
        const [sourceId] = toolName.split('_');
        const originalToolName = toolName.substring(sourceId.length + 1);

        const source = mcpSources[sourceId];
        if (!source) {
          throw new Error(`Unknown source: ${sourceId}`);
        }

        let result;

        if (source.protocol === 'websocket' && source.connection) {
          if (!source.connection.connected) {
            throw new Error(`WebSocket connection to ${sourceId} is not available`);
          }
          result = await source.connection.callTool(originalToolName, params.arguments);
        } else if (source.bridge) {
          result = await source.bridge.executeTool(originalToolName, params.arguments);
        } else {
          const toolResponse = await axios.post(`${source.url}/mcp`, {
            jsonrpc: '2.0',
            id,
            method: 'tools/call',
            params: {
              ...params,
              name: originalToolName
            }
          });
          result = toolResponse.data.result;
        }

        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id,
          result
        }));
      } else {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        }));
      }
    } catch (error) {
      logger.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error.message
        }
      }));
    }
  });

  ws.on('close', () => {
    logger.info(`WebSocket client disconnected from port ${serverPort}`);
  });

  ws.on('error', (error) => {
    logger.error(`WebSocket error on port ${serverPort}:`, error.message);
  });
}

primaryWss.on('connection', (ws) => handleWebSocketConnection(ws, PRIMARY_PORT));
fallbackWss.on('connection', (ws) => handleWebSocketConnection(ws, FALLBACK_PORT));

// Middleware
app.use(cors({
  origin: [
    'https://vibe.seyederick.com',
    'https://link.seyederick.com',
    'https://dashboard.lanonasis.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// WebSocket connection manager
class WebSocketMCPConnection {
  url: string;
  sourceId: string;
  ws: WebSocket | null;
  connected: boolean;
  tools: Record<string, unknown>;
  reconnectAttempts: number;
  maxReconnectAttempts: number;

  constructor(url: string, sourceId: string) {
    this.url = url;
    this.sourceId = sourceId;
    this.ws = null;
    this.connected = false;
    this.tools = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  async connect() {
    try {
      this.ws = new WebSocket(this.url);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws.on('open', async () => {
          clearTimeout(timeout);
          this.connected = true;
          this.reconnectAttempts = 0;
          logger.info(`WebSocket connected to ${this.sourceId} at ${this.url}`);

          // Request tools list
          await this.listTools();
          resolve(true);
        });

        this.ws.on('error', (error: unknown) => {
          clearTimeout(timeout);
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error(`WebSocket error for ${this.sourceId}:`, err.message);
          this.connected = false;
          reject(err);
        });

        this.ws.on('close', () => {
          this.connected = false;
          logger.warn(`WebSocket disconnected from ${this.sourceId}`);
          this.scheduleReconnect();
        });
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to connect WebSocket for ${this.sourceId}:`, err.message);
      this.connected = false;
      throw err;
    }
  }

  async listTools() {
    if (!this.connected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const requestId = Math.floor(Math.random() * 1000000);
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket request timeout'));
      }, 5000);

      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === requestId) {
            clearTimeout(timeout);
            this.ws.off('message', messageHandler);

            if (response.result && response.result.tools) {
              this.tools = response.result.tools;
              resolve(response.result.tools);
            } else {
              reject(new Error('Invalid tools response'));
            }
          }
        } catch (error) {
          clearTimeout(timeout);
          this.ws.off('message', messageHandler);
          reject(error);
        }
      };

      this.ws.on('message', messageHandler);

      const request = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/list'
      };

      this.ws.send(JSON.stringify(request));
    });
  }

  async callTool(toolName: string, parameters: Record<string, unknown>) {
    if (!this.connected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const requestId = Math.floor(Math.random() * 1000000);
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket tool call timeout'));
      }, 30000);

      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === requestId) {
            clearTimeout(timeout);
            this.ws.off('message', messageHandler);

            if (response.error) {
              reject(new Error(response.error.message || 'Tool call failed'));
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          clearTimeout(timeout);
          this.ws.off('message', messageHandler);
          reject(error);
        }
      };

      this.ws.on('message', messageHandler);

      const request = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: parameters
        }
      };

      this.ws.send(JSON.stringify(request));
    });
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      setTimeout(() => {
        logger.info(`Attempting to reconnect to ${this.sourceId} (attempt ${this.reconnectAttempts})`);
        this.connect().catch(error => {
          logger.error(`Reconnection failed for ${this.sourceId}:`, error.message);
        });
      }, delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  getStatus() {
    return {
      connected: this.connected,
      tools: this.tools.length,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Import bridges
import neonBridge from '../bridges/neon-bridge.js';
import AppStoreConnectBridge from '../bridges/appstore-bridge.js';

// Create App Store Connect bridge instance with environment variables
const appStoreConnectBridge = new AppStoreConnectBridge(process.env);

// MCP Source Registry
const mcpSources: Record<string, BaseSourceConfig> = {
  'core': {
    url: 'http://localhost:3001',
    name: 'MCP Core (Lanonasis)',
    tools: 18,
    categories: ['memory', 'api-keys', 'system', 'business'],
    endpoint: '/api/v1/tools',
    callEndpoint: '/api/v1/tools',
    responseFormat: 'direct', // Direct response, not JSON-RPC wrapper
    database: 'Supabase',
    protocols: {
      stdio: 3001,
      http: 3001,
      websocket: 3003,
      sse: 3004
    }
  },
  'quick-auth': {
    url: 'http://localhost:3005',
    name: 'Quick Auth Service',
    tools: 'auth-only',
    categories: ['authentication', 'cli'],
    endpoint: '/health'
  },
  'neon': {
    url: 'internal',
    name: 'Neon Database Bridge',
    tools: 15,
    categories: ['database', 'sql', 'projects', 'memory', 'semantic-search'],
    bridge: neonBridge,
    database: 'Neon PostgreSQL'
  },
  'appstore': {
    url: 'internal',
    name: 'Apple App Store Connect',
    tools: 17,
    categories: ['ios', 'app-management', 'testflight', 'analytics'],
    bridge: appStoreConnectBridge,
    enabled: true // Enabled with credentials
  }
};

// Initialize WebSocket connections
const wsConnections = new Map();

// Initialize WebSocket connections for applicable sources
async function initializeWebSocketConnections() {
  for (const [sourceId, source] of Object.entries(mcpSources)) {
    if (source.protocol === 'websocket') {
      try {
        const wsConnection = new WebSocketMCPConnection(source.url, sourceId);
        await wsConnection.connect();
        wsConnections.set(sourceId, wsConnection);
        source.connection = wsConnection;
        logger.info(`WebSocket connection established for ${source.name}`);
      } catch (error) {
        logger.error(`Failed to establish WebSocket connection for ${source.name}:`, error.message);
      }
    }
  }
}

// Aggregate tools from all sources
async function aggregateTools() {
  const allTools = [];
  const sourceStatus = {};

  for (const [sourceId, source] of Object.entries(mcpSources)) {
    try {
      // Skip disabled sources
      if (source.enabled === false) {
        sourceStatus[sourceId] = {
          status: 'disabled',
          tools: source.tools,
          type: source.bridge ? 'bridge' : 'http',
          reason: 'Credentials required or intentionally disabled'
        };
        continue;
      }

      // Handle WebSocket connections
      if (source.protocol === 'websocket' && source.connection) {
        const wsConnection = source.connection;
        if (wsConnection.connected) {
          const tools = wsConnection.tools.map(tool => ({
            ...tool,
            _source: sourceId,
            _sourceUrl: source.url,
            _protocol: 'websocket',
            name: `${sourceId}_${tool.name}`
          }));

          allTools.push(...tools);
          sourceStatus[sourceId] = {
            status: 'online',
            tools: tools.length,
            type: 'websocket',
            connection_status: wsConnection.getStatus()
          };
          logger.info(`Loaded ${tools.length} tools from ${source.name} (WebSocket)`);
        } else {
          sourceStatus[sourceId] = {
            status: 'offline',
            error: 'WebSocket connection not established',
            type: 'websocket'
          };
        }
        continue;
      }

      // Handle internal bridges (like Neon, App Store Connect)
      if (source.bridge) {
        const tools = source.bridge.getTools().map(tool => ({
          ...tool,
          _source: sourceId,
          _sourceUrl: 'internal',
          name: `${sourceId}_${tool.name}`
        }));

        allTools.push(...tools);
        const bridgeStatus = source.bridge.getStatus();
        sourceStatus[sourceId] = {
          status: bridgeStatus.connected ? 'online' : 'offline',
          tools: tools.length,
          type: 'bridge'
        };
        logger.info(`Loaded ${tools.length} tools from ${source.name} (bridge)`);
        continue;
      }

      // Handle external MCP sources
      const endpoint = source.endpoint || '/mcp';
      const requestUrl = `${source.url}${endpoint}`;

      let response;
      if (endpoint === '/health') {
        // Health check endpoint - different format
        response = await axios.get(requestUrl, { timeout: 5000 });
        // Convert health response to MCP format
        if (response.status === 200) {
          const tools = [{
            name: 'health_check',
            description: `Health check for ${source.name}`,
            inputSchema: { type: 'object', properties: {} }
          }];

          const mappedTools = tools.map(tool => ({
            ...tool,
            _source: sourceId,
            _sourceUrl: source.url,
            name: `${sourceId}_${tool.name}`
          }));

          allTools.push(...mappedTools);
          sourceStatus[sourceId] = { status: 'online', tools: mappedTools.length };
          logger.info(`Loaded ${mappedTools.length} tools from ${source.name}`);
        }
      } else if (endpoint === '/api/v1/tools') {
        // Direct tools endpoint (like mcp-core) - GET request
        response = await axios.get(requestUrl, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Handle {success: true, data: [...]} format (mcp-core)
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          const tools = response.data.data.map(tool => ({
            ...tool,
            _source: sourceId,
            _sourceUrl: source.url,
            name: `${sourceId}_${tool.name}`
          }));

          allTools.push(...tools);
          sourceStatus[sourceId] = { status: 'online', tools: tools.length };
          logger.info(`Loaded ${tools.length} tools from ${source.name}`);
        }
        // Handle direct response format (array of tools)
        else if (response.data && Array.isArray(response.data)) {
          const tools = response.data.map(tool => ({
            ...tool,
            _source: sourceId,
            _sourceUrl: source.url,
            name: `${sourceId}_${tool.name}`
          }));

          allTools.push(...tools);
          sourceStatus[sourceId] = { status: 'online', tools: tools.length };
          logger.info(`Loaded ${tools.length} tools from ${source.name}`);
        }
        // Also handle JSON-RPC wrapped response
        else if (response.data && response.data.result && response.data.result.tools) {
          const tools = response.data.result.tools.map(tool => ({
            ...tool,
            _source: sourceId,
            _sourceUrl: source.url,
            name: `${sourceId}_${tool.name}`
          }));

          allTools.push(...tools);
          sourceStatus[sourceId] = { status: 'online', tools: tools.length };
          logger.info(`Loaded ${tools.length} tools from ${source.name}`);
        }
      } else {
        // Standard MCP endpoint
        response = await axios.post(requestUrl, {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list'
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.result && response.data.result.tools) {
          const tools = response.data.result.tools.map(tool => ({
            ...tool,
            _source: sourceId,
            _sourceUrl: source.url,
            name: `${sourceId}_${tool.name}`
          }));

          allTools.push(...tools);
          sourceStatus[sourceId] = { status: 'online', tools: tools.length };
          logger.info(`Loaded ${tools.length} tools from ${source.name}`);
        }
      }
    } catch (error) {
      sourceStatus[sourceId] = { status: 'offline', error: error.message };
      logger.warn(`Failed to load tools from ${source.name}: ${error.message}`);
    }
  }

  return { tools: allTools, sources: sourceStatus };
}

// MCP Protocol Handlers
app.post('/mcp', async (req, res) => {
  const { method, params, id } = req.body;

  try {
    switch (method) {
      case 'initialize':
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: false },
              prompts: { listChanged: false },
              resources: { subscribe: false, listChanged: false }
            },
            serverInfo: {
              name: 'seyederick-mcp',
              version: '1.0.0'
            }
          }
        });
        break;

      case 'tools/list':
        const { tools, sources } = await aggregateTools();
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools,
            _meta: {
              gateway: 'mcp-unified-gateway',
              sources,
              totalTools: tools.length,
              timestamp: new Date().toISOString()
            }
          }
        });
        break;

      case 'tools/call':
        const toolName = params.name;
        const [sourceId] = toolName.split('_');
        const originalToolName = toolName.substring(sourceId.length + 1);

        const source = mcpSources[sourceId];
        if (!source) {
          throw new Error(`Unknown source: ${sourceId}`);
        }

        let toolResult;

        // Handle WebSocket sources
        if (source.protocol === 'websocket' && source.connection) {
          if (!source.connection.connected) {
            throw new Error(`WebSocket connection to ${sourceId} is not available`);
          }

          const result = await source.connection.callTool(originalToolName, params.arguments);
          toolResult = {
            jsonrpc: '2.0',
            id,
            result
          };
        }
        // Handle bridge sources
        else if (source.bridge) {
          const result = await source.bridge.executeTool(originalToolName, params.arguments);
          toolResult = {
            jsonrpc: '2.0',
            id,
            result
          };
        }
        // Handle HTTP MCP sources
        else {
          // Check if source has custom call endpoint (like mcp-core REST API)
          if (source.callEndpoint) {
            try {
              const toolResponse = await axios.post(
                `${source.url}${source.callEndpoint}/${originalToolName}`,
                params.arguments || {},
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.MASTER_API_KEY || 'lano_master_key_2024'
                  },
                  timeout: 30000
                }
              );
              // Check if response format is direct (not wrapped in JSON-RPC)
              if (source.responseFormat === 'direct') {
                // Unwrap REST API response format {success: true, data: {...}}
                const restResponse = toolResponse.data;

                if (restResponse.success === false) {
                  // Handle error response
                  throw new Error(restResponse.error || 'Tool execution failed');
                }

                // Extract the actual data from REST response
                const actualData = restResponse.data || restResponse;

                toolResult = {
                  jsonrpc: '2.0',
                  id,
                  result: actualData
                };
              } else {
                toolResult = toolResponse.data;
              }
            } catch (error) {
              logger.error(`REST API tool execution error for ${originalToolName}:`, error.response?.data || error.message);
              throw new Error(`Tool execution failed: ${error.response?.data?.message || error.message}`);
            }
          } else {
            // Standard MCP protocol format
            const toolResponse = await axios.post(`${source.url}/mcp`, {
              jsonrpc: '2.0',
              id,
              method: 'tools/call',
              params: {
                ...params,
                name: originalToolName // Remove namespace for source
              }
            });
            toolResult = toolResponse.data;
          }
        }

        // Convert result to MCP content format for client compatibility
        const mcpFormattedResult = {
          jsonrpc: '2.0',
          id: toolResult.id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof toolResult.result === 'string'
                  ? toolResult.result
                  : JSON.stringify(toolResult.result, null, 2)
              }
            ]
          }
        };

        res.json(mcpFormattedResult);
        break;

      default:
        res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        });
    }
  } catch (error) {
    logger.error('MCP Gateway Error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'seyederick-mcp',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      mcp: '/mcp (POST)',
      admin: '/admin/add-source (POST)'
    },
    documentation: 'Use POST /mcp with JSON-RPC 2.0 format'
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const { sources } = await aggregateTools();

  res.json({
    status: 'healthy',
    service: 'seyederick-mcp',
    timestamp: new Date().toISOString(),
    ports: {
      primary: PRIMARY_PORT,
      fallback: FALLBACK_PORT
    },
    websocket: {
      primary: `ws://localhost:${PRIMARY_PORT}/ws`,
      fallback: `ws://localhost:${FALLBACK_PORT}/ws`
    },
    sources: Object.keys(mcpSources).length,
    activeSources: Object.values(sources).filter(s => s.status === 'online').length,
    sourceDetails: sources
  });
});

// Add new MCP source dynamically
app.post('/admin/add-source', (req, res) => {
  const { id, url, name, categories } = req.body;

  mcpSources[id] = { url, name, categories, tools: 'unknown' };

  logger.info(`Added new MCP source: ${name} at ${url}`);
  res.json({ success: true, sources: Object.keys(mcpSources).length });
});

// Start both servers
async function startServers() {
  // Start primary server (7777)
  if (ENABLE_PRIMARY) {
    primaryServer.listen(PRIMARY_PORT, '0.0.0.0', () => {
      logger.info(`🌐 Vibe Frontend Gateway PRIMARY running on port ${PRIMARY_PORT}`);
      logger.info(`📊 Health check: http://localhost:${PRIMARY_PORT}/health`);
      logger.info(`🔧 MCP HTTP endpoint: http://localhost:${PRIMARY_PORT}/mcp`);
      logger.info(`🔌 MCP WebSocket: ws://localhost:${PRIMARY_PORT}/ws`);
    });
  } else {
    logger.info('Primary listener is disabled by ENABLE_PRIMARY=false');
  }

  // Start fallback server (7778)
  if (ENABLE_FALLBACK) {
    fallbackServer.listen(FALLBACK_PORT, '0.0.0.0', () => {
      logger.info(`🔄 Vibe Frontend Gateway FALLBACK running on port ${FALLBACK_PORT}`);
      logger.info(`📊 Health check: http://localhost:${FALLBACK_PORT}/health`);
      logger.info(`🔧 MCP HTTP endpoint: http://localhost:${FALLBACK_PORT}/mcp`);
      logger.info(`🔌 MCP WebSocket: ws://localhost:${FALLBACK_PORT}/ws`);
    });
  } else {
    logger.info('Fallback listener is disabled by ENABLE_FALLBACK=false');
  }

  logger.info(`🎯 Aggregating ${Object.keys(mcpSources).length} MCP sources`);

  // Initialize WebSocket client connections to external sources
  await initializeWebSocketConnections();

  logger.info(`✅ MCP Unified Gateway fully initialized`);
  logger.info(`🔑 API Key authentication enabled for external clients`);
  logger.info(`🌍 Public endpoint: https://link.seyederick.com/mcp`);
}

startServers().catch(error => {
  logger.error('Failed to start servers:', error);
  process.exit(1);
});

// Global error handlers for stability
process.on('uncaughtException', (error) => {
  logger.error('🚨 CRITICAL: Uncaught Exception:', error);
  logger.error('Stack:', error.stack);
  // Don't exit immediately - log and continue
  // PM2 will restart if necessary
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 CRITICAL: Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  // Don't exit - log and continue
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close database pool if exists
    if (dbPool) {
      logger.info('Closing database pool...');
      await dbPool.end();
    }
    
    // Close WebSocket connections
    logger.info('Closing WebSocket connections...');
    primaryWss.clients.forEach(client => client.close());
    fallbackWss.clients.forEach(client => client.close());
    
    // Close HTTP servers
    logger.info('Closing HTTP servers...');
    await Promise.all([
      new Promise(resolve => primaryServer.close(resolve)),
      new Promise(resolve => fallbackServer.close(resolve))
    ]);
    
    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));