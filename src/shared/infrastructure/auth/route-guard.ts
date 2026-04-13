import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  verifySessionCookie,
} from '@/shared/infrastructure/auth/session';

const LOGIN_PATH = '/login';

// Always clear invalid cookies with the same attributes used to set them,
// otherwise browsers may keep the stale cookie around.
function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}

// The proxy is the first auth boundary. It only treats a request as authenticated
// when the Firebase session cookie is present and verifiable.
export async function authRouteGuard(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isLoginRoute = pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
  const isAuthenticated = await (async (): Promise<boolean> => {
    if (!sessionCookie) {
      return false;
    }

    try {
      await verifySessionCookie(sessionCookie, true);
      return true;
    } catch (error) {
      console.warn('Invalid session cookie detected in proxy.', {
        pathname,
        error,
      });
      return false;
    }
  })();

  if (!isAuthenticated && !isLoginRoute) {
    // Preserve the original destination so the login screen can send the user
    // back after a successful sign-in.
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('next', pathname);
    return clearSessionCookie(NextResponse.redirect(loginUrl));
  }

  if (!isAuthenticated && sessionCookie && isLoginRoute) {
    return clearSessionCookie(NextResponse.next());
  }

  if (isAuthenticated && isLoginRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();

  if (!isAuthenticated && sessionCookie) {
    return clearSessionCookie(response);
  }

  return response;
}
