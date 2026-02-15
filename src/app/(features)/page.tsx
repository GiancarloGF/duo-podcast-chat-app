import { getHomeFeaturesAction } from '@/features/home/presentation/actions';
import { FeatureList } from '@/features/home/presentation/components/FeatureList';

export default async function Home() {
  const features = await getHomeFeaturesAction();

  return (
    <div className='py-8 sm:py-12'>
      <FeatureList features={features} />
    </div>
  );
}
