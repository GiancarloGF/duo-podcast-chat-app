'use client';

import Image from 'next/image';
import { useState } from 'react';
import { signInWithGoogle } from '@/shared/infrastructure/firebase/auth';

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      const nextPath =
        new URLSearchParams(window.location.search).get('next') || '/';
      window.location.assign(nextPath);
    } catch (authError) {
      console.error('Error en login con Google:', authError);
      setError('No se pudo iniciar sesion. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className='min-h-screen bg-white md:bg-[#f3f4f3] md:p-8'>
      <div className='mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center bg-white p-6 md:min-h-[calc(100vh-4rem)] md:rounded-3xl md:border md:border-black/5 md:p-8 md:shadow-[0_20px_70px_-35px_rgba(0,0,0,0.4)]'>
        <section className='grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:gap-12'>
          <div className='mx-auto w-full max-w-md space-y-6 px-1 md:space-y-8'>
            <div>
              <h1 className='text-4xl font-bold tracking-tight text-[#111111] md:text-5xl'>
                Welcome back!
              </h1>
              <p className='mt-4 max-w-sm text-sm leading-relaxed text-[#545454] md:text-base'>
                Practica traducciones en contexto real y continua tu progreso
                de forma simple.
              </p>
            </div>

            <button
              type='button'
              onClick={handleSignIn}
              disabled={isLoading}
              className='inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#111111]/15 bg-[#111111] px-6 text-sm font-semibold text-white transition hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-60 md:h-14 md:text-base'
            >
              <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-white'>
                <Image
                  src='/images/google_logo.webp'
                  alt='Google'
                  width={16}
                  height={16}
                  className='h-4 w-4'
                />
              </span>
              {isLoading ? 'Conectando...' : 'Entrar con Google'}
            </button>

            {error && (
              <p className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                {error}
              </p>
            )}
          </div>

          <div className='relative mx-auto aspect-[3/4] w-full max-w-lg overflow-hidden rounded-3xl'>
            <Image
              src='/images/ruway_login_portrait.webp'
              alt='Ilustracion de practica de ingles'
              fill
              priority
              sizes='(max-width: 1024px) 100vw, 560px'
              className='object-cover object-center'
            />
          </div>
        </section>
      </div>
    </main>
  );
}
