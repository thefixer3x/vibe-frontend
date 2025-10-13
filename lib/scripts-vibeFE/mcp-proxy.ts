import { NextApiRequest, NextApiResponse } from 'next';

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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.status(200).end();
    return;
  }

  try {
    // Health check
    if (req.method === 'GET' && req.url?.includes('/health')) {
      const response = await fetch(`${MCP_GATEWAY_URL}/health`);
      const data = await response.json();
      
      return res.status(response.status).json(data);
    }

    // MCP JSON-RPC requests
    if (req.method === 'POST') {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Forward API key if provided
      const apiKey = req.headers['x-api-key'] as string;
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch(`${MCP_GATEWAY_URL}/mcp`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      
      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      return res.status(response.status).json(data);
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('MCP Proxy Error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
