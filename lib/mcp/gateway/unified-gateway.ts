#!/usr/bin/env node

/**
 * Unified MCP Gateway for Vibe Frontend
 *
 * Aggregates multiple MCP sources for the "one key to endless possibilities" ecosystem:
 * - In-house mcp-core (18 tools)
 * - Onasis-CORE via WebSocket (17+ tools)
 * - Neon Database with advanced memory services (13 tools)
 * - Apple App Store Connect API (17 tools)
 * - Quick Auth (authentication tools)
 * - Context7 Documentation
 *
 * Integrated into vibe-frontend CICD pipeline
 */

import express from 'express';
import cors from 'cors';
import winston from 'winston';
import axios from 'axios';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Environment-based service configuration
const SERVICE_CONFIG = {
  mcp_stdio: parseInt(process.env.MCP_STDIO_PORT || '3001'),
  mcp_http: parseInt(process.env.MCP_HTTP_PORT || '3002'),
  mcp_websocket: parseInt(process.env.MCP_WS_PORT || '3003'), // Onasis-CORE WebSocket
  mcp_sse: parseInt(process.env.MCP_SSE_PORT || '3004'),
  dashboard: parseInt(process.env.DASHBOARD_PORT || '3000'),
  gateway: parseInt(process.env.GATEWAY_PORT || '7777')
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/var/log/vibe-mcp-gateway.log' })
  ]
});

const app = express();
const PORT = SERVICE_CONFIG.gateway;

// Middleware
app.use(cors({
  origin: [
    'https://vibe.seyederick.com',
    'https://dashboard.lanonasis.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// WebSocket connection manager for Onasis-CORE
class OnasisCoreWebSocketConnection {
  constructor() {
    this.url = `wss://mcp.lanonasis.com:${SERVICE_CONFIG.mcp_websocket}/mcp`;
    this.ws = null;
    this.connected = false;
    this.tools = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      logger.info(`Connecting to Onasis-CORE via WebSocket: ${this.url}`);
      this.ws = new WebSocket(this.url);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 15000);

        this.ws.on('open', async () => {
          clearTimeout(timeout);
          this.connected = true;
          this.reconnectAttempts = 0;
          logger.info(`✅ Connected to Onasis-CORE WebSocket`);

          // Request tools list
          await this.listTools();
          resolve(true);
        });

        this.ws.on('error', (error) => {
          clearTimeout(timeout);
          logger.error(`❌ Onasis-CORE WebSocket error: ${error.message}`);
          this.connected = false;
          reject(error);
        });

        this.ws.on('close', () => {
          this.connected = false;
          logger.warn(`🔌 Onasis-CORE WebSocket disconnected`);
          this.scheduleReconnect();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data);
        });
      });
    } catch (error) {
      logger.error(`Failed to connect to Onasis-CORE: ${error.message}`);
      this.connected = false;
      throw error;
    }
  }

  async listTools() {
    if (!this.connected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const requestId = Math.floor(Math.random() * 1000000);
      const timeout = setTimeout(() => {
        reject(new Error('Tools list request timeout'));
      }, 10000);

      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === requestId) {
            clearTimeout(timeout);
            this.ws.off('message', messageHandler);

            if (response.result && response.result.tools) {
              this.tools = response.result.tools;
              logger.info(`📋 Loaded ${this.tools.length} tools from Onasis-CORE`);
              resolve(response.result.tools);
            } else {
              reject(new Error('Invalid tools response from Onasis-CORE'));
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

  async callTool(toolName, parameters) {
    if (!this.connected || !this.ws) {
      throw new Error('WebSocket not connected to Onasis-CORE');
    }

    return new Promise((resolve, reject) => {
      const requestId = Math.floor(Math.random() * 1000000);
      const timeout = setTimeout(() => {
        reject(new Error('Tool call timeout'));
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

  handleMessage(data) {
    // Handle incoming WebSocket messages
    try {
      const message = JSON.parse(data.toString());
      logger.debug(`📨 Onasis-CORE message: ${JSON.stringify(message)}`);
    } catch (error) {
      logger.warn(`⚠️ Invalid message from Onasis-CORE: ${error.message}`);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      setTimeout(() => {
        logger.info(`🔄 Attempting to reconnect to Onasis-CORE (attempt ${this.reconnectAttempts})`);
        this.connect().catch(error => {
          logger.error(`❌ Reconnection failed: ${error.message}`);
        });
      }, delay);
    } else {
      logger.error(`💀 Max reconnection attempts reached for Onasis-CORE`);
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
      reconnectAttempts: this.reconnectAttempts,
      url: this.url
    };
  }
}

// MCP Source Registry with proper port configuration
const mcpSources = {
  'core': {
    url: `http://localhost:${SERVICE_CONFIG.mcp_stdio}`,
    name: 'In-House MCP Core',
    tools: 18,
    categories: ['memory', 'api-keys', 'system', 'business'],
    endpoint: '/mcp'
  },
  'onasis-core': {
    connection: null, // Will be initialized
    name: 'Onasis-CORE Enhanced',
    tools: 17,
    categories: ['enhanced-memory', 'ai-orchestration', 'enterprise'],
    protocol: 'websocket',
    port: SERVICE_CONFIG.mcp_websocket
  },
  'neon': {
    url: 'internal',
    name: 'Neon Database with Memory Services',
    tools: 13,
    categories: ['database', 'memory', 'vector-search'],
    bridge: 'neon'
  },
  'appstore': {
    url: 'internal',
    name: 'Apple App Store Connect',
    tools: 17,
    categories: ['ios', 'app-management', 'testflight', 'analytics'],
    bridge: 'appstore'
  },
  'quick-auth': {
    url: `http://localhost:3005`,
    name: 'Quick Auth',
    tools: 'auth-only',
    categories: ['authentication', 'cli'],
    endpoint: '/health'
  },
  'context7': {
    url: `http://localhost:3007`,
    name: 'Context7 Documentation',
    tools: 'unknown',
    categories: ['documentation', 'search'],
    endpoint: '/mcp'
  }
};

// Initialize connections
let onasisCoreConnection: OnasisCoreWebSocketConnection | null = null;

async function initializeConnections() {
  // Initialize Onasis-CORE WebSocket connection
  try {
    onasisCoreConnection = new OnasisCoreWebSocketConnection();
    await onasisCoreConnection.connect();
    mcpSources['onasis-core'].connection = onasisCoreConnection;
    logger.info(`🌐 Onasis-CORE WebSocket initialized on port ${SERVICE_CONFIG.mcp_websocket}`);
  } catch (error) {
    logger.error(`❌ Failed to initialize Onasis-CORE: ${error.message}`);
  }
}

// Aggregate tools from all sources
async function aggregateTools() {
  const allTools = [];
  const sourceStatus = {};

  for (const [sourceId, source] of Object.entries(mcpSources)) {
    try {
      if (source.protocol === 'websocket' && source.connection) {
        // WebSocket source (Onasis-CORE)
        const wsConnection = source.connection;
        if (wsConnection.connected) {
          const tools = wsConnection.tools.map(tool => ({
            ...tool,
            _source: sourceId,
            _sourceUrl: wsConnection.url,
            _protocol: 'websocket',
            name: `${sourceId}_${tool.name}`
          }));

          allTools.push(...tools);
          sourceStatus[sourceId] = {
            status: 'online',
            tools: tools.length,
            type: 'websocket',
            port: source.port
          };
          logger.info(`📡 Loaded ${tools.length} tools from ${source.name} (WebSocket)`);
        } else {
          sourceStatus[sourceId] = {
            status: 'offline',
            error: 'WebSocket connection not established',
            type: 'websocket',
            port: source.port
          };
        }
      } else if (source.bridge) {
        // Bridge source (Neon, App Store Connect)
        const bridge = await import(`../bridges/${source.bridge}-bridge.js`);
        const bridgeInstance = bridge.default;

        const tools = bridgeInstance.getTools().map(tool => ({
          ...tool,
          _source: sourceId,
          _sourceUrl: 'internal',
          name: `${sourceId}_${tool.name}`
        }));

        allTools.push(...tools);
        const bridgeStatus = bridgeInstance.getStatus();
        sourceStatus[sourceId] = {
          status: bridgeStatus.connected ? 'online' : 'offline',
          tools: tools.length,
          type: 'bridge'
        };
        logger.info(`🔧 Loaded ${tools.length} tools from ${source.name} (bridge)`);
      } else {
        // HTTP source
        const endpoint = source.endpoint || '/mcp';
        const requestUrl = `${source.url}${endpoint}`;

        if (endpoint === '/health') {
          // Health check endpoint
          const response = await axios.get(requestUrl, { timeout: 5000 });
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
            logger.info(`✅ Loaded ${mappedTools.length} tools from ${source.name}`);
          }
        } else {
          // Standard MCP endpoint
          const response = await axios.post(requestUrl, {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
          }, {
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
          });

          if (response.data?.result?.tools) {
            const tools = response.data.result.tools.map(tool => ({
              ...tool,
              _source: sourceId,
              _sourceUrl: source.url,
              name: `${sourceId}_${tool.name}`
            }));

            allTools.push(...tools);
            sourceStatus[sourceId] = { status: 'online', tools: tools.length };
            logger.info(`🔗 Loaded ${tools.length} tools from ${source.name}`);
          }
        }
      }
    } catch (error) {
      sourceStatus[sourceId] = {
        status: 'offline',
        error: error.message.substring(0, 100)
      };
      logger.warn(`⚠️ Failed to load tools from ${source.name}: ${error.message}`);
    }
  }

  return { tools: allTools, sources: sourceStatus };
}

// MCP Protocol Handlers
app.post('/mcp', async (req, res) => {
  const { method, params, id } = req.body;

  try {
    switch (method) {
      case 'tools/list':
        const { tools, sources } = await aggregateTools();
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools,
            _meta: {
              gateway: 'vibe-frontend-unified-mcp-gateway',
              sources,
              totalTools: tools.length,
              serviceConfig: SERVICE_CONFIG,
              timestamp: new Date().toISOString(),
              version: '2.0.0'
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

        // Handle WebSocket sources (Onasis-CORE)
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
        // Handle bridge sources (Neon, App Store Connect)
        else if (source.bridge) {
          const bridge = await import(`../bridges/${source.bridge}-bridge.js`);
          const bridgeInstance = bridge.default;
          const result = await bridgeInstance.executeTool(originalToolName, params.arguments);
          toolResult = {
            jsonrpc: '2.0',
            id,
            result
          };
        }
        // Handle HTTP MCP sources
        else {
          const requestUrl = `${source.url}${source.endpoint || '/mcp'}`;
          const toolResponse = await axios.post(requestUrl, {
            jsonrpc: '2.0',
            id,
            method: 'tools/call',
            params: {
              ...params,
              name: originalToolName
            }
          });
          toolResult = toolResponse.data;
        }

        res.json(toolResult);
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

// Health check endpoint
app.get('/health', async (req, res) => {
  const { sources } = await aggregateTools();

  res.json({
    status: 'healthy',
    service: 'Vibe Frontend Unified MCP Gateway',
    timestamp: new Date().toISOString(),
    port: PORT,
    serviceConfig: SERVICE_CONFIG,
    sources: Object.keys(mcpSources).length,
    activeSources: Object.values(sources).filter(s => s.status === 'online').length,
    sourceDetails: sources,
    onasisCore: onasisCoreConnection?.getStatus(),
    version: '2.0.0'
  });
});

// Gateway configuration endpoint
app.get('/config', (req, res) => {
  res.json({
    serviceConfig: SERVICE_CONFIG,
    mcpSources: Object.fromEntries(
      Object.entries(mcpSources).map(([key, source]) => [
        key,
        {
          name: source.name,
          tools: source.tools,
          categories: source.categories,
          protocol: source.protocol || 'http',
          port: source.port || 'N/A'
        }
      ])
    ),
    onasisCoreStatus: onasisCoreConnection?.getStatus()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🌐 Vibe Frontend Unified MCP Gateway running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔧 MCP endpoint: http://localhost:${PORT}/mcp`);
  logger.info(`⚙️ Config endpoint: http://localhost:${PORT}/config`);
  logger.info(`🔌 Aggregating ${Object.keys(mcpSources).length} MCP sources`);
  logger.info(`🎯 Service Configuration:`, SERVICE_CONFIG);

  // Initialize connections
  await initializeConnections();

  logger.info(`✅ Multi-MCP Gateway fully initialized for vibe-frontend`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully');
  if (onasisCoreConnection) {
    onasisCoreConnection.disconnect();
  }
  process.exit(0);
});

export { mcpSources, SERVICE_CONFIG, OnasisCoreWebSocketConnection };