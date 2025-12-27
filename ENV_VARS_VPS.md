# Environment Variables for VPS Deployment

## Quick Reference

Copy these variables to your `.env.production` file on the VPS.

## Required Variables

```bash
# Environment
NODE_ENV=production

# Base URL - Your domain or VPS IP
BASE_URL=https://yourdomain.com

# Database - PostgreSQL connection string
POSTGRES_URL=postgresql://user:password@host:5432/database_name

# Authentication - Generate with: openssl rand -base64 32
AUTH_SECRET=your-generated-secret-minimum-32-characters
```

## Memory Service Configuration

```bash
# If memory service is on same VPS:
MEMORY_SERVICE_URL=http://localhost:3001
MEMORY_SERVICE_SECRET=your-shared-secret

# If memory service is external:
# MEMORY_SERVICE_URL=https://your-memory-service.com
# MEMORY_SERVICE_SECRET=your-shared-secret

NEXT_PUBLIC_MEMORY_API_URL=/api/memory
NEXT_PUBLIC_MEMORY_API_KEY=
```

## MCP Gateway Configuration

```bash
# If MCP gateway is on same VPS (port 7777):
NEXT_PUBLIC_MCP_SERVER_URL=ws://localhost:7777/mcp
NEXT_PUBLIC_GATEWAY_URL=http://localhost:7777

# If MCP gateway is external:
# NEXT_PUBLIC_MCP_SERVER_URL=wss://link.seyederick.com/mcp
# NEXT_PUBLIC_GATEWAY_URL=https://link.seyederick.com

NEXT_PUBLIC_MCP_MODE=auto
NEXT_PUBLIC_ENABLE_MCP=true
```

## Optional: Stripe

```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
```

## Optional: Apple App Store Connect

```bash
ENABLE_APPLE_CONNECT=false
APPLE_ISSUER_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

## Database Connection Examples

### Supabase
```bash
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
```

### Neon
```bash
POSTGRES_URL=postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
```

### Direct PostgreSQL
```bash
POSTGRES_URL=postgresql://user:password@your-db-host:5432/database_name
```

## Key Differences from Vercel

1. **BASE_URL**: Must be explicitly set (Vercel auto-detects)
2. **Database**: Direct connection string (no Vercel Postgres wrapper)
3. **Memory Service**: Use localhost if on same VPS, or full URL if external
4. **MCP Gateway**: Use localhost if on same VPS, or full URL if external

## Security Notes

- Never commit `.env.production` to version control
- Use `chmod 600 .env.production` to restrict access
- Generate strong secrets: `openssl rand -base64 32`
- Use environment-specific values (don't reuse dev values)
