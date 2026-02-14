import type {
  CatalogHydrationProgress,
  CatalogHydrationResult,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbCatalog';
import type { PhrasalVerbCatalogRepository } from '@/features/phrasal-verbs/domain/repositories/PhrasalVerbCatalogRepository.interface';

export async function ensurePhrasalVerbCatalogHydrated(
  repository: PhrasalVerbCatalogRepository,
  options?: {
    onProgress?: (progress: CatalogHydrationProgress) => void;
  }
): Promise<CatalogHydrationResult> {
  return repository.ensureCatalogHydrated(options);
}
