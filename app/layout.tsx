import type React from 'react';
// ... existing code ...
import type { Metadata } from 'next';

// import { Analytics } from "@vercel/analytics/next"
import './globals.css';

import { Nunito } from 'next/font/google';

// Initialize fonts
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='es'>
      <body className={`${nunito.variable} font-sans antialiased`}>
        {children}
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
