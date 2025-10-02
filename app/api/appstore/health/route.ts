import { NextResponse } from 'next/server';
import { env, boolFromEnv } from '@/lib/env';

export async function GET() {
  try {
    if (!boolFromEnv(env.ENABLE_APPLE_CONNECT)) {
      return NextResponse.json({ 
        status: 'disabled',
        message: 'Apple Connect is disabled',
        enabled: false
      });
    }

    // Use MCP Gateway to call App Store Connect health check
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
          name: 'appstore_health_check',
          arguments: {}
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gateway request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      return NextResponse.json({ 
        status: 'error',
        message: result.error.message || 'MCP Gateway error',
        enabled: true,
        error: result.error
      });
    }

    return NextResponse.json({ 
      status: 'healthy',
      message: 'App Store Connect is working',
      enabled: true,
      details: result.result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      status: 'error',
      message,
      enabled: true,
      error: message
    }, { status: 500 });
  }
}
