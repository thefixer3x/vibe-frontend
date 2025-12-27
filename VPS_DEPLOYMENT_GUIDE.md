# VPS Deployment Guide for Vibe Frontend

## Overview

This guide covers migrating the Vibe Frontend from Vercel to a VPS deployment. The application is a Next.js 15 application that requires:

- PostgreSQL database connection
- Memory service integration
- MCP gateway connectivity
- Stripe webhook handling
- SSL/HTTPS support
- Process management (PM2)

---

## Prerequisites

1. **VPS Requirements:**
   - Ubuntu 20.04+ or Debian 11+
   - Minimum 2GB RAM (4GB+ recommended)
   - Root or sudo access
   - Domain name pointed to VPS IP (for SSL)

2. **Software to Install:**
   - Node.js 18+ (or Bun)
   - PM2 (process manager)
   - Nginx (reverse proxy)
   - Certbot (SSL certificates)
   - PostgreSQL client libraries

---

## Step 1: Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js (if using Bun, skip to Bun installation)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1.3 Install Bun (Alternative - Recommended)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 1.4 Install PM2
```bash
npm install -g pm2
# or with bun
bun install -g pm2
```

### 1.5 Install Nginx
```bash
sudo apt install -y nginx
```

### 1.6 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 2: Application Setup

### 2.1 Clone/Upload Application
```bash
cd /opt/lanonasis
# If using git:
# git clone <your-repo-url> vibe-frontend
# Or upload files via SCP/SFTP
```

### 2.2 Install Dependencies
```bash
cd /opt/lanonasis/vibe-frontend
bun install
# or
npm install
```

### 2.3 Create Production Environment File
```bash
cp .env.example .env.production
nano .env.production
```

See **Environment Variables** section below for required values.

---

## Step 3: Environment Variables Configuration

### Critical Changes from Vercel to VPS

#### Database Connection
```bash
# Vercel: Managed Postgres URL
# VPS: Direct connection to your database
POSTGRES_URL=postgresql://user:password@your-db-host:5432/database_name

# If using Supabase:
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres

# If using Neon:
POSTGRES_URL=postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
```

#### Base URL
```bash
# Vercel: Auto-detected
# VPS: Your domain
BASE_URL=https://yourdomain.com
# or
BASE_URL=http://your-vps-ip:3000  # For testing without domain
```

#### Memory Service
```bash
# If memory service is on same VPS:
MEMORY_SERVICE_URL=http://localhost:3001

# If memory service is external:
MEMORY_SERVICE_URL=https://your-memory-service.com
MEMORY_SERVICE_SECRET=your-shared-secret
```

#### MCP Gateway
```bash
# If MCP gateway is on same VPS (port 7777):
NEXT_PUBLIC_MCP_SERVER_URL=ws://localhost:7777/mcp
NEXT_PUBLIC_GATEWAY_URL=http://localhost:7777

# If MCP gateway is external:
NEXT_PUBLIC_MCP_SERVER_URL=wss://link.seyederick.com/mcp
NEXT_PUBLIC_GATEWAY_URL=https://link.seyederick.com
```

#### Authentication
```bash
# Generate a secure secret:
# openssl rand -base64 32
AUTH_SECRET=your-generated-secret-minimum-32-characters
```

#### Stripe (if using)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Complete .env.production Template
```bash
# Environment
NODE_ENV=production

# Base URL
BASE_URL=https://yourdomain.com

# Database
POSTGRES_URL=postgresql://user:password@host:5432/dbname

# Authentication
AUTH_SECRET=your-secure-secret-here

# Memory Service
MEMORY_SERVICE_URL=http://localhost:3001
MEMORY_SERVICE_SECRET=your-shared-secret
NEXT_PUBLIC_MEMORY_API_URL=/api/memory
NEXT_PUBLIC_MEMORY_API_KEY=optional-api-key

# MCP Gateway
NEXT_PUBLIC_MCP_SERVER_URL=ws://localhost:7777/mcp
NEXT_PUBLIC_GATEWAY_URL=http://localhost:7777
NEXT_PUBLIC_MCP_MODE=auto
NEXT_PUBLIC_ENABLE_MCP=true

# Stripe (optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Apple App Store Connect (optional)
ENABLE_APPLE_CONNECT=false
APPLE_ISSUER_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

---

## Step 4: Build Application

### 4.1 Build for Production
```bash
cd /opt/lanonasis/vibe-frontend
bun run build
# or
npm run build
```

### 4.2 Test Build Locally (Optional)
```bash
bun run start
# or
npm run start
# Visit http://localhost:3000
```

---

## Step 5: PM2 Configuration

### 5.1 Update ecosystem.config.js

The ecosystem config should include both:
- Next.js frontend (port 3000)
- MCP Gateway (port 7777) - if running on same VPS

See `ecosystem.config.js` in the project root for the complete configuration.

### 5.2 Start with PM2
```bash
cd /opt/lanonasis/vibe-frontend
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

### 5.3 PM2 Commands
```bash
pm2 list              # View running processes
pm2 logs vibe-frontend # View logs
pm2 restart vibe-frontend # Restart
pm2 stop vibe-frontend   # Stop
pm2 delete vibe-frontend # Remove
```

---

## Step 6: Nginx Reverse Proxy

### 6.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/vibe-frontend
```

### 6.2 Nginx Configuration Template

See `nginx.conf` file in project root for complete configuration.

Key points:
- Proxy to `http://localhost:3000`
- WebSocket support for MCP
- SSL/TLS configuration
- Security headers
- Static file caching

### 6.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/vibe-frontend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## Step 7: SSL Certificate (Let's Encrypt)

### 7.1 Obtain Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7.2 Auto-Renewal
```bash
sudo certbot renew --dry-run  # Test renewal
# Certbot sets up auto-renewal automatically via systemd timer
```

---

## Step 8: Firewall Configuration

### 8.1 Configure UFW
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 8.2 Verify
```bash
sudo ufw status
```

---

## Step 9: Database Migrations

### 9.1 Run Migrations
```bash
cd /opt/lanonasis/vibe-frontend
bun run db:migrate
# or
npm run db:migrate
```

### 9.2 Verify Connection
```bash
# Test database connection
bun run db:setup
```

---

## Step 10: Service Health Checks

### 10.1 Check Application
```bash
curl http://localhost:3000/api/health
```

### 10.2 Check Nginx
```bash
curl http://localhost/api/health
```

### 10.3 Check PM2
```bash
pm2 status
pm2 logs --lines 50
```

---

## Step 11: Monitoring & Logs

### 11.1 PM2 Monitoring
```bash
pm2 monit
```

### 11.2 Application Logs
```bash
# PM2 logs
pm2 logs vibe-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### 11.3 Set Up Log Rotation
PM2 handles log rotation automatically, but you can configure it:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Troubleshooting

### Application Won't Start
1. Check environment variables: `cat .env.production`
2. Check build: `bun run build`
3. Check logs: `pm2 logs vibe-frontend`
4. Check port: `sudo netstat -tlnp | grep 3000`

### Database Connection Issues
1. Verify POSTGRES_URL is correct
2. Check database firewall allows VPS IP
3. Test connection: `psql $POSTGRES_URL`
4. Check SSL mode if using cloud database

### Nginx 502 Bad Gateway
1. Check if app is running: `pm2 status`
2. Check app logs: `pm2 logs vibe-frontend`
3. Verify proxy_pass in nginx config
4. Check SELinux/AppArmor if enabled

### SSL Certificate Issues
1. Verify domain DNS points to VPS
2. Check firewall allows port 80/443
3. Review certbot logs: `sudo certbot certificates`
4. Test renewal: `sudo certbot renew --dry-run`

### Memory Service Connection
1. Verify MEMORY_SERVICE_URL is accessible from VPS
2. Check CORS settings on memory service
3. Test connection: `curl $MEMORY_SERVICE_URL/health`
4. Check firewall rules

---

## Migration Checklist

- [ ] Server setup complete (Node.js/Bun, PM2, Nginx)
- [ ] Application code deployed to VPS
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Application built successfully
- [ ] PM2 process running
- [ ] Nginx configured and running
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] Monitoring/logging set up
- [ ] DNS pointing to VPS
- [ ] All services accessible

---

## Rollback Plan

If issues occur, you can quickly rollback:

1. **Keep Vercel deployment active** during migration
2. **Point DNS back to Vercel** if needed
3. **Keep Vercel environment variables** documented
4. **Test thoroughly** before switching DNS

---

## Performance Optimization

### 1. Enable Gzip Compression
Already configured in nginx.conf

### 2. Static Asset Caching
Already configured in nginx.conf

### 3. PM2 Cluster Mode (Optional)
For high traffic, consider cluster mode:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

### 4. Database Connection Pooling
Already configured in drizzle.ts

### 5. CDN for Static Assets (Optional)
Consider Cloudflare or similar for static assets

---

## Security Considerations

1. **Environment Variables**: Never commit `.env.production`
2. **Firewall**: Only open necessary ports
3. **SSL**: Always use HTTPS in production
4. **Updates**: Keep system and dependencies updated
5. **Backups**: Regular database and code backups
6. **Monitoring**: Set up alerts for downtime
7. **Rate Limiting**: Consider adding rate limiting middleware

---

## Next Steps

1. Set up automated backups
2. Configure monitoring/alerting (e.g., UptimeRobot)
3. Set up CI/CD for deployments
4. Configure log aggregation (optional)
5. Set up database backups

---

## Support

For issues specific to:
- **Next.js**: Check Next.js documentation
- **PM2**: `pm2 --help` or PM2 documentation
- **Nginx**: `nginx -t` and check error logs
- **Database**: Check database provider documentation

---

*Last Updated: 2025-01-XX*
