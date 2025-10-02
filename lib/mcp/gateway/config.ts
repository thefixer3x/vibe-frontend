/**
 * Vibe Frontend MCP Gateway Configuration
 *
 * Automated port and service management for the unified MCP ecosystem
 */

export interface ServiceConfig {
  mcp_stdio: number;
  mcp_http: number;
  mcp_websocket: number;
  mcp_sse: number;
  dashboard: number;
  gateway: number;
}

export interface MCPSourceConfig {
  url?: string;
  name: string;
  tools: number | string;
  categories: string[];
  endpoint?: string;
  protocol?: 'http' | 'websocket';
  port?: number;
  bridge?: string;
  connection?: any;
}

// Environment-based service configuration
export const SERVICE_CONFIG: ServiceConfig = {
  mcp_stdio: parseInt(process.env.MCP_STDIO_PORT || '3001'),
  mcp_http: parseInt(process.env.MCP_HTTP_PORT || '3002'),
  mcp_websocket: parseInt(process.env.MCP_WS_PORT || '3003'), // Onasis-CORE WebSocket
  mcp_sse: parseInt(process.env.MCP_SSE_PORT || '3004'),
  dashboard: parseInt(process.env.DASHBOARD_PORT || '3000'),
  gateway: parseInt(process.env.GATEWAY_PORT || '7777')
};

// Multi-MCP source registry
export const MCP_SOURCES: Record<string, MCPSourceConfig> = {
  'core': {
    url: `http://localhost:${SERVICE_CONFIG.mcp_stdio}`,
    name: 'In-House MCP Core',
    tools: 18,
    categories: ['memory', 'api-keys', 'system', 'business'],
    endpoint: '/mcp'
  },
  'onasis-core': {
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

// Gateway metadata
export const GATEWAY_INFO = {
  name: 'Vibe Frontend Unified MCP Gateway',
  version: '2.0.0',
  description: 'Multi-MCP connectivity for the "one key to endless possibilities" ecosystem',
  totalSources: Object.keys(MCP_SOURCES).length,
  supportedProtocols: ['http', 'websocket', 'bridge'],
  features: [
    'Onasis-CORE WebSocket integration',
    'Advanced memory services via Neon',
    'Apple App Store Connect API',
    'In-house MCP Core compatibility',
    'Automated port management',
    'Cross-domain proxy support'
  ]
};

/**
 * Get the WebSocket URL for Onasis-CORE
 */
export function getOnasisCoreWebSocketURL(): string {
  return `wss://mcp.lanonasis.com:${SERVICE_CONFIG.mcp_websocket}/mcp`;
}

/**
 * Get the gateway health URL
 */
export function getGatewayHealthURL(): string {
  return `http://localhost:${SERVICE_CONFIG.gateway}/health`;
}

/**
 * Get the unified MCP endpoint URL
 */
export function getUnifiedMCPURL(): string {
  return `http://localhost:${SERVICE_CONFIG.gateway}/mcp`;
}

/**
 * Check if we're in development mode
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.VIBE_MCP_DEV === 'true';
}

/**
 * Get configuration for a specific MCP source
 */
export function getSourceConfig(sourceId: string): MCPSourceConfig | null {
  return MCP_SOURCES[sourceId] || null;
}

/**
 * Get all source IDs by category
 */
export function getSourcesByCategory(category: string): string[] {
  return Object.entries(MCP_SOURCES)
    .filter(([_, source]) => source.categories.includes(category))
    .map(([id, _]) => id);
}