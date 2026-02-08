'use client';

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
    } catch (authError) {
      console.error('Error en login con Google:', authError);
      setError('No se pudo iniciar sesion. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className='min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-sky-50 via-blue-50 to-cyan-100 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800'>
      <div className='mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-md items-center justify-center'>
        <section className='w-full rounded-2xl border border-white/60 bg-white/90 p-8 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90'>
          <div className='mb-6 text-center'>
            <p className='mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300'>
              Relatos en Ingles
            </p>
            <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
              Iniciar sesion
            </h1>
            <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
              Accede para practicar traducciones y continuar tu progreso.
            </p>
          </div>

          <button
            type='button'
            onClick={handleSignIn}
            disabled={isLoading}
            className='inline-flex h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400'
          >
            {isLoading ? 'Conectando...' : 'Continuar con Google'}
          </button>

          {error && (
            <p className='mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'>
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
