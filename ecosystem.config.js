module.exports = {
  apps: [
    {
      name: 'vibe-mcp',
      script: '/opt/lanonasis/vibe-frontend/lib/mcp/gateway/unified-gateway.ts',
      interpreter: 'tsx',
      cwd: '/opt/lanonasis/vibe-frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // Enhanced metadata and monitoring
      version: '2.1.0',
      description: 'Unified MCP Gateway - Aggregates all MCP sources with bridge pattern for external clients',
      author: 'lanonasis',
      repository: 'https://github.com/thefixer3x/vibe-frontend.git',
      license: 'MIT',
      tags: ['mcp', 'gateway', 'unified', 'bridge', 'production'],
      // Custom metrics and monitoring
      pmx: true,
      source_map_support: true,
      trace: true,
      env: {
        NODE_ENV: 'production',
        PRIMARY_PORT: '7777',
        FALLBACK_PORT: '7778',
        ENABLE_PRIMARY: 'true',
        ENABLE_FALLBACK: 'true',
        MASTER_API_KEY: 'lano_master_key_2024',
        NEON_API_KEY: 'napi_lwscams84cmudaxc10l12ei0efuqxvszuke7m8kh8x0vr532i09eaq431whoxzm9',
        // Database pool configuration
        DB_POOL_MAX: '10',
        DB_POOL_IDLE_TIMEOUT: '30000',
        DB_POOL_CONNECTION_TIMEOUT: '5000',
        DB_POOL_MAX_USES: '7500'
      },
      error_file: '/var/log/pm2/vibe-mcp-error.log',
      out_file: '/var/log/pm2/vibe-mcp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      combine_logs: true,
      // Enhanced auto-restart configuration for stability
      min_uptime: '30s',           // Must stay up 30s to be considered stable
      max_restarts: 5,              // Reduced from 10 to prevent crash loops
      restart_delay: 10000,         // Increased from 4s to 10s delay between restarts
      exp_backoff_restart_delay: 100, // Exponential backoff starting at 100ms
      // Performance and timeout settings
      listen_timeout: 10000,        // Increased from 8s to 10s
      kill_timeout: 10000,          // Increased from 5s to 10s for graceful shutdown
      wait_ready: false,            // Don't wait for ready signal
      // Advanced stability features
      instance_var: 'INSTANCE_ID',
      increment_var: 'PORT_INCREMENT',
      // Monitoring
      ignore_watch: ['node_modules', '*.log', '.git'],
      node_args: '--max-old-space-size=512 --trace-warnings --trace-deprecation'
    }
  ]
};
