import {
  browserLocalPersistence,
  GoogleAuthProvider,
  NextOrObserver,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
  AuthError,
  User,
} from 'firebase/auth';
import { getClientAuth } from './config';

const auth = getClientAuth();
// Keep Firebase client user persisted across tabs/reloads.
const authPersistencePromise = setPersistence(auth, browserLocalPersistence).catch(
  (error: AuthError) => {
    console.warn('Could not set Firebase auth persistence', error);
  },
);

async function createServerSession(idToken: string): Promise<void> {
  // Backend creates the HttpOnly __session cookie.
  const response = await fetch('/api/auth/session-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error('No se pudo crear la sesion de servidor.');
  }
}

async function clearServerSession(): Promise<void> {
  // Backend clears and revokes the server-side session.
  const response = await fetch('/api/auth/session-logout', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('No se pudo cerrar la sesion de servidor.');
  }
}

export function onAuthStateChanged(cb: NextOrObserver<User>) {
  return _onAuthStateChanged(auth, cb);
}

export function onIdTokenChanged(cb: NextOrObserver<User>) {
  return _onIdTokenChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  try {
    await authPersistencePromise;
    const credential = await signInWithPopup(auth, provider);
    const idToken = await credential.user.getIdToken();
    // Exchange ID token for long-lived HttpOnly session cookie.
    await createServerSession(idToken);
    return credential;
  } catch (error) {
    try {
      await firebaseSignOut(auth);
    } catch (signOutError) {
      console.warn('Cleanup sign out after login failure failed', signOutError as AuthError);
    }

    console.error('Error signing in with Google', error as AuthError);
    throw error;
  }
}

export async function signOut() {
  try {
    // Clear backend cookie first so SSR/middleware stop seeing this session.
    await clearServerSession();
    return firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out', error as AuthError);
    throw error;
  }
}
