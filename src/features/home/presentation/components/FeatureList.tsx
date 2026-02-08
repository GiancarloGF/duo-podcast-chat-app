import { Feature } from '@/features/home/domain/entities/Feature';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/presentation/components/ui/card';

export function FeatureList({ features }: { features: Feature[] }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
      {features.map((feature) => (
        <Link
          href={feature.isEnabled ? feature.route : '#'}
          key={feature.id}
          className={!feature.isEnabled ? 'pointer-events-none opacity-50' : ''}
        >
          <Card className='hover:shadow-lg transition-shadow cursor-pointer h-full border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800'>
            <CardHeader>
              <CardTitle className='text-xl text-blue-900 dark:text-blue-100'>
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 dark:text-gray-300'>
                {feature.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
