import type {
  CatalogHydrationProgress,
  CatalogHydrationResult,
  PhrasalVerbCatalogQuery,
  PhrasalVerbCatalogQueryResult,
  PhrasalVerbCatalogStatus,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbCatalog';

export interface PhrasalVerbCatalogRepository {
  ensureCatalogHydrated(options?: {
    onProgress?: (progress: CatalogHydrationProgress) => void;
    forceRefresh?: boolean;
  }): Promise<CatalogHydrationResult>;
  queryCatalog(params: PhrasalVerbCatalogQuery): Promise<PhrasalVerbCatalogQueryResult>;
  getCatalogStatus(): Promise<PhrasalVerbCatalogStatus>;
}
