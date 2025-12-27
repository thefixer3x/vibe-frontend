import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: process.env.VERCEL || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    },
    env_vars: {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      BASE_URL: process.env.BASE_URL || 'not set',
      AUTH_SECRET: !!process.env.AUTH_SECRET,
    },
    build_info: {
      next_version: 'Next.js app',
      deployment_platform: process.env.VERCEL 
        ? 'Vercel' 
        : (process.env.NODE_ENV === 'production' && !process.env.VERCEL ? 'VPS' : 'Development')
    }
  };

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}