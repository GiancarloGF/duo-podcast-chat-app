import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { onIdTokenChanged } from '@/shared/infrastructure/firebase/auth';
import type { SerializableUser } from '@/shared/domain/interfaces/SerializableUser';

// Keep client auth state aligned with the server-rendered tree. The hook only
// triggers router.refresh when the effective authenticated user changes.
export function useUserSession(initialUser: SerializableUser | null) {
  const router = useRouter();
  // Use a union type for state because initialUser is simplified but updates are full User objects
  const [user, setUser] = useState<User | SerializableUser | null>(initialUser);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged((currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }

      // Refresh server components so auth-dependent UI stays in sync.
      if (initialUser?.uid && initialUser.uid !== currentUser?.uid) {
        router.refresh();
      } else if (!initialUser && currentUser) {
        router.refresh();
      }
    });

    return () => unsubscribe();
  }, [initialUser, router]);

  return user;
}
