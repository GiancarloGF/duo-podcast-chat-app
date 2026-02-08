import type React from 'react';

import type { Metadata } from 'next';

// import { Analytics } from "@vercel/analytics/next"
import './globals.css';
import { Header } from '@/shared/presentation/components/Header';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';

import { Varela_Round } from 'next/font/google';

// Initialize fonts
const varela_round = Varela_Round({
  subsets: ['latin'],
  variable: '--font-varela-round',
  display: 'swap',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Relatos en Inglés - Practica Inglés con Podcasts',
  description:
    'Aprende inglés traduciendo historias reales y fascinantes del podcast Relatos en Inglés',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
};

export default async function RootLayout({
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
    <html lang='es'>
      <body className={`${varela_round.variable} font-sans antialiased`}>
        <Header initialUser={serializableUser} />
        {children}
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
