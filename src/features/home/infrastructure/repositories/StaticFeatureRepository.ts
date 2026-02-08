import { Feature } from '@/features/home/domain/entities/Feature';
import type { FeatureRepository } from '@/features/home/domain/repositories/FeatureRepository.interface';

export class StaticFeatureRepository implements FeatureRepository {
  private features: Feature[] = [
    {
      id: 'stories',
      title: 'English Stories',
      description:
        'Practice English by reading and listening to interactive stories.',
      route: '/stories',
      isEnabled: true,
    },
    {
      id: 'coming-soon',
      title: 'More Features Coming Soon',
      description: 'Stay tuned for more ways to practice English.',
      route: '#',
      isEnabled: false,
    },
  ];

  async getAllFeatures(): Promise<Feature[]> {
    return this.features;
  }

  async getFeatureById(id: string): Promise<Feature | null> {
    const feature = this.features.find((f) => f.id === id);
    return feature || null;
  }
}
