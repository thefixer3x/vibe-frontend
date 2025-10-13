import { NextRequest, NextResponse } from 'next/server';

const MCP_GATEWAY_URL = process.env.NEXT_PUBLIC_MCP_GATEWAY_URL || 'https://link.seyederick.com';

/**
 * MCP Proxy API Route
 * 
 * Use this if you get CORS errors when calling the MCP gateway directly.
 * This route proxies requests to the MCP gateway from your server.
 * 
 * Usage:
 * - POST /api/mcp-proxy with MCP JSON-RPC payload
 * - GET /api/mcp-proxy/health for health check
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward API key if provided
    const apiKey = req.headers.get('x-api-key');
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(`${MCP_GATEWAY_URL}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    };
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('MCP Proxy Error:', error);
    return NextResponse.json({ 
      error: 'Proxy request failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Health check
    if (req.url?.includes('/health')) {
      const response = await fetch(`${MCP_GATEWAY_URL}/health`);
      const data = await response.json();
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      };
      
      return NextResponse.json(data, { 
        status: response.status,
        headers: corsHeaders
      });
    }

    // Method not allowed for other GET requests
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('MCP Proxy Health Check Error:', error);
    return NextResponse.json({ 
      error: 'Health check failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}