import { Feature } from '../entities/Feature';

export interface FeatureRepository {
  getAllFeatures(): Promise<Feature[]>;
  getFeatureById(id: string): Promise<Feature | null>;
}
