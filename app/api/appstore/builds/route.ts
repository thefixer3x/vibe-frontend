import { NextResponse } from 'next/server';
import { appStoreClient } from '@/lib/apple/appstore';
import { env, boolFromEnv } from '@/lib/env';

export async function GET() {
  try {
    if (!boolFromEnv(env.ENABLE_APPLE_CONNECT)) {
      return NextResponse.json({ error: 'Apple Connect is disabled' }, { status: 501 });
    }
    const data = await appStoreClient.listBuilds({ limit: 50, include: 'app,preReleaseVersion' });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

