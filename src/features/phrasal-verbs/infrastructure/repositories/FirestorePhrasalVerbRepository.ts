import { collection, getDocs } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type { PhrasalVerbRepository } from '@/features/phrasal-verbs/domain/repositories/PhrasalVerbRepository.interface';
import { getClientFirestore } from '@/shared/infrastructure/firebase/config';

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toDate(value: unknown): Date | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const timestamp = value as Timestamp;
  if (typeof timestamp.toDate !== 'function') {
    return null;
  }

  return timestamp.toDate();
}

export class FirestorePhrasalVerbRepository implements PhrasalVerbRepository {
  async getAllPhrasalVerbs(): Promise<PhrasalVerb[]> {
    console.info('[FirestorePhrasalVerbRepository] Fetching phrasal_verbs collection');
    const firestore = getClientFirestore();
    const snapshot = await getDocs(collection(firestore, 'phrasal_verbs'));
    console.info('[FirestorePhrasalVerbRepository] Fetch success', {
      docsCount: snapshot.docs.length,
    });

    return snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        phrasalVerb:
          typeof data.phrasalVerb === 'string' ? data.phrasalVerb.trim() : '',
        verb: typeof data.verb === 'string' ? data.verb.trim() : '',
        particles: toStringArray(data.particles),
        superGroup: typeof data.superGroup === 'string' ? data.superGroup.trim() : '',
        group: typeof data.group === 'string' ? data.group.trim() : '',
        category: typeof data.category === 'string' ? data.category.trim() : '',
        meaning: typeof data.meaning === 'string' ? data.meaning.trim() : '',
        definition: typeof data.definition === 'string' ? data.definition.trim() : '',
        example: typeof data.example === 'string' ? data.example.trim() : '',
        commonUsage:
          typeof data.commonUsage === 'string' ? data.commonUsage.trim() : '',
        transitivity:
          typeof data.transitivity === 'string' ? data.transitivity.trim() : '',
        separability:
          typeof data.separability === 'string' ? data.separability.trim() : '',
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl.trim() : '',
        synonyms: toStringArray(data.synonyms),
        nativeNotes: toStringArray(data.nativeNotes),
        createdAt: toDate(data.createdAt),
      } satisfies PhrasalVerb;
    });
  }
}
