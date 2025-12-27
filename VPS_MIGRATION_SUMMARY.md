# VPS Migration Summary - Key Changes from Vercel

## Overview

This document summarizes the key changes needed when migrating from Vercel to VPS deployment.

---

## 🔄 Environment Variable Changes

### Critical Changes

| Variable | Vercel | VPS | Notes |
|----------|--------|-----|-------|
| `BASE_URL` | Auto-detected | Must be set | Use your domain: `https://yourdomain.com` |
| `POSTGRES_URL` | Vercel Postgres wrapper | Direct connection | Use full PostgreSQL connection string |
| `MEMORY_SERVICE_URL` | External URL | `http://localhost:3001` or external | Use localhost if on same VPS |
| `NEXT_PUBLIC_MCP_SERVER_URL` | External WebSocket | `ws://localhost:7777/mcp` or external | Use localhost if on same VPS |
| `NEXT_PUBLIC_GATEWAY_URL` | External URL | `http://localhost:7777` or external | Use localhost if on same VPS |

### No Changes Needed

- `AUTH_SECRET` - Same format
- `STRIPE_*` - Same format
- `NEXT_PUBLIC_*` - Same format (but URLs may change)

---

## 🏗️ Architecture Changes

### Vercel Architecture
```
User → Vercel CDN → Next.js Serverless Functions → External Services
```

### VPS Architecture
```
User → Nginx (SSL) → Next.js (PM2) → External Services
                    ↓
                 MCP Gateway (PM2)
```

### Key Differences

1. **Process Management**: PM2 instead of Vercel's serverless
2. **Reverse Proxy**: Nginx instead of Vercel's edge network
3. **SSL**: Let's Encrypt instead of Vercel's managed SSL
4. **Static Files**: Served by Nginx instead of CDN
5. **WebSockets**: Direct connection instead of Vercel's proxy

---

## 📝 Code Changes Required

### 1. API Routes - MCP Proxy

**File**: `app/api/mcp/route.ts`

**Current (Vercel)**:
```typescript
const response = await fetch('https://link.seyederick.com/mcp', {
```

**VPS Option 1** (MCP on same VPS):
```typescript
const mcpUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:7777';
const response = await fetch(`${mcpUrl}/mcp`, {
```

**VPS Option 2** (MCP external - no change needed):
Keep as-is if MCP gateway is still external.

### 2. Health Check Endpoint

**File**: `app/api/health/route.ts`

**Current**: Checks for `VERCEL` environment variable

**VPS**: Should check for `NODE_ENV === 'production'` instead

**Recommended Change**:
```typescript
deployment_platform: process.env.VERCEL ? 'Vercel' : (process.env.NODE_ENV === 'production' ? 'VPS' : 'Development')
```

### 3. Memory Service URLs

**Files**: `app/api/memory/*.ts`

**Current**: Uses `MEMORY_SERVICE_URL` from env (works for both)

**VPS**: No change needed if using environment variables correctly.

---

## 🚀 Deployment Process

### Quick Start

1. **Prepare Environment**
   ```bash
   cd /opt/lanonasis/vibe-frontend
   cp ENV_VARS_VPS.md .env.production
   nano .env.production  # Edit with your values
   ```

2. **Run Deployment Script**
   ```bash
   ./deploy-vps.sh
   ```

3. **Configure Nginx**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/vibe-frontend
   sudo nano /etc/nginx/sites-available/vibe-frontend  # Update domain
   sudo ln -s /etc/nginx/sites-available/vibe-frontend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Set Up SSL**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

5. **Configure Firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

---

## 🔍 Testing Checklist

- [ ] Application builds successfully
- [ ] PM2 processes running (`pm2 status`)
- [ ] Health endpoint works (`curl http://localhost:3000/api/health`)
- [ ] Nginx proxy works (`curl http://localhost/api/health`)
- [ ] SSL certificate valid (visit `https://yourdomain.com`)
- [ ] Database connection works
- [ ] Memory service accessible (if external)
- [ ] MCP gateway accessible (if external)
- [ ] WebSocket connections work (if using MCP)
- [ ] Static files served correctly
- [ ] API routes respond correctly

---

## ⚠️ Common Issues & Solutions

### Issue: 502 Bad Gateway

**Cause**: Next.js app not running or wrong port

**Solution**:
```bash
pm2 status
pm2 logs vibe-frontend
# Check if app is listening on port 3000
```

### Issue: Database Connection Failed

**Cause**: Wrong connection string or firewall blocking

**Solution**:
1. Verify `POSTGRES_URL` format
2. Check database firewall allows VPS IP
3. Test connection: `psql $POSTGRES_URL`

### Issue: Memory Service Unavailable

**Cause**: Wrong URL or service not running

**Solution**:
1. Verify `MEMORY_SERVICE_URL` is correct
2. Test connection: `curl $MEMORY_SERVICE_URL/health`
3. Check CORS settings on memory service

### Issue: WebSocket Connection Failed

**Cause**: Nginx not configured for WebSockets

**Solution**: Ensure nginx.conf has WebSocket proxy settings (already included)

### Issue: SSL Certificate Error

**Cause**: Domain not pointing to VPS or firewall blocking

**Solution**:
1. Verify DNS: `dig yourdomain.com`
2. Ensure port 80/443 open: `sudo ufw status`
3. Check certbot logs: `sudo certbot certificates`

---

## 📊 Performance Considerations

### VPS vs Vercel

| Aspect | Vercel | VPS |
|--------|--------|-----|
| CDN | Global edge network | Single location (or add Cloudflare) |
| Scaling | Automatic | Manual (or use PM2 cluster mode) |
| Cold Starts | Serverless (may have cold starts) | Always running (no cold starts) |
| Cost | Pay per usage | Fixed monthly cost |
| Control | Limited | Full control |

### Optimization Tips

1. **Enable PM2 Cluster Mode** (for high traffic):
   ```javascript
   instances: 'max',
   exec_mode: 'cluster'
   ```

2. **Add Cloudflare CDN** (optional):
   - Point DNS to Cloudflare
   - Enable caching for static assets

3. **Database Connection Pooling**:
   - Already configured in `drizzle.ts`
   - Adjust pool size based on traffic

4. **Nginx Caching**:
   - Static files already cached
   - Consider adding proxy cache for API responses

---

## 🔐 Security Checklist

- [ ] `.env.production` has correct permissions (`chmod 600`)
- [ ] Firewall configured (only necessary ports open)
- [ ] SSL certificate valid and auto-renewing
- [ ] Strong `AUTH_SECRET` generated
- [ ] Database credentials secure
- [ ] No sensitive data in code
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] PM2 logs secured (not world-readable)
- [ ] Nginx security headers enabled (already in config)

---

## 📚 Additional Resources

- **Full Deployment Guide**: `VPS_DEPLOYMENT_GUIDE.md`
- **Environment Variables**: `ENV_VARS_VPS.md`
- **Nginx Config**: `nginx.conf`
- **PM2 Config**: `ecosystem.config.js`
- **Deployment Script**: `deploy-vps.sh`

---

## 🆘 Rollback Plan

If you need to rollback to Vercel:

1. **Keep Vercel deployment active** during migration
2. **Point DNS back to Vercel** if needed
3. **Keep Vercel environment variables** documented
4. **Test thoroughly** before switching DNS

---

## 📞 Support

For issues:
1. Check logs: `pm2 logs vibe-frontend`
2. Check Nginx: `sudo nginx -t` and error logs
3. Review deployment guide: `VPS_DEPLOYMENT_GUIDE.md`
4. Check environment variables: `cat .env.production`

---

*Last Updated: 2025-01-XX*
