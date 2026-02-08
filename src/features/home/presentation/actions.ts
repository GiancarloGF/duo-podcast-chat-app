'use server';

import { getHomeFeatures } from '@/features/home/application/usecases/GetHomeFeatures.usecase';
import { StaticFeatureRepository } from '@/features/home/infrastructure/repositories/StaticFeatureRepository';

export async function getHomeFeaturesAction() {
  const repo = new StaticFeatureRepository();
  return getHomeFeatures(repo);
}
