# Netlify Deployment Guide

## Quick Deploy Steps

### 1. Manual Deployment via Netlify Dashboard
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag the entire `vibe-frontend` folder
4. Or connect to Git repository

### 2. Build Settings
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** `18`

### 3. Environment Variables
Add these in Site Settings → Environment Variables:

```
POSTGRES_URL=your_neon_database_url_from_neon_dashboard

PICSART_API_KEY=your_picsart_api_key_from_picsart_dashboard

AUTH_SECRET=generate_a_random_32_character_secret

BASE_URL=https://your-app-name.netlify.app

STRIPE_SECRET_KEY=your_stripe_secret_key_from_stripe_dashboard
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

NEXT_PUBLIC_API_SERVER_URL=http://localhost:3001
```

**⚠️ IMPORTANT: Never commit actual API keys to Git!**
- Get POSTGRES_URL from your Neon dashboard
- Get PICSART_API_KEY from your Picsart account  
- Generate AUTH_SECRET: `openssl rand -base64 32`
- Get Stripe keys from your Stripe dashboard

### 4. Deploy
- The `netlify.toml` is already configured
- Should deploy automatically once environment variables are set

## What's Ready
✅ Netlify configuration file  
✅ Database imports fixed (no build-time errors)  
✅ Environment variable fallbacks  
✅ API routes configured  
✅ Stripe integration ready  

## Features Available
- 🎨 Picsart AI image generation
- 💳 Stripe payment processing  
- 🗃️ Neon PostgreSQL database
- 🖥️ VPS server management interface
- 🔧 Universal API testing tools
- 📊 Activity logs and monitoring

**Just drag and drop to Netlify!** 🚀