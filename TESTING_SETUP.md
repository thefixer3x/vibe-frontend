# Testing Setup After Security Cleanup

## What Changed

We removed hardcoded credentials from:
- `lib/mcp/bridges/neon-bridge.js`
- `lib/mcp/bridges/neon-bridge-fixed.js`
- `lib/mcp/bridges/neon-bridge-real.js`
- `fix_stats_function.js`

## Required Environment Variables

These files now require environment variables to function:

```bash
# Required for Neon MCP bridges
NEON_API_KEY=your_neon_api_key
NEON_CONNECTION_STRING=postgresql://user:password@host:5432/dbname

# Alternative (used by fix_stats_function.js as fallback)
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

## Setup for Testing

1. Copy the example file:
   ```bash
   cd vibe-frontend
   cp .env.local.example .env.local
   ```

2. Add your test credentials to `.env.local`

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Services Affected

- **Neon MCP Bridge** - Database connectivity for memory services
- **MCP Gateway** - If it uses these bridges
- **Memory Management** - CRUD operations on memories

## Testing Without Real DB

If you want to test without a real database connection, you can:

1. Mock the database connection in the bridge files
2. Use a local PostgreSQL instance
3. Comment out the database-dependent features temporarily

## Production Deployment

When ready for production:
1. Add real credentials to VPS `.env.production` files
2. Update Netlify environment variables
3. Restart services with `pm2 restart all`
