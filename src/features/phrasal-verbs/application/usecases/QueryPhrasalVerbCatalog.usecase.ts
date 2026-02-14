import type {
  PhrasalVerbCatalogQuery,
  PhrasalVerbCatalogQueryResult,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbCatalog';
import type { PhrasalVerbCatalogRepository } from '@/features/phrasal-verbs/domain/repositories/PhrasalVerbCatalogRepository.interface';

export async function queryPhrasalVerbCatalog(
  repository: PhrasalVerbCatalogRepository,
  query: PhrasalVerbCatalogQuery
): Promise<PhrasalVerbCatalogQueryResult> {
  return repository.queryCatalog(query);
}
