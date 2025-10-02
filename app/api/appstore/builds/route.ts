import { NextResponse } from 'next/server';
import { env, boolFromEnv } from '@/lib/env';

export async function GET() {
  try {
    if (!boolFromEnv(env.ENABLE_APPLE_CONNECT)) {
      return NextResponse.json({ error: 'Apple Connect is disabled' }, { status: 501 });
    }

    // Use MCP Gateway to call App Store Connect tools
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:7777';
    const response = await fetch(`${gatewayUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'appstore_list_builds',
          arguments: { limit: 50, include: 'app,preReleaseVersion' }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gateway request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message || 'MCP Gateway error');
    }

    return NextResponse.json({ data: result.result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

