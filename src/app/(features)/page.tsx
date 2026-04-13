import { getHomeFeaturesForPage } from '@/features/home/server/getHomeFeaturesForPage';
import { FeatureList } from '@/features/home/presentation/components/FeatureList';

export default async function Home() {
  const features = await getHomeFeaturesForPage();

  return (
    <div className='py-8 sm:py-12'>
      <FeatureList features={features} />
    </div>
  );
}
