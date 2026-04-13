'use client';

import Link from 'next/link';
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

interface HeaderProps {
  initialUser: SerializableUser | null;
}

// The header consumes the client auth session hook so avatar and login/logout
// controls stay synchronized with server-rendered auth changes.
export function Header({ initialUser }: HeaderProps) {
  const user = useUserSession(initialUser);
  const userDisplayName = user?.displayName || user?.email || 'Usuario';
  const userInitial = userDisplayName.trim().charAt(0).toUpperCase();

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
    <header className='w-full border-b-2 border-border bg-card'>
      <div className='mx-auto flex min-h-18 w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex min-w-0 flex-1 items-center'>
          <Link className='flex flex-col leading-tight' href='/'>
            <span className='text-lg font-black uppercase tracking-wide text-foreground sm:text-xl'>
              Ruway App
            </span>
            <span className='text-[11px] font-semibold uppercase text-muted-foreground sm:text-xs'>
              Practice your English
            </span>
          </Link>
        </div>

        <div className='flex shrink-0 items-center'>
          <nav className='flex items-center gap-2'>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className='rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
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
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className='h-4 w-4' />
                    Cerrar sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleSignIn}>
                Iniciar sesion
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
