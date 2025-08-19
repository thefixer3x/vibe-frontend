import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getTeamForUser } from '@/lib/db/queries';
import { createCustomerPortalSession } from '@/lib/payments/stripe';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    const portal = await createCustomerPortalSession(team);
    const url = typeof portal === 'string' ? portal : portal.url;
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

