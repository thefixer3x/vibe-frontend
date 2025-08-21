import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'http://localhost:3001';
const MEMORY_SERVICE_SECRET = process.env.MEMORY_SERVICE_SECRET;

// Mock memories for development/testing (shared with main route)
const mockMemories = [
  {
    id: 1,
    title: 'MCP Test Memory',
    content: 'This is a test memory created via MCP',
    memory_type: 'context',
    similarity_score: 0.95,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function POST(request: NextRequest) {
  try {
    // Authentication disabled - use mock user
    const user = await getUser();

    const body = await request.json();
    
    // For development/testing, try external service first, fallback to mock
    if (process.env.NODE_ENV === 'development') {
      try {
        const response = await fetch(`${MEMORY_SERVICE_URL}/api/v1/memory/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.id}`,
            'X-Service-Secret': MEMORY_SERVICE_SECRET || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(2000), // 2 second timeout
        });

        const data = await response.json();
        
        if (response.ok) {
          return NextResponse.json(data);
        }
      } catch (error) {
        console.warn('Memory search service unavailable, using mock implementation');
      }
    }

    // Mock search implementation - simple text matching
    const query = body.query?.toLowerCase() || '';
    const filteredResults = mockMemories.filter(memory => 
      memory.title.toLowerCase().includes(query) ||
      memory.content.toLowerCase().includes(query)
    );

    return NextResponse.json({
      results: filteredResults,
      total: filteredResults.length,
      query: body.query,
      threshold: body.threshold || 0.7
    });
  } catch (error) {
    console.error('Memory search proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}