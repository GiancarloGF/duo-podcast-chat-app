import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { authRouteGuard } from '@/shared/infrastructure/auth/route-guard';

const { verifySessionCookieMock } = vi.hoisted(() => ({
  verifySessionCookieMock: vi.fn(),
}));
const SESSION_COOKIE_NAME = '__session';

vi.mock('server-only', () => ({}));

vi.mock('@/shared/infrastructure/auth/session', () => {
  return {
    SESSION_COOKIE_NAME: '__session',
    getSessionCookieOptions: () => ({
      httpOnly: true,
      maxAge: 60,
      path: '/',
      sameSite: 'strict',
      secure: false,
    }),
    verifySessionCookie: verifySessionCookieMock,
  };
});

describe('authRouteGuard', () => {
  beforeEach(() => {
    verifySessionCookieMock.mockReset();
  });

  it('redirects protected routes without a valid session', async () => {
    const request = new NextRequest('http://localhost/stories');

    const response = await authRouteGuard(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/login?next=%2Fstories');
  });

  it('lets protected routes continue when the session is valid', async () => {
    verifySessionCookieMock.mockResolvedValueOnce({ uid: 'user-1' });

    const request = new NextRequest('http://localhost/stories', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=valid-cookie`,
      },
    });

    const response = await authRouteGuard(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('clears invalid cookies and allows access to login', async () => {
    verifySessionCookieMock.mockRejectedValueOnce(new Error('expired'));

    const request = new NextRequest('http://localhost/login', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=expired-cookie`,
      },
    });

    const response = await authRouteGuard(request);

    expect(response.status).toBe(200);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
  });
});
