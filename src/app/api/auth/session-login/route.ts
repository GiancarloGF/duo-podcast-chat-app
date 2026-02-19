import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  createSessionCookieFromIdToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '@/shared/infrastructure/auth/session';

interface SessionLoginRequest {
  idToken?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as SessionLoginRequest;
    const idToken = typeof body.idToken === 'string' ? body.idToken : '';

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticacion invalido.' },
        { status: 400 },
      );
    }

    // Create signed session cookie (server-managed, long-lived).
    const sessionCookie = await createSessionCookieFromIdToken(idToken);
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error('Error creating Firebase session cookie', error);

    return NextResponse.json(
      {
        success: false,
        error: 'No se pudo crear la sesion.',
      },
      { status: 500 },
    );
  }
}
