module.exports = {
  apps: [
    {
      name: 'vibe-mcp',
      script: './unified-gateway.ts',
      interpreter: 'tsx',
      interpreter_args: '--max-old-space-size=512 --trace-warnings --trace-deprecation',
      instances: 1,
      exec_mode: 'fork',
      cwd: '/opt/lanonasis/vibe-frontend/lib/mcp/gateway',
      
      // Metadata
      metadata: {
        description: 'Unified MCP Gateway - Aggregates multiple MCP sources into a single endpoint',
        version: '1.0.0',
        author: 'Lanonasis',
        repository: 'https://github.com/lanonasis/vibe-frontend',
        keywords: ['mcp', 'gateway', 'model-context-protocol', 'websocket', 'sse'],
        environment: 'production',
        service: {
          type: 'gateway',
          protocol: ['http', 'websocket', 'sse'],
          ports: [7777, 7778],
          endpoints: {
            primary: '/mcp',
            health: '/health',
            admin: '/admin/add-source',
            metrics: '/metrics'
          }
        },
        sources: {
          core: { name: 'mcp-core', tools: 18, protocol: 'stdio' },
          'quick-auth': { name: 'quick-auth', tools: 0, protocol: 'http' },
          neon: { name: 'neon', tools: 0, protocol: 'sse' },
          appstore: { name: 'onasis-gateway', tools: 17, protocol: 'http' }
        }
      },
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PRIMARY_PORT: '7777',
        FALLBACK_PORT: '7778',
        PORT: '7777',
        ENABLE_PRIMARY: 'true',
        ENABLE_FALLBACK: 'false',
        MASTER_API_KEY: 'lano_master_key_2024',
        VIBE_API_KEY: 'vibe_frontend_key_2024',
        // PM2 Metadata environment variables
        PM2_METADATA_NAME: 'vibe-mcp',
        PM2_METADATA_DESCRIPTION: 'Unified MCP Gateway - Aggregates multiple MCP sources into a single endpoint',
        PM2_METADATA_VERSION: '1.0.0',
        PM2_METADATA_AUTHOR: 'Lanonasis',
        PM2_METADATA_REPOSITORY: 'https://github.com/lanonasis/vibe-frontend',
        PM2_METADATA_KEYWORDS: 'mcp,gateway,model-context-protocol,websocket,sse',
        PM2_METADATA_ENVIRONMENT: 'production',
        PM2_METADATA_SERVICE_TYPE: 'gateway',
        PM2_METADATA_PORTS: '7777,7778'
      },
      
      // Performance optimizations
      node_args: '--max-old-space-size=512',
      max_memory_restart: '512M',
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/vibe-mcp-error.log',
      out_file: '/var/log/pm2/vibe-mcp-out.log',
      merge_logs: true,
      time: true,
      
      // Restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 5000,
      
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
      
      // Custom metrics configuration
      pmx: true, // Enable PM2 Plus metrics
      instance_var: 'INSTANCE_ID',
      
      // Advanced monitoring
      monitoring: {
        enabled: true,
        custom_metrics: true,
        metrics_interval: 5000
      }
    }
  ]
};

