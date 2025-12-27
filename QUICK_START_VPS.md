# Quick Start: VPS Deployment

## 🚀 Fastest Path to Deployment

### Step 1: Prepare Environment File (5 minutes)

```bash
cd /opt/lanonasis/vibe-frontend

# Create production environment file
cat > .env.production << 'EOF'
NODE_ENV=production
BASE_URL=https://yourdomain.com
POSTGRES_URL=postgresql://user:password@host:5432/dbname
AUTH_SECRET=$(openssl rand -base64 32)
MEMORY_SERVICE_URL=http://localhost:3001
MEMORY_SERVICE_SECRET=your-secret
NEXT_PUBLIC_MEMORY_API_URL=/api/memory
NEXT_PUBLIC_MCP_SERVER_URL=ws://localhost:7777/mcp
NEXT_PUBLIC_GATEWAY_URL=http://localhost:7777
NEXT_PUBLIC_MCP_MODE=auto
NEXT_PUBLIC_ENABLE_MCP=true
EOF

# Edit with your actual values
nano .env.production
```

### Step 2: Run Deployment Script (10 minutes)

```bash
./deploy-vps.sh
```

This will:
- ✅ Check requirements
- ✅ Install dependencies
- ✅ Build application
- ✅ Run migrations
- ✅ Start PM2 processes

### Step 3: Configure Nginx (5 minutes)

```bash
# Copy and edit nginx config
sudo cp nginx.conf /etc/nginx/sites-available/vibe-frontend
sudo nano /etc/nginx/sites-available/vibe-frontend
# Replace 'yourdomain.com' with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/vibe-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Set Up SSL (5 minutes)

```bash
sudo certbot --nginx -d yourdomain.com
```

### Step 5: Configure Firewall (2 minutes)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 6: Test (2 minutes)

```bash
# Test locally
curl http://localhost:3000/api/health

# Test through Nginx
curl http://localhost/api/health

# Test HTTPS (after SSL)
curl https://yourdomain.com/api/health
```

## ✅ Done!

Your application should now be accessible at `https://yourdomain.com`

## 📋 Quick Commands

```bash
# View logs
pm2 logs vibe-frontend

# Restart
pm2 restart vibe-frontend

# Status
pm2 status

# Stop
pm2 stop vibe-frontend

# Start
pm2 start ecosystem.config.js
```

## 🆘 Troubleshooting

**502 Bad Gateway?**
```bash
pm2 logs vibe-frontend
pm2 restart vibe-frontend
```

**SSL not working?**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

**Database connection failed?**
```bash
# Test connection
psql $POSTGRES_URL
# Check .env.production
cat .env.production | grep POSTGRES_URL
```

## 📚 Full Documentation

- **Complete Guide**: `VPS_DEPLOYMENT_GUIDE.md`
- **Migration Summary**: `VPS_MIGRATION_SUMMARY.md`
- **Environment Variables**: `ENV_VARS_VPS.md`
