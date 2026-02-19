import 'server-only';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth } from '@/shared/infrastructure/firebase/admin';

export const SESSION_COOKIE_NAME = '__session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export function getSessionCookieOptions() {
  // Cookie policy for web sessions created by Firebase Admin.
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function createSessionCookieFromIdToken(
  idToken: string,
  expiresInMs = SESSION_MAX_AGE_MS,
): Promise<string> {
  // Exchange short-lived ID token for longer-lived signed session cookie.
  const adminAuth = getAdminAuth();
  return adminAuth.createSessionCookie(idToken, { expiresIn: expiresInMs });
}

export async function verifySessionCookie(
  sessionCookie: string,
  checkRevoked = false,
): Promise<DecodedIdToken> {
  const adminAuth = getAdminAuth();
  return adminAuth.verifySessionCookie(sessionCookie, checkRevoked);
}

export async function revokeSessionFromCookie(sessionCookie: string): Promise<void> {
  const adminAuth = getAdminAuth();

  try {
    // Revoke all refresh tokens for this user to hard-close sessions.
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    await adminAuth.revokeRefreshTokens(decodedToken.uid);
  } catch (error) {
    console.warn('Could not revoke session cookie tokens', error);
  }
}
