module.exports = {
  apps: [
    {
      name: 'vibe-gateway',
      script: './unified-gateway.ts',
      interpreter: 'tsx',
      interpreter_args: '',
      instances: 1,
      exec_mode: 'fork',
      cwd: '/root/vibe-frontend/lib/mcp/gateway',
      env: {
        NODE_ENV: 'production',
        PRIMARY_PORT: 7777,
        FALLBACK_PORT: 7778,
        PORT: 7777,
        ENABLE_PRIMARY: 'true',
        ENABLE_FALLBACK: 'false',
        MASTER_API_KEY: 'lano_master_key_2024',
        VIBE_API_KEY: 'vibe_frontend_key_2024'
      },
      // Performance optimizations
      node_args: '--max-old-space-size=512',
      max_memory_restart: '512M',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/root/.pm2/logs/vibe-gateway-error.log',
      out_file: '/root/.pm2/logs/vibe-gateway-out.log',
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
      listen_timeout: 10000
    }
  ]
};
