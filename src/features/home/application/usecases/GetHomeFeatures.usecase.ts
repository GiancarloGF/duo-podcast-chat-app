import type { FeatureRepository } from '@/features/home/domain/repositories/FeatureRepository.interface';
import { Feature } from '@/features/home/domain/entities/Feature';

export async function getHomeFeatures(
  repository: FeatureRepository
): Promise<Feature[]> {
  return repository.getAllFeatures();
}
