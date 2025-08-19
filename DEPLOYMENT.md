# Vibe Frontend Deployment Guide

## Netlify Deployment Configuration

### Environment Variables

Set these environment variables in your Netlify dashboard:

#### Database
```
POSTGRES_URL=postgresql://your-production-db-url/database_name
```

#### Authentication
```
AUTH_SECRET=your-super-secure-production-secret-key-minimum-32-characters
```

#### Stripe (Optional)
```
STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_stripe_webhook_secret
```

#### Application URLs
```
BASE_URL=https://your-vibe-frontend.netlify.app
```

#### Memory Service Integration
```
MEMORY_SERVICE_URL=https://your-vibe-memory-service.herokuapp.com
MEMORY_SERVICE_SECRET=shared-secret-for-secure-service-communication
```

### Memory Service Deployment

For the memory service to work with the frontend, ensure:

1. **CORS Configuration**: The memory service must allow requests from your Netlify domain
2. **Service Authentication**: Configure the shared secret for secure communication
3. **Database Access**: Ensure the memory service can access its database from production

### Build Configuration

The `netlify.toml` file is configured with:
- Next.js build optimization
- API route redirects
- Security headers
- CORS headers for API communication

### Port Configuration

- **Development**: Frontend runs on port 3000, Memory Service on port 3001
- **Production**: 
  - Frontend: Handled by Netlify's CDN
  - Memory Service: Should be deployed to cloud provider (Heroku, Railway, etc.)

### API Routes

All API routes (`/api/*`) are automatically handled by Netlify Functions.

### Security Headers

Production deployment includes:
- XSS Protection
- Content Type Options
- Frame Options
- Referrer Policy

### Environment-Specific Features

The orchestrator service automatically detects the environment and:
- Uses localhost URLs in development
- Uses production URLs in deployment
- Handles service health checks with appropriate timeouts
- Provides detailed error messages for debugging

### Testing the Integration

1. Deploy the frontend to Netlify
2. Ensure memory service is deployed and accessible
3. Test the orchestrator commands:
   - "check service status"
   - "list my memories"
   - "search for documentation"

### Troubleshooting

#### Memory Service Connection Issues
- Check CORS configuration on memory service
- Verify MEMORY_SERVICE_URL is correct
- Ensure memory service is running and accessible
- Check firewall/network restrictions

#### Authentication Issues
- Verify AUTH_SECRET is set and consistent
- Check database connection
- Ensure session cookies work across domains

#### Build Issues
- Verify all environment variables are set
- Check Node.js version compatibility
- Review build logs for missing dependencies

## Vercel Deployment Configuration (Recommended)

### 1) Create Vercel Project
- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- Output dir: `.next`

### 2) Environment Variables (Project Settings → Environment Variables)

Required
```
AUTH_SECRET=generate_a_strong_secret # openssl rand -base64 32
POSTGRES_URL=postgresql://<user>:<pass>@<host>:<port>/<db>
# Set to your custom production domain
BASE_URL=https://vibe.seyederick.com
```

Memory Service (external microservice)
```
MEMORY_SERVICE_URL=https://<your-memory-service-host>
MEMORY_SERVICE_SECRET=<shared-secret>
NEXT_PUBLIC_MEMORY_API_URL=/api/memory
```

MCP (optional)
```
NEXT_PUBLIC_MCP_SERVER_URL=ws://localhost:3002/mcp
NEXT_PUBLIC_MCP_MODE=auto
NEXT_PUBLIC_ENABLE_MCP=true
```
Note: On production (`vibe.seyederick.com`), leave the local MCP server URL unset or disabled. The app will avoid connecting to `ws://localhost` when not configured.

Backup Login (optional)
```
BACKUP_LOGIN_ENABLED=true
BACKUP_USER_EMAIL=info@lanonasis.com
# Use a bcrypt hash of the password (do not store plaintext)
BACKUP_USER_PASSWORD_HASH=$2a$10$...
```
When enabled, if no user exists in the database and the provided email/password match these values, the app will create an owner account and team on first login. Disable after recovery.

Stripe (optional)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Apple App Store Connect (optional)
```
ENABLE_APPLE_CONNECT=true
APPLE_ISSUER_ID=...
APPLE_KEY_ID=...
# Either paste the raw .p8 key or base64-encode it
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----
# or base64
# APPLE_PRIVATE_KEY=BASE64_ENCODED_P8
```

### 3) Security Headers
This repo sets standard security headers via `next.config.ts` (CSP, HSTS, X-Frame-Options, Referrer-Policy, etc.).
You can also keep `vercel.json` headers if you prefer platform-level control.

### 4) Database Migrations
- Provision a managed Postgres (Neon, Supabase, RDS, etc.).
- Locally (or via CI), run: `npm run db:generate && npm run db:migrate`.
- For production migration workflows, prefer running drizzle-kit via CI with `POSTGRES_URL` scoped to prod.

### 5) Observability (optional but recommended)
- Add Sentry/Logflare/Datadog for client/server error reporting.
- Enable Vercel Analytics.

### 6) Rollout
- Connect GitHub repo → Vercel.
- Protect `main` with PR reviews.
- Use preview deployments to test MCP/Memory integration.
