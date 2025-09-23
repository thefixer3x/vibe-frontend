import { NextResponse } from 'next/server';
import { apiServiceManager } from '@/lib/services/api-service';

export async function GET() {
  try {
    const services = await apiServiceManager.getServiceClients();
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    if (!service) {
      return NextResponse.json({ error: 'Missing service parameter' }, { status: 400 });
    }

    const result = await apiServiceManager.testServiceConnection(service);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
