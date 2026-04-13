import type { NextRequest } from 'next/server';
import { authRouteGuard } from '@/shared/infrastructure/auth/route-guard';

// The proxy stays async because the guard now validates the session cookie
// against Firebase instead of checking for cookie presence only.
export async function proxy(request: NextRequest) {
  return authRouteGuard(request);
}

export const config = {
  // Keep auth checks on app routes while skipping API handlers, assets and
  // direct file requests.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
