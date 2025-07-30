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