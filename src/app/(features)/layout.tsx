import type React from 'react';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';
import { Header } from '@/shared/presentation/components/Header';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { currentUser } = await getAuthenticatedAppForUser();
  const serializableUser = currentUser
    ? {
        uid: currentUser.uid,
        email: currentUser.email || null,
        displayName: currentUser.displayName || null,
        photoURL: currentUser.photoURL || null,
      }
    : null;

  return (
    <>
      <Header initialUser={serializableUser} />
      <main className='min-h-screen'>
        <div className='mx-auto w-full max-w-6xl px-3 sm:px-6 py-4 sm:py-6'>{children}</div>
      </main>
    </>
  );
}
