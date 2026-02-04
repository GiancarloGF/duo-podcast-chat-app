'use server';
import { StaticFeatureRepository } from '@/src/infrastructure/database/in-memory/StaticFeatureRepository';

export async function getHomeFeatures() {
  const repo = new StaticFeatureRepository();
  return repo.getAllFeatures();
}
