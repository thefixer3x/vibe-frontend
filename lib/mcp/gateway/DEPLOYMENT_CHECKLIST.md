# 🚀 Deployment Checklist

Use this checklist to deploy SSE support for your MCP Gateway.

---

## Pre-Deployment

- [ ] Read [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)
- [ ] Backup current gateway config
- [ ] Backup nginx config
- [ ] Note current PM2 process status

---

## Deployment Steps

### 1. Update Code

- [ ] Navigate to `/root/vibe-frontend`
- [ ] Pull latest changes (if using git)
- [ ] Review changes in `unified-gateway.ts`

### 2. Update Nginx

- [ ] Copy new nginx config:
  ```bash
  sudo cp lib/mcp/gateway/nginx-sse-config.conf /etc/nginx/sites-available/link.seyederick.com
  ```
- [ ] Test nginx config:
  ```bash
  sudo nginx -t
  ```
- [ ] Reload nginx:
  ```bash
  sudo systemctl reload nginx
  ```
- [ ] Verify nginx is running:
  ```bash
  sudo systemctl status nginx
  ```

### 3. Restart Gateway

- [ ] Restart via PM2:
  ```bash
  pm2 restart unified-gateway
  ```
- [ ] Check PM2 status:
  ```bash
  pm2 status
  pm2 logs unified-gateway --lines 50
  ```
- [ ] Verify no errors in logs

### 4. Test SSE Endpoint

- [ ] Test health check:
  ```bash
  curl https://link.seyederick.com/health | jq
  ```
- [ ] Verify `protocols.sse` exists in response
- [ ] Test SSE connection:
  ```bash
  curl -N https://link.seyederick.com/sse
  ```
- [ ] Should see: `data: {"type":"connected","sessionId":"..."}`

### 5. Run Test Suite

- [ ] Make test script executable:
  ```bash
  chmod +x /root/vibe-frontend/lib/mcp/gateway/test-sse.sh
  ```
- [ ] Run full test suite:
  ```bash
  cd /root/vibe-frontend/lib/mcp/gateway
  ./test-sse.sh https://link.seyederick.com
  ```
- [ ] All tests should pass ✅

---

## Client Configuration

### 6. Update Claude Desktop

- [ ] Locate config file:
  - **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
  
- [ ] Backup current config
- [ ] Update config to:
  ```json
  {
    "mcpServers": {
      "seyederick-mcp": {
        "url": "https://link.seyederick.com/sse"
      }
    }
  }
  ```
- [ ] Save file
- [ ] Close Claude Desktop completely
- [ ] Reopen Claude Desktop

### 7. Verify Claude Connection

- [ ] In Claude, ask: "What MCP tools are available?"
- [ ] Should see list of tools
- [ ] Try calling a tool
- [ ] Verify tool execution works

---

## Post-Deployment Verification

### 8. Monitor Logs

- [ ] Check gateway logs:
  ```bash
  tail -f /var/log/mcp-gateway.log
  ```
- [ ] Check nginx logs:
  ```bash
  tail -f /var/log/nginx/mcp-gateway-access.log
  ```
- [ ] No errors for at least 5 minutes

### 9. Session Management

- [ ] Open SSE connection
- [ ] Check active sessions:
  ```bash
  curl https://link.seyederick.com/health | jq .sessions
  ```
- [ ] Should show active session
- [ ] Wait 11 minutes (idle timeout)
- [ ] Check sessions again - should be cleaned up

### 10. Load Testing (Optional)

- [ ] Open multiple SSE connections:
  ```bash
  for i in {1..5}; do curl -N https://link.seyederick.com/sse & done
  ```
- [ ] Check session count increases
- [ ] Kill background processes:
  ```bash
  killall curl
  ```
- [ ] Verify sessions clean up

---

## Troubleshooting Checks

If anything fails:

- [ ] **Gateway not responding**
  - Check if process is running: `pm2 status`
  - Check logs: `pm2 logs unified-gateway`
  - Restart: `pm2 restart unified-gateway`

- [ ] **Nginx errors**
  - Test config: `sudo nginx -t`
  - Check error logs: `tail -f /var/log/nginx/error.log`
  - Verify port 7777 is open: `netstat -tuln | grep 7777`

- [ ] **SSE connection fails**
  - Test locally first: `curl -N http://localhost:7777/sse`
  - Check firewall: `sudo ufw status`
  - Verify reverse proxy: Check nginx SSE config

- [ ] **Claude Desktop not connecting**
  - Verify config syntax (valid JSON)
  - Check Claude logs: `~/Library/Logs/Claude/`
  - Try with local URL first: `http://localhost:7777/sse`

---

## Rollback Plan

If something goes wrong:

### Quick Rollback

- [ ] Restore previous nginx config:
  ```bash
  sudo cp /etc/nginx/sites-available/link.seyederick.com.backup \
         /etc/nginx/sites-available/link.seyederick.com
  sudo systemctl reload nginx
  ```

- [ ] Revert Claude config:
  ```bash
  cp ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup \
     ~/Library/Application\ Support/Claude/claude_desktop_config.json
  ```

- [ ] Use wrapper again (temporary):
  ```json
  {
    "mcpServers": {
      "seyederick-mcp": {
        "command": "node",
        "args": ["/Users/seyederick/mcp-stdio-wrapper.js"]
      }
    }
  }
  ```

---

## Success Criteria

✅ **Deployment is successful when**:

1. Health endpoint responds with SSE protocol info
2. SSE endpoint accepts connections
3. Test suite passes all tests
4. Claude Desktop connects via direct URL
5. MCP tools are accessible and functional
6. No errors in logs for 10+ minutes
7. Sessions properly expire after idle timeout

---

## Documentation Updates

- [ ] Update team wiki with new config
- [ ] Share [QUICK_START.md](QUICK_START.md) with team
- [ ] Document any custom changes made
- [ ] Update runbook if needed

---

## Maintenance Tasks

After successful deployment:

- [ ] Set up monitoring alerts for `/health`
- [ ] Configure log rotation for `/var/log/mcp-gateway.log`
- [ ] Schedule regular test runs
- [ ] Document any environment-specific changes
- [ ] Remove old wrapper file (after confirming everything works)

---

## Sign-off

- [ ] Deployment completed by: ________________
- [ ] Date: ________________
- [ ] All tests passed: YES / NO
- [ ] Team notified: YES / NO
- [ ] Documentation updated: YES / NO

---

**Ready to deploy?** Start from the top and check off each item! ✅

**Questions?** See [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) or [README.md](README.md)

