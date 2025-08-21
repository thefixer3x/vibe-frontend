import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'http://localhost:3001';
const MEMORY_SERVICE_SECRET = process.env.MEMORY_SERVICE_SECRET;

// Mock memory store for development/testing
const mockMemories: any[] = [];
let memoryIdCounter = 1;

export async function GET(request: NextRequest) {
  try {
    // Authentication disabled - use mock user
    const user = await getUser();

    // For development/testing, try external service first, fallback to mock
    if (process.env.NODE_ENV === 'development') {
      try {
        const searchParams = request.nextUrl.searchParams;
        const queryString = searchParams.toString();
        
        const response = await fetch(`${MEMORY_SERVICE_URL}/api/v1/memory?${queryString}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.id}`,
            'X-Service-Secret': MEMORY_SERVICE_SECRET || '',
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(2000), // 2 second timeout
        });

        const data = await response.json();
        
        if (response.ok) {
          return NextResponse.json(data);
        }
      } catch (error) {
        console.warn('Memory service unavailable, using mock data');
      }
    }

    // Return mock data
    return NextResponse.json({
      data: mockMemories,
      total: mockMemories.length,
      page: 1,
      limit: 10,
      hasMore: false
    });
  } catch (error) {
    console.error('Memory proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication disabled - use mock user
    const user = await getUser();

    const body = await request.json();
    
    // For development/testing, try external service first, fallback to mock
    if (process.env.NODE_ENV === 'development') {
      try {
        const response = await fetch(`${MEMORY_SERVICE_URL}/api/v1/memory`, {
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
        console.warn('Memory service unavailable, using mock implementation');
      }
    }

    // Mock implementation
    const newMemory = {
      id: memoryIdCounter++,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id,
      access_count: 0,
      relevance_score: 1.0
    };
    
    mockMemories.push(newMemory);
    
    return NextResponse.json(newMemory);
  } catch (error) {
    console.error('Memory proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}