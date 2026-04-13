import type React from 'react';
import { Header } from '@/shared/presentation/components/Header';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className='min-h-screen'>
        <div className='mx-auto w-full max-w-6xl px-3 sm:px-6'>{children}</div>
      </main>
    </>
  );
}
