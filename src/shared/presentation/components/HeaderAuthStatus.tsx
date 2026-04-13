import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';
import { HeaderAuthControls } from '@/shared/presentation/components/HeaderAuthControls';

export async function HeaderAuthStatus() {
  const { currentUser } = await getAuthenticatedAppForUser();
  const serializableUser = currentUser
    ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
      }
    : null;

  return <HeaderAuthControls initialUser={serializableUser} />;
}
