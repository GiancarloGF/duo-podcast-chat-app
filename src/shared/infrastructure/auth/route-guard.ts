import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/shared/infrastructure/auth/session';

const LOGIN_PATH = '/login';

export function authRouteGuard(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(sessionCookie);
  const isLoginRoute = pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);

  if (!isAuthenticated && !isLoginRoute) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
