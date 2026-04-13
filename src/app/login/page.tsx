import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { LoginScreen } from '@/features/auth/presentation/components/LoginScreen';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';

export default async function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthenticatedLoginRedirect />
      </Suspense>
      <Suspense fallback={null}>
        <LoginScreen />
      </Suspense>
    </>
  );
}

async function AuthenticatedLoginRedirect(): Promise<null> {
  await connection();
  const { currentUser } = await getAuthenticatedAppForUser();

  if (currentUser) {
    redirect('/');
  }

  return null;
}
