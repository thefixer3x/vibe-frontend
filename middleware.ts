import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';

const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes);

  // Lightweight rate limiting for sensitive endpoints (single-user-friendly)
  if (request.method === 'POST') {
    const ip = getClientIp(request as unknown as Request);
    const keyBase = `${ip}:${pathname}`;
    // Tighter limit on sign-in; moderate on memory API
    const isSignIn = pathname.includes('/sign-in');
    const isMemoryApi = pathname.startsWith('/api/memory');
    const limit = isSignIn ? 5 : isMemoryApi ? 60 : 0; // 5/min on sign-in, 60/min on memory API
    if (limit > 0) {
      const res = rateLimit({ key: keyBase, limit, windowMs: 60_000 });
      if (!res.allowed) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(res.resetInMs / 1000).toString()
          }
        });
      }
    }
  }

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
