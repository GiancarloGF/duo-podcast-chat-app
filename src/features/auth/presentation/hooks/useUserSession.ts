import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onIdTokenChanged } from '@/shared/infrastructure/firebase/auth';
import type { SerializableUser } from '@/shared/domain/interfaces/SerializableUser';

// Helper to set cookie (client-side)
// Ideally use a library like 'js-cookie' or similar if available, or just document.cookie
// Next.js doesn't have a built-in client-side cookie setter in strict sense, but we can use document.cookie
function setCookie(name: string, value: string) {
  const secureFlag = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${value}; path=/; max-age=3600; samesite=strict${secureFlag}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

// ...

export function useUserSession(initialUser: SerializableUser | null) {
  // Use a union type for state because initialUser is simplified but updates are full User objects
  const [user, setUser] = useState<User | SerializableUser | null>(initialUser);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(async (currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
        const idToken = await currentUser.getIdToken();
        setCookie('__session', idToken);
      } else {
        setUser(null);
        deleteCookie('__session');
      }

      // If the initial user was present but now we have a different user (or null), reload
      // This is to ensure server components reflect the change
      // Only reload if we had an initial user and the state actually changed in a way that affects server rendering context
      if (initialUser?.uid && initialUser.uid !== currentUser?.uid) {
        window.location.reload();
      }
      // If we didn't have a user, and now we do, we should also probably reload to hydrate server state?
      // User snippet: "If initialUser.uid === user.uid ... return; window.location.reload()"
      // It implies whenever they differ, reload.
      else if (!initialUser && currentUser) {
        window.location.reload();
      }
    });

    return () => unsubscribe();
  }, [initialUser]);

  return user;
}
