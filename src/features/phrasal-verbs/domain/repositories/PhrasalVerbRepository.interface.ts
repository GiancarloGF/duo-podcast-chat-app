import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';

export interface PhrasalVerbRepository {
  getAllPhrasalVerbs(): Promise<PhrasalVerb[]>;
}
