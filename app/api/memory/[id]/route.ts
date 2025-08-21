import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'http://localhost:3001';
const MEMORY_SERVICE_SECRET = process.env.MEMORY_SERVICE_SECRET;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication disabled - use mock user
    const user = await getUser();

    const { id } = await params;
    
    const response = await fetch(`${MEMORY_SERVICE_URL}/api/v1/memory/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.id}`,
        'X-Service-Secret': MEMORY_SERVICE_SECRET || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Memory service error' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Memory proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication disabled - use mock user
    const user = await getUser();

    const { id } = await params;
    const body = await request.json();
    
    const response = await fetch(`${MEMORY_SERVICE_URL}/api/v1/memory/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.id}`,
        'X-Service-Secret': MEMORY_SERVICE_SECRET || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Memory service error' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Memory proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication disabled - use mock user
    const user = await getUser();

    const { id } = await params;
    
    const response = await fetch(`${MEMORY_SERVICE_URL}/api/v1/memory/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.id}`,
        'X-Service-Secret': MEMORY_SERVICE_SECRET || '',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Memory service error' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Memory proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}