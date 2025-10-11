# 🚀 Quick Start: Remote MCP Access

## TL;DR - Just Show Me The Config!

### For Claude Desktop

**Mac**: Edit `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: Edit `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse"
    }
  }
}
```

**Important**: 
- ✅ Use `/sse` endpoint (not just the base URL)
- ✅ Restart Claude Desktop after saving
- ✅ Make sure your gateway is running

---

## ⚡ One-Command Test

```bash
# Test if SSE is working
curl -N https://link.seyederick.com/sse

# Expected output:
# data: {"type":"connected","sessionId":"session_1234..."}
```

If you see the connection message, it's working! 🎉

---

## 🔍 Available Endpoints

| Endpoint | Protocol | Use For |
|----------|----------|---------|
| `/sse` | SSE | **Claude Desktop, Cursor** |
| `/ws` | WebSocket | Real-time apps |
| `/mcp` | HTTP POST | curl, testing, APIs |

---

## 🧪 Quick Test Suite

```bash
# Run the test script
cd /root/vibe-frontend/lib/mcp/gateway
./test-sse.sh https://link.seyederick.com

# Or test locally
./test-sse.sh http://localhost:7777
```

---

## ❓ FAQ

**Q: Why `/sse` instead of just the base URL?**  
A: Claude Desktop and most MCP clients require the SSE (Server-Sent Events) protocol endpoint specifically.

**Q: Can I use this with Claude.ai (web version)?**  
A: Yes! The SSE protocol is compatible with web clients.

**Q: Do I need to keep the wrapper file?**  
A: No! That's the whole point - direct URL access means no wrapper needed.

**Q: What about API keys?**  
A: Add them in the config:
```json
{
  "mcpServers": {
    "seyederick-mcp": {
      "url": "https://link.seyederick.com/sse",
      "headers": {
        "X-API-Key": "your_key_here"
      }
    }
  }
}
```

**Q: It's not connecting, what do I check?**  
1. Gateway running? `curl https://link.seyederick.com/health`
2. Firewall okay? `curl -N https://link.seyederick.com/sse`
3. Restarted Claude? Close it completely and reopen
4. Config syntax? JSON must be valid

---

## 🎯 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| "Connection refused" | Check if gateway is running |
| "Session not found" | Sessions expire - reconnect (automatic) |
| "Method not found" | Restart gateway to load new endpoints |
| Tools not showing | Check source status in `/health` |

---

## 📚 More Information

- **Full Configuration Guide**: See [REMOTE_CONFIG.md](REMOTE_CONFIG.md)
- **Migration from Wrapper**: See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Protocol Details**: See [unified-gateway.ts](unified-gateway.ts)

---

## ✨ That's It!

You're now accessing your MCP services remotely without any wrapper. Enjoy! 🎊

