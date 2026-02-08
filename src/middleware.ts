import type { NextRequest } from 'next/server';
import { authRouteGuard } from '@/shared/infrastructure/auth/route-guard';

export function middleware(request: NextRequest) {
  return authRouteGuard(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
