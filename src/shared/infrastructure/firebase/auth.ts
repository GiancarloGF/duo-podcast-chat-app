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

export function onAuthStateChanged(cb: NextOrObserver<User>) {
  return _onAuthStateChanged(auth, cb);
}

export function onIdTokenChanged(cb: NextOrObserver<User>) {
  return _onIdTokenChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
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
