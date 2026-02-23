import 'server-only';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getAdminCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials are missing. Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function getAdminApp() {
  // Reuse singleton app to avoid duplicate initialization in server runtime.
  if (getApps().length > 0) {
    return getApp();
  }

  const credentials = getAdminCredentials();
  return initializeApp({
    credential: cert(credentials),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
