import 'server-only';

import { cacheLife } from 'next/cache';
import { getHomeFeatures } from '@/features/home/application/usecases/GetHomeFeatures.usecase';
import type { Feature } from '@/features/home/domain/entities/Feature';
import { StaticFeatureRepository } from '@/features/home/infrastructure/repositories/StaticFeatureRepository';

const featureRepository = new StaticFeatureRepository();

export async function getHomeFeaturesForPage(): Promise<Feature[]> {
  'use cache';

  cacheLife('hours');

  return getHomeFeatures(featureRepository);
}
