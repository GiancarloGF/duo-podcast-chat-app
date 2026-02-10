import { Feature } from '@/features/home/domain/entities/Feature';
import type { FeatureRepository } from '@/features/home/domain/repositories/FeatureRepository.interface';

export class StaticFeatureRepository implements FeatureRepository {
  private features: Feature[] = [
    {
      id: 'stories',
      title: 'Relatos en Ingles',
      description:
        'Lee relatos en Ingles y practica tu comprensión y escritura.',
      route: '/stories',
      isEnabled: true,
    },
    {
      id: 'phrasal-verbs',
      title: 'Phrasal Verbs Practice',
      description:
        'Domina phrasal verbs con filtros por supergrupos, grupos y categorias.',
      route: '/phrasal-verbs',
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
