import type { DecodedIdToken } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  verifySessionCookie,
} from '@/shared/infrastructure/auth/session';

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

function mapDecodedTokenToUser(decodedToken: DecodedIdToken): AuthenticatedUser {
  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? null,
    displayName: typeof decodedToken.name === 'string' ? decodedToken.name : null,
    photoURL: typeof decodedToken.picture === 'string' ? decodedToken.picture : null,
  };
}

export async function getAuthenticatedAppForUser(): Promise<{
  currentUser: AuthenticatedUser | null;
}> {
  try {
    // Server-side source of truth for auth: secure HttpOnly session cookie.
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return { currentUser: null };
    }

    try {
      const decodedToken = await verifySessionCookie(sessionCookie);
      return { currentUser: mapDecodedTokenToUser(decodedToken) };
    } catch (sessionError) {
      console.warn('Invalid Firebase session cookie.', sessionError);
      return { currentUser: null };
    }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      error.digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw error;
    }

    console.error('Error initializing server app', error);
    throw error;
  }
}
