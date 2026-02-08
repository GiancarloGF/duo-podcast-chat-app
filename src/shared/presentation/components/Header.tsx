'use client';

import {
  signInWithGoogle,
  signOut,
} from '@/shared/infrastructure/firebase/auth';
import { useUserSession } from '@/features/auth/presentation/hooks/useUserSession';
import type { SerializableUser } from '@/shared/domain/interfaces/SerializableUser';

interface HeaderProps {
  initialUser: SerializableUser | null;
}

export function Header({ initialUser }: HeaderProps) {
  const user = useUserSession(initialUser);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <header className='w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60'>
      <div className='container flex h-14 items-center justify-between'>
        <div className='mr-4 hidden md:flex'>
          <a className='mr-6 flex items-center space-x-2' href='/'>
            <span className='hidden font-bold sm:inline-block'>
              Relatos en Ingles
            </span>
          </a>
        </div>
        <div className='flex flex-1 items-center justify-between space-x-2 md:justify-end'>
          <div className='w-full flex-1 md:w-auto md:flex-none'></div>
          <nav className='flex items-center space-x-2'>
            {user ? (
              <div className='flex items-center gap-4'>
                <span className='text-sm font-medium hidden sm:inline-block'>
                  {user.displayName || user.email}
                </span>
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt='Avatar'
                    className='h-8 w-8 rounded-full'
                  />
                )}
                <button
                  onClick={handleSignOut}
                  className='inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
                >
                  Cerrar sesion
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
              >
                Iniciar sesion
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
