import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onIdTokenChanged } from '@/shared/infrastructure/firebase/auth';
import type { SerializableUser } from '@/shared/domain/interfaces/SerializableUser';

export function useUserSession(initialUser: SerializableUser | null) {
  // Use a union type for state because initialUser is simplified but updates are full User objects
  const [user, setUser] = useState<User | SerializableUser | null>(initialUser);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged((currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }

      // Reload so server components sync with latest auth state.
      if (initialUser?.uid && initialUser.uid !== currentUser?.uid) {
        window.location.reload();
      } else if (!initialUser && currentUser) {
        window.location.reload();
      }
    });

    return () => unsubscribe();
  }, [initialUser]);

  return user;
}
