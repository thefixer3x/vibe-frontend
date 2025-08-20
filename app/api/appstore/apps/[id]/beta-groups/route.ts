import { NextResponse } from 'next/server';
import { appStoreClient } from '@/lib/apple/appstore';
import { env, boolFromEnv } from '@/lib/env';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!boolFromEnv(env.ENABLE_APPLE_CONNECT)) {
      return NextResponse.json({ error: 'Apple Connect is disabled' }, { status: 501 });
    }
    const { id } = await params;
    const data = await appStoreClient.listTestFlightBetaGroups(id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

