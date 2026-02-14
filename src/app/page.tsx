import { getHomeFeaturesAction } from '@/features/home/presentation/actions';
import { FeatureList } from '@/features/home/presentation/components/FeatureList';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';
import { Header } from '@/shared/presentation/components/Header';

export default async function Home() {
  const features = await getHomeFeaturesAction();
  const { currentUser } = await getAuthenticatedAppForUser();
  const serializableUser = currentUser
    ? {
        uid: currentUser.uid,
        email: currentUser.email || null,
        displayName: currentUser.displayName || null,
        photoURL: currentUser.photoURL || null,
      }
    : null;

  return (
    <>
      <Header initialUser={serializableUser} />
      <main className='min-h-screen'>
        <div className='max-w-6xl mx-auto py-8 sm:py-12'>

          <FeatureList features={features} />
        </div>
      </main>
    </>
  );
}
