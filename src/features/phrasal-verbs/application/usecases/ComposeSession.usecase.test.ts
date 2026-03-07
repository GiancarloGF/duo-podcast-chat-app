import { describe, expect, it } from 'vitest';
import { composeSession } from '@/features/phrasal-verbs/application/usecases/ComposeSession.usecase';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type { LocalPhrasalVerbProgressRow } from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';

function buildPv(id: string): PhrasalVerb {
  return {
    id,
    phrasalVerb: `verb ${id}`,
    verb: 'verb',
    particles: ['up'],
    superGroup: 'A',
    group: 'G',
    category: 'C',
    meaning: 'meaning',
    definition: 'definition',
    example: 'example',
    commonUsage: 'common',
    transitivity: 'transitive',
    separability: 'separable',
    imageUrl: '',
    synonyms: [],
    nativeNotes: [],
    createdAt: null,
  };
}

function buildProgress(
  pvId: string,
  overrides: Partial<LocalPhrasalVerbProgressRow>,
): LocalPhrasalVerbProgressRow {
  return {
    pvId,
    status: 'review',
    easeFactor: 2.5,
    interval: 3,
    repetitions: 2,
    nextReview: Date.now() - 1,
    lastReview: Date.now() - 1,
    timesCorrect: 1,
    timesIncorrect: 0,
    timesViewed: 1,
    updatedAt: Date.now() - 1,
    ...overrides,
  };
}

describe('composeSession', () => {
  it('returns exactly 5 new PVs for a first-time user', () => {
    const pvs = Array.from({ length: 20 }, (_, index) => buildPv(`pv-${index + 1}`));

    const result = composeSession({
      allPhrasalVerbs: pvs,
      progressRows: [],
      nowMs: 1_700_000_000_000,
    });

    expect(result.totalPVs).toBe(5);
    expect(result.composition.new).toBe(5);
    expect(result.composition.failed).toBe(0);
    expect(result.composition.review).toBe(0);
    expect(new Set(result.pvs.map((pv) => pv.id)).size).toBe(result.pvs.length);
  });

  it('returns 5 new + 3 failed + 2 due review when buckets are available', () => {
    const allPvs = Array.from({ length: 15 }, (_, index) => buildPv(`pv-${index + 1}`));

    const progressRows: LocalPhrasalVerbProgressRow[] = [
      buildProgress('pv-1', {
        status: 'learning',
        timesIncorrect: 2,
        lastReview: 100,
        timesViewed: 2,
      }),
      buildProgress('pv-2', {
        status: 'learning',
        timesIncorrect: 3,
        lastReview: 200,
        timesViewed: 2,
      }),
      buildProgress('pv-3', {
        status: 'learning',
        timesIncorrect: 1,
        lastReview: 300,
        timesViewed: 2,
      }),
      buildProgress('pv-4', {
        status: 'learning',
        timesIncorrect: 4,
        lastReview: 400,
        timesViewed: 2,
      }),
      buildProgress('pv-5', {
        status: 'review',
        nextReview: 1,
        timesViewed: 2,
      }),
      buildProgress('pv-6', {
        status: 'review',
        nextReview: 2,
        timesViewed: 2,
      }),
      buildProgress('pv-7', {
        status: 'review',
        nextReview: 3,
        timesViewed: 2,
      }),
      buildProgress('pv-8', {
        status: 'review',
        nextReview: 100_008,
        timesViewed: 2,
      }),
      buildProgress('pv-9', {
        status: 'mastered',
        nextReview: 100_009,
        timesViewed: 2,
      }),
      buildProgress('pv-10', {
        status: 'review',
        nextReview: 100_010,
        timesViewed: 2,
      }),
    ];

    const result = composeSession({
      allPhrasalVerbs: allPvs,
      progressRows,
      nowMs: 10_000,
    });

    expect(result.totalPVs).toBe(10);
    expect(result.composition.new).toBe(5);
    expect(result.composition.failed).toBe(3);
    expect(result.composition.review).toBe(2);
    expect(new Set(result.pvs.map((pv) => pv.id)).size).toBe(result.pvs.length);
  });

  it('does not use extra new PVs to replace missing failed/review quotas', () => {
    const allPvs = Array.from({ length: 12 }, (_, index) => buildPv(`pv-${index + 1}`));

    const progressRows: LocalPhrasalVerbProgressRow[] = [
      buildProgress('pv-1', {
        status: 'learning',
        timesIncorrect: 1,
        timesViewed: 2,
      }),
      buildProgress('pv-2', {
        status: 'review',
        nextReview: Date.now() + 99999999,
        timesViewed: 2,
      }),
    ];

    const result = composeSession({
      allPhrasalVerbs: allPvs,
      progressRows,
      nowMs: 10_000,
    });

    expect(result.composition.new).toBe(5);
    expect(result.composition.failed).toBe(1);
    expect(result.composition.review).toBe(0);
    expect(result.totalPVs).toBe(6);
    expect(new Set(result.pvs.map((pv) => pv.id)).size).toBe(result.pvs.length);
  });

  it('fills to minimum 5 with seen PVs when there are fewer than 5 new PVs', () => {
    const allPvs = Array.from({ length: 8 }, (_, index) => buildPv(`pv-${index + 1}`));
    const nowMs = 10_000;

    const progressRows: LocalPhrasalVerbProgressRow[] = [
      buildProgress('pv-1', {
        status: 'learning',
        timesIncorrect: 1,
        timesViewed: 2,
      }),
      buildProgress('pv-2', {
        status: 'review',
        nextReview: nowMs - 1,
        timesViewed: 2,
      }),
      buildProgress('pv-3', {
        status: 'review',
        nextReview: nowMs + 99999,
        timesViewed: 2,
      }),
      buildProgress('pv-4', {
        status: 'mastered',
        nextReview: nowMs + 99999,
        timesViewed: 2,
      }),
      buildProgress('pv-5', {
        status: 'review',
        nextReview: nowMs + 99999,
        timesViewed: 2,
      }),
      buildProgress('pv-6', {
        status: 'review',
        nextReview: nowMs + 99999,
        timesViewed: 2,
      }),
    ];

    const result = composeSession({
      allPhrasalVerbs: allPvs,
      progressRows,
      nowMs,
    });

    expect(result.composition.new).toBe(2);
    expect(result.composition.failed).toBe(1);
    expect(result.composition.review).toBe(2);
    expect(result.totalPVs).toBe(5);
    expect(new Set(result.pvs.map((pv) => pv.id)).size).toBe(result.pvs.length);
  });

  it('treats users with prior sessions as non-first even if current rows have zero views', () => {
    const allPvs = Array.from({ length: 12 }, (_, index) => buildPv(`pv-${index + 1}`));
    const nowMs = 10_000;

    const progressRows: LocalPhrasalVerbProgressRow[] = [
      buildProgress('pv-1', {
        status: 'learning',
        timesIncorrect: 1,
        timesViewed: 0,
      }),
      buildProgress('pv-2', {
        status: 'review',
        nextReview: nowMs - 1,
        timesViewed: 0,
      }),
      buildProgress('pv-3', {
        status: 'review',
        nextReview: nowMs - 2,
        timesViewed: 0,
      }),
    ];

    const result = composeSession({
      allPhrasalVerbs: allPvs,
      progressRows,
      totalSessions: 4,
      nowMs,
    });

    expect(result.composition.new).toBe(5);
    expect(result.composition.failed).toBe(1);
    expect(result.composition.review).toBe(2);
    expect(result.totalPVs).toBe(8);
  });
});
