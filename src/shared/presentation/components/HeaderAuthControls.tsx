'use client';

import { useState, useTransition } from 'react';
import { LogOut } from 'lucide-react';
import {
  signInWithGoogle,
  signOut,
} from '@/shared/infrastructure/firebase/auth';
import { useUserSession } from '@/features/auth/presentation/hooks/useUserSession';
import type { SerializableUser } from '@/shared/domain/interfaces/SerializableUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/presentation/components/ui/avatar';
import { Button } from '@/shared/presentation/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/presentation/components/ui/dropdown-menu';

interface HeaderAuthControlsProps {
  initialUser: SerializableUser | null;
}

export function HeaderAuthControls({ initialUser }: HeaderAuthControlsProps) {
  const user = useUserSession(initialUser);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const userDisplayName = user?.displayName || user?.email || 'Usuario';
  const userInitial = userDisplayName.trim().charAt(0).toUpperCase();

  function handleSignIn(): void {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Login failed', error);
        setErrorMessage('No se pudo iniciar sesion.');
      }
    });
  }

  function handleSignOut(): void {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Logout failed', error);
        setErrorMessage('No se pudo cerrar sesion.');
      }
    });
  }

  return (
    <div className='flex flex-col items-end gap-2'>
      <nav className='flex items-center gap-2'>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className='rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70'
                disabled={isPending}
              >
                <Avatar className='h-10 w-10'>
                  {user.photoURL ? (
                    <AvatarImage src={user.photoURL} alt={userDisplayName} />
                  ) : null}
                  <AvatarFallback>{userInitial || 'U'}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuLabel className='truncate uppercase tracking-wide font-bold'>
                {userDisplayName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={isPending}>
                <LogOut className='h-4 w-4' />
                Cerrar sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={handleSignIn} disabled={isPending}>
            {isPending ? 'Cargando...' : 'Iniciar sesion'}
          </Button>
        )}
      </nav>

      {errorMessage ? (
        <p className='text-xs font-semibold text-destructive'>{errorMessage}</p>
      ) : null}
    </div>
  );
}
