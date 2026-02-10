import { Feature } from '@/features/home/domain/entities/Feature';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/presentation/components/ui/card';

const featureVisuals: Record<
  string,
  {
    iconPath?: string;
    iconBgClass: string;
    cardHoverClass: string;
  }
> = {
  stories: {
    iconPath: '/icons/translate_bold_icon.svg',
    iconBgClass: 'bg-[#c8f2cf]',
    cardHoverClass: 'hover:bg-[#c8f2cf]',
  },
  'phrasal-verbs': {
    iconBgClass: 'bg-[#ffe8a6]',
    cardHoverClass: 'hover:bg-[#ffe8a6]',
  },
  'coming-soon': {
    iconBgClass: 'bg-[#ffe8a6]',
    cardHoverClass: 'hover:bg-[#ffe8a6]',
  },
};

export function FeatureList({ features }: { features: Feature[] }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto'>
      {features.map((feature) => (
        <Link
          href={feature.isEnabled ? feature.route : '#'}
          key={feature.id}
          className={!feature.isEnabled ? 'pointer-events-none opacity-50' : ''}
        >
          <Card
            className={`cursor-pointer h-full bg-card transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--color-border)] ${featureVisuals[feature.id]?.cardHoverClass ?? 'hover:bg-muted'}`}
          >
            <CardHeader>
              <div
                className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-border shadow-[3px_3px_0_0_var(--color-border)] ${featureVisuals[feature.id]?.iconBgClass ?? 'bg-muted'}`}
              >
                {featureVisuals[feature.id]?.iconPath ? (
                  <Image
                    src={featureVisuals[feature.id].iconPath!}
                    alt={`${feature.title} icono`}
                    width={24}
                    height={24}
                    className='h-6 w-6'
                  />
                ) : (
                  <Sparkles className='h-5 w-5 text-foreground' />
                )}
              </div>
              <CardTitle className='text-2xl text-foreground'>
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground font-medium'>
                {feature.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
