import { describe, expect, it, vi } from 'vitest';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type {
  PracticeExercise,
  PracticeExercisePhrasalVerbInput,
  PracticeExerciseRecentUsage,
  PracticeExerciseType,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';
import {
  bootstrapPlannedPracticeSession,
  generatePracticeBlockForIndex,
} from '@/features/phrasal-verbs/presentation/practiceSessionGeneration';

function makePv(index: number): PhrasalVerb {
  return {
    id: `pv-${index}`,
    phrasalVerb: `verb ${index} up`,
    verb: `verb ${index}`,
    particles: ['up'],
    superGroup: 'A',
    group: 'G',
    category: 'C',
    meaning: `meaning ${index}`,
    definition: `definition ${index}`,
    example: `example sentence ${index}`,
    commonUsage: '',
    transitivity: '',
    separability: '',
    imageUrl: '',
    synonyms: [],
    nativeNotes: [],
    createdAt: null,
  };
}

function makeExercise(
  exerciseType: PracticeExerciseType,
  phrasalVerbs: PracticeExercisePhrasalVerbInput[],
): PracticeExercise {
  if (exerciseType === 'read_and_mark_meaning') {
    return {
      exerciseType,
      title: 'Meaning practice',
      instructions: 'Choose the correct meaning.',
      items: phrasalVerbs.map((pv) => ({
        pvId: pv.id,
        phrasalVerb: pv.phrasalVerb,
        sentenceMarkdown: `We often **${pv.phrasalVerb}** in context ${pv.id}.`,
        meanings: [pv.meaning, `${pv.meaning} wrong 1`, `${pv.meaning} wrong 2`],
        correctMeaningIndex: 0,
      })),
    };
  }

  if (exerciseType === 'mark_sentences_correct') {
    return {
      exerciseType,
      title: 'Sentence practice',
      instructions: 'Pick the correct sentence.',
      items: phrasalVerbs.map((pv) => ({
        pvId: pv.id,
        phrasalVerb: pv.phrasalVerb,
        firstSentenceMarkdown: `They **${pv.phrasalVerb}** every morning.`,
        secondSentenceMarkdown: `They **${pv.phrasalVerb} off** every morning.`,
        correctSentenceIndex: 0,
      })),
    };
  }

  return {
    exerciseType,
    title: 'Gap practice',
    instructions: 'Fill the gap.',
    items: phrasalVerbs.map((pv) => ({
      pvId: pv.id,
      phrasalVerb: pv.phrasalVerb,
      sentencePrefix: 'We need to',
      sentenceSuffix: `up before lunch ${pv.id}.`,
      correctWord: pv.verb,
    })),
    wordBank: phrasalVerbs.map((pv) => pv.verb),
  };
}

describe('practiceSessionGeneration', () => {
  it('bootstraps only the 3-block plan and defers AI generation', async () => {
    const pvs = Array.from({ length: 10 }, (_, index) => makePv(index + 1));
    const generateExercise = vi.fn(
      async ({
        exerciseType,
        phrasalVerbs,
      }: {
        exerciseType: PracticeExerciseType;
        phrasalVerbs: PracticeExercisePhrasalVerbInput[];
        recentUsage: PracticeExerciseRecentUsage[];
      }) => makeExercise(exerciseType, phrasalVerbs),
    );

    const result = await bootstrapPlannedPracticeSession({
      sessionPvs: pvs,
      generateExercise,
    });

    expect(result.practicePlan).toHaveLength(3);
    expect(result.practiceQueue).toHaveLength(0);
    expect(generateExercise).not.toHaveBeenCalled();
  });

  it('passes recent usage for repeated PVs when generating a later block', async () => {
    const pvs = Array.from({ length: 5 }, (_, index) => makePv(index + 1));
    const generateExercise = vi.fn(
      async ({
        exerciseType,
        phrasalVerbs,
      }: {
        exerciseType: PracticeExerciseType;
        phrasalVerbs: PracticeExercisePhrasalVerbInput[];
        recentUsage: PracticeExerciseRecentUsage[];
      }) => makeExercise(exerciseType, phrasalVerbs),
    );

    const bootstrapped = await bootstrapPlannedPracticeSession({
      sessionPvs: pvs,
      generateExercise,
    });
    const firstBlock = await generatePracticeBlockForIndex({
      practicePlan: bootstrapped.practicePlan,
      practiceQueue: bootstrapped.practiceQueue,
      index: 0,
      generateExercise,
    });

    const secondBlock = await generatePracticeBlockForIndex({
      practicePlan: bootstrapped.practicePlan,
      practiceQueue: [firstBlock],
      index: 1,
      generateExercise,
    });

    const secondCall = generateExercise.mock.calls[1]?.[0];

    expect(secondBlock.exerciseType).toBe('mark_sentences_correct');
    expect(generateExercise).toHaveBeenCalledTimes(2);
    expect(secondCall?.recentUsage).toHaveLength(5);
    expect(secondCall?.recentUsage.every((entry: PracticeExerciseRecentUsage) =>
      entry.exerciseType === 'read_and_mark_meaning')).toBe(true);
  });

  it('does not mutate the existing generated queue when a later generation fails', async () => {
    const pvs = Array.from({ length: 5 }, (_, index) => makePv(index + 1));
    const generateExercise = vi
      .fn<
        ({
          exerciseType,
          phrasalVerbs,
          recentUsage,
        }: {
          exerciseType: PracticeExerciseType;
          phrasalVerbs: PracticeExercisePhrasalVerbInput[];
          recentUsage: PracticeExerciseRecentUsage[];
        }) => Promise<PracticeExercise>
      >()
      .mockResolvedValueOnce(
        makeExercise(
          'read_and_mark_meaning',
          pvs.map((pv) => ({
            id: pv.id,
            phrasalVerb: pv.phrasalVerb,
            verb: pv.verb,
            particles: pv.particles,
            meaning: pv.meaning,
            definition: pv.definition,
            example: pv.example,
          })),
        ),
      )
      .mockRejectedValueOnce(new Error('generation failed'));

    const bootstrapped = await bootstrapPlannedPracticeSession({
      sessionPvs: pvs,
      generateExercise,
    });
    const firstBlock = await generatePracticeBlockForIndex({
      practicePlan: bootstrapped.practicePlan,
      practiceQueue: bootstrapped.practiceQueue,
      index: 0,
      generateExercise,
    });
    const originalQueue = [firstBlock];

    await expect(
      generatePracticeBlockForIndex({
        practicePlan: bootstrapped.practicePlan,
        practiceQueue: originalQueue,
        index: 1,
        generateExercise,
      }),
    ).rejects.toThrow('generation failed');

    expect(originalQueue).toHaveLength(1);
    expect(originalQueue[0]).toEqual(firstBlock);
  });
});
