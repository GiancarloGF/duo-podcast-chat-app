import type {
  LocalPhrasalVerbProgressRow,
  PhrasalVerbStatus,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MIN_EASE_FACTOR = 1.3;

export interface SrsUpdateInput {
  pvId: string;
  currentProgress: LocalPhrasalVerbProgressRow | null;
  isCorrect: boolean;
  nowMs?: number;
}

export interface SrsUpdateOutput {
  status: PhrasalVerbStatus;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number | null;
  timesCorrect: number;
  timesIncorrect: number;
  timesViewed: number;
  isFirstView: boolean;
  justMastered: boolean;
}

export function calculateSrsUpdate(input: SrsUpdateInput): SrsUpdateOutput {
  const { currentProgress, isCorrect } = input;
  const nowMs = input.nowMs ?? Date.now();

  let easeFactor = currentProgress?.easeFactor ?? 2.5;
  let interval = currentProgress?.interval ?? 0;
  let repetitions = currentProgress?.repetitions ?? 0;
  let timesCorrect = currentProgress?.timesCorrect ?? 0;
  let timesIncorrect = currentProgress?.timesIncorrect ?? 0;
  let timesViewed = currentProgress?.timesViewed ?? 0;

  const previousStatus = currentProgress?.status ?? 'new';
  const isFirstView = timesViewed === 0;
  timesViewed += 1;

  const quality = isCorrect ? 4 : 1;
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

  let status: PhrasalVerbStatus;

  if (!isCorrect) {
    timesIncorrect += 1;
    repetitions = 0;
    interval = 1;
    status = 'learning';
  } else {
    timesCorrect += 1;
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
      status = 'learning';
    } else if (repetitions === 2) {
      interval = 3;
      status = 'review';
    } else if (repetitions === 3) {
      interval = 7;
      status = 'review';
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor));
      status = interval >= 30 ? 'mastered' : 'review';
    }
  }

  const nextReview = nowMs + interval * DAY_IN_MS;
  const justMastered = status === 'mastered' && previousStatus !== 'mastered';

  return {
    status,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    timesCorrect,
    timesIncorrect,
    timesViewed,
    isFirstView,
    justMastered,
  };
}
