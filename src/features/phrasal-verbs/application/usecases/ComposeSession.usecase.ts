import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type { LocalPhrasalVerbProgressRow } from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';

const FIRST_SESSION_NEW_COUNT = 5;
const REGULAR_NEW_COUNT = 5;
const REGULAR_FAILED_COUNT = 3;
const REGULAR_REVIEW_COUNT = 2;
const MIN_SESSION_SIZE = 5;
const MAX_SESSION_SIZE = 10;

export interface ComposedSession {
  pvs: PhrasalVerb[];
  composition: {
    failed: number;
    review: number;
    new: number;
  };
  totalPVs: number;
}

export interface ComposeSessionInput {
  allPhrasalVerbs: PhrasalVerb[];
  progressRows: LocalPhrasalVerbProgressRow[];
  totalSessions?: number;
  nowMs?: number;
}

function shuffleArray<T>(values: T[]): T[] {
  const next = [...values];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function pickWithoutDuplicates(
  source: PhrasalVerb[],
  count: number,
  alreadyPickedIds: Set<string>,
): PhrasalVerb[] {
  const picked: PhrasalVerb[] = [];

  for (const pv of source) {
    if (picked.length >= count) {
      break;
    }

    if (alreadyPickedIds.has(pv.id)) {
      continue;
    }

    picked.push(pv);
    alreadyPickedIds.add(pv.id);
  }

  return picked;
}

export function composeSession(input: ComposeSessionInput): ComposedSession {
  const nowMs = input.nowMs ?? Date.now();
  const allPhrasalVerbs = input.allPhrasalVerbs;
  const progressByPvId = new Map(input.progressRows.map((row) => [row.pvId, row]));
  const pvsById = new Map(allPhrasalVerbs.map((pv) => [pv.id, pv]));
  const hasCompletedAnySession =
    typeof input.totalSessions === 'number'
      ? input.totalSessions > 0
      : input.progressRows.some((row) => row.timesViewed > 0);
  const isFirstSession = !hasCompletedAnySession;

  const failedPvs: PhrasalVerb[] = [];
  const reviewPvs: PhrasalVerb[] = [];
  const newPvs: PhrasalVerb[] = [];

  for (const pv of allPhrasalVerbs) {
    const progress = progressByPvId.get(pv.id);

    if (!progress) {
      newPvs.push(pv);
      continue;
    }

    if (progress.status === 'learning' && progress.timesIncorrect > 0) {
      failedPvs.push(pv);
      continue;
    }

    const isDueReview =
      (progress.status === 'review' || progress.status === 'mastered') &&
      progress.nextReview !== null &&
      progress.nextReview <= nowMs;

    if (isDueReview) {
      reviewPvs.push(pv);
      continue;
    }

    if (progress.timesViewed === 0) {
      newPvs.push(pv);
    }
  }

  failedPvs.sort((left, right) => {
    const leftProgress = progressByPvId.get(left.id);
    const rightProgress = progressByPvId.get(right.id);

    return (rightProgress?.lastReview ?? 0) - (leftProgress?.lastReview ?? 0);
  });

  reviewPvs.sort((left, right) => {
    const leftProgress = progressByPvId.get(left.id);
    const rightProgress = progressByPvId.get(right.id);

    return (leftProgress?.nextReview ?? Number.MAX_SAFE_INTEGER) -
      (rightProgress?.nextReview ?? Number.MAX_SAFE_INTEGER);
  });

  const selectedIds = new Set<string>();
  const sessionPvs: PhrasalVerb[] = [];
  const sessionCategoryById = new Map<string, 'failed' | 'review' | 'new'>();

  const addSlice = (slice: PhrasalVerb[], category: 'failed' | 'review' | 'new') => {
    slice.forEach((pv) => {
      sessionPvs.push(pv);
      sessionCategoryById.set(pv.id, category);
    });
  };

  if (isFirstSession) {
    const firstNewSlice = pickWithoutDuplicates(
      shuffleArray(newPvs),
      FIRST_SESSION_NEW_COUNT,
      selectedIds,
    );
    addSlice(firstNewSlice, 'new');
  } else {
    const newSlice = pickWithoutDuplicates(
      shuffleArray(newPvs),
      REGULAR_NEW_COUNT,
      selectedIds,
    );
    addSlice(newSlice, 'new');

    const failedSlice = pickWithoutDuplicates(failedPvs, REGULAR_FAILED_COUNT, selectedIds);
    addSlice(failedSlice, 'failed');

    const reviewSlice = pickWithoutDuplicates(reviewPvs, REGULAR_REVIEW_COUNT, selectedIds);
    addSlice(reviewSlice, 'review');

    if (sessionPvs.length < MIN_SESSION_SIZE) {
      const fallbackFailed = pickWithoutDuplicates(
        failedPvs,
        MIN_SESSION_SIZE - sessionPvs.length,
        selectedIds,
      );
      addSlice(fallbackFailed, 'failed');
    }

    if (sessionPvs.length < MIN_SESSION_SIZE) {
      const fallbackReview = pickWithoutDuplicates(
        reviewPvs,
        MIN_SESSION_SIZE - sessionPvs.length,
        selectedIds,
      );
      addSlice(fallbackReview, 'review');
    }

    if (sessionPvs.length < MIN_SESSION_SIZE) {
      const seenFallbackPool = shuffleArray(
        allPhrasalVerbs.filter((pv) => {
          if (selectedIds.has(pv.id)) {
            return false;
          }

          const progress = progressByPvId.get(pv.id);
          return Boolean(progress && progress.timesViewed > 0);
        }),
      );

      const fallbackSeen = pickWithoutDuplicates(
        seenFallbackPool,
        MIN_SESSION_SIZE - sessionPvs.length,
        selectedIds,
      );

      fallbackSeen.forEach((pv) => {
        const progress = progressByPvId.get(pv.id);
        if (progress?.status === 'learning' && progress.timesIncorrect > 0) {
          addSlice([pv], 'failed');
          return;
        }

        addSlice([pv], 'review');
      });
    }
  }

  const cappedPvs = sessionPvs.slice(0, MAX_SESSION_SIZE);
  const composition = {
    failed: 0,
    review: 0,
    new: 0,
  };

  cappedPvs.forEach((pv) => {
    const category = sessionCategoryById.get(pv.id);
    if (category === 'failed') {
      composition.failed += 1;
      return;
    }

    if (category === 'review') {
      composition.review += 1;
      return;
    }

    composition.new += 1;
  });

  return {
    pvs: cappedPvs.map((pv) => pvsById.get(pv.id) ?? pv),
    composition,
    totalPVs: cappedPvs.length,
  };
}
