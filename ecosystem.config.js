module.exports = {
  apps: [
    {
      name: 'vibe-gateway',
      script: '/root/vibe-frontend/lib/mcp/gateway/unified-gateway.ts',
      interpreter: 'tsx',
      cwd: '/root/vibe-frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PRIMARY_PORT: '7777',
        FALLBACK_PORT: '7778',
        ENABLE_PRIMARY: 'true',
        ENABLE_FALLBACK: 'true',
        MASTER_API_KEY: 'lano_master_key_2024',
        NEON_API_KEY: 'napi_lwscams84cmudaxc10l12ei0efuqxvszuke7m8kh8x0vr532i09eaq431whoxzm9'
      },
      error_file: '/root/.pm2/logs/unified-mcp-gateway-error.log',
      out_file: '/root/.pm2/logs/unified-mcp-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto-restart configuration
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Performance monitoring
      listen_timeout: 8000,
      kill_timeout: 5000
    }
  ]
};
