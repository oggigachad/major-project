// Middleware — protects /dashboard*, bounces authenticated users away from
// the auth pages, and applies security headers to every response.
// EDGE RUNTIME: imports only edge-safe code (jose) — no Prisma/bcrypt/redis.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, verifyAccessToken } from '@/lib/jwt';

const AUTH_PAGES = ['/login', '/signup'];

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  res.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  // Note: 'unsafe-eval' is required by Next.js dev overlays; tighten for prod builds.
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  // An expired access token is fine as long as a refresh cookie exists —
  // the dashboard's silent refresh will mint a fresh one on mount.
  const hasRefresh = Boolean(req.cookies.get(REFRESH_COOKIE)?.value);

  // Protect the dashboard.
  if (pathname.startsWith('/dashboard') && !payload && !hasRefresh) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(ACCESS_COOKIE);
    return applySecurityHeaders(res);
  }

  // Signed-in users shouldn't sit on login/signup.
  if (AUTH_PAGES.includes(pathname) && payload) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    // Everything except Next internals and public static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)',
  ],
};
