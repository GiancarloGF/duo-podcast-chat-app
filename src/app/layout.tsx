import type React from 'react';

import type { Metadata } from 'next';

// import { Analytics } from "@vercel/analytics/next"
import './globals.css';

import { Bungee, IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import { Toaster } from '@/shared/presentation/components/ui/sonner';
import { ThemeProvider } from '@/shared/presentation/layouts/theme-provider';

// Initialize fonts
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
  weight: ['400', '600'],
});

const bungee = Bungee({
  subsets: ['latin'],
  variable: '--font-bungee',
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
  return (
    <html lang='es'>
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${bungee.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
