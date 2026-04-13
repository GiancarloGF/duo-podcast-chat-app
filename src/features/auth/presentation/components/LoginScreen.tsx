'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signInWithGoogle } from '@/shared/infrastructure/firebase/auth';

interface LoginScreenProps {
  nextPath: string;
}

export function LoginScreen({ nextPath }: LoginScreenProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // Use App Router navigation so the authenticated server tree refreshes
      // without forcing a full-page reload.
      router.replace(nextPath);
      router.refresh();
    } catch (authError) {
      console.error('Error en login con Google:', authError);
      setError('No se pudo iniciar sesion. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className='min-h-screen p-4 sm:p-8'>
      <div className='mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-3 md:min-h-[calc(100vh-4rem)]'>
        <section className='grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:gap-12'>
          <div className='mx-auto w-full max-w-md space-y-6 px-5 md:space-y-8 rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
            <div>
              <h1 className='text-4xl font-black tracking-wide text-foreground md:text-5xl'>
                Iniciar Sesión
              </h1>
              <p className='mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base font-medium'>
                Pon a prueba tu Ingles mediante ejercicios interactivos. ¡Vamos!
              </p>
            </div>

            <button
              type='button'
              onClick={handleSignIn}
              disabled={isLoading}
              className='inline-flex h-12 w-full items-center justify-center gap-3 rounded-[8px] border-2 border-border bg-primary px-6 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-[5px_5px_0_0_var(--color-border)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-border)] disabled:cursor-not-allowed disabled:opacity-60 md:h-14 md:text-base'
            >
              <span className='inline-flex h-6 w-6 items-center justify-center rounded-[5px] bg-white border border-border'>
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
              <p className='rounded-[8px] border-2 border-red-700 bg-[#ffe8e8] px-3 py-2 text-sm font-semibold text-red-800'>
                {error}
              </p>
            )}
          </div>

          <div className='relative mx-auto aspect-[3/4] w-full max-w-lg overflow-hidden rounded-[10px] border-2 border-border shadow-[8px_8px_0_0_var(--color-border)]'>
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
