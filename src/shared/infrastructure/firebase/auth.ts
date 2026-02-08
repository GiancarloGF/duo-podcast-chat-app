import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
  User,
  NextOrObserver,
  AuthError,
} from 'firebase/auth';
import { getClientAuth } from './config';

const auth = getClientAuth();

function setSessionCookie(token: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const secureFlag = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `__session=${token}; path=/; max-age=3600; samesite=strict${secureFlag}`;
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
    const credential = await signInWithPopup(auth, provider);
    const idToken = await credential.user.getIdToken();
    setSessionCookie(idToken);
    return credential;
  } catch (error) {
    console.error('Error signing in with Google', error as AuthError);
    throw error;
  }
}

export async function signOut() {
  try {
    return firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out', error as AuthError);
    throw error;
  }
}
