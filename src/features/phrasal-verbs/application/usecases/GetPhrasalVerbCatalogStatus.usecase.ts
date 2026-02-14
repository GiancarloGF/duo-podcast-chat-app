import type { PhrasalVerbCatalogStatus } from '@/features/phrasal-verbs/domain/entities/PhrasalVerbCatalog';
import type { PhrasalVerbCatalogRepository } from '@/features/phrasal-verbs/domain/repositories/PhrasalVerbCatalogRepository.interface';

export async function getPhrasalVerbCatalogStatus(
  repository: PhrasalVerbCatalogRepository
): Promise<PhrasalVerbCatalogStatus> {
  return repository.getCatalogStatus();
}
