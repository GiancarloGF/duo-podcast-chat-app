import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getSessionCookieOptions,
  revokeSessionFromCookie,
  SESSION_COOKIE_NAME,
} from '@/shared/infrastructure/auth/session';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    // Best effort revocation for stronger logout semantics across devices.
    await revokeSessionFromCookie(sessionCookie);
  }

  // Expire session cookie in browser.
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
