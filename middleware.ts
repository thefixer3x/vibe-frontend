import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle dashboard routes - redirect to sign-in
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Allow all other routes to pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except API routes, static files, and favicon
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
