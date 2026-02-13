import { initializeServerApp, FirebaseServerApp } from 'firebase/app';
import { getAuth, User } from 'firebase/auth';
import { cookies } from 'next/headers';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function getAuthenticatedAppForUser(): Promise<{
  firebaseServerApp: FirebaseServerApp;
  currentUser: User | null;
}> {
  try {
    const cookieStore = await cookies();
    const authIdToken = cookieStore.get('__session')?.value;

    const firebaseServerApp = initializeServerApp(
      firebaseConfig,
      authIdToken ? { authIdToken } : {},
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    return { firebaseServerApp, currentUser: auth.currentUser };
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
