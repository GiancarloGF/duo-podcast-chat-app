import { Feature } from '../entities/Feature';

export interface IFeatureRepository {
  getAllFeatures(): Promise<Feature[]>;
  getFeatureById(id: string): Promise<Feature | null>;
}
