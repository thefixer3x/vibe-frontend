module.exports = {
  apps: [
    {
      name: 'vibe-frontend-mcp-gateway',
      script: './lib/mcp/gateway.ts',
      interpreter: 'tsx',
      instances: 1,
      exec_mode: 'fork',
      cwd: '/root/vibe-frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        MEMORY_SERVICE_URL: process.env.MEMORY_SERVICE_URL || 'http://localhost:3001',
        MEMORY_SERVICE_SECRET: process.env.MEMORY_SERVICE_SECRET || 'default-secret'
      },
      // Performance optimizations
      node_args: '--max-old-space-size=512',
      max_memory_restart: '512M',
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/root/.pm2/logs/vibe-frontend-mcp-gateway-error.log',
      out_file: '/root/.pm2/logs/vibe-frontend-mcp-gateway-out.log',
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
