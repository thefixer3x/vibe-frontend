import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Authentication disabled - allow all routes to pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except API routes, static files, and favicon
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
