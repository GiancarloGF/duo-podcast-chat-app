import { describe, expect, it } from 'vitest';
import type {
  PracticeExercisePhrasalVerbInput,
  PracticeExerciseRecentUsage,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';
import { GeminiPracticeExerciseService } from '@/features/phrasal-verbs/infrastructure/services/GeminiPracticeExerciseService';

process.env.GEMINI_API_KEY ??= 'test-key';

const phrasalVerbs: PracticeExercisePhrasalVerbInput[] = [
  {
    id: 'pv-1',
    phrasalVerb: 'look up',
    verb: 'look',
    particles: ['up'],
    meaning: 'search for information',
    definition: 'to search for and find information',
    example: 'I looked up the address online.',
  },
];

describe('GeminiPracticeExerciseService', () => {
  it('includes recent usage guidance in prompts only when repeated PV context exists', () => {
    const service = new GeminiPracticeExerciseService();
    const recentUsage: PracticeExerciseRecentUsage[] = [
      {
        pvId: 'pv-1',
        phrasalVerb: 'look up',
        exerciseType: 'read_and_mark_meaning',
        sentence: 'I looked up the restaurant before dinner.',
      },
    ];

    const promptWithRecentUsage = (service as any).buildPrompt(
      'mark_sentences_correct',
      phrasalVerbs,
      recentUsage,
    ) as string;
    const promptWithoutRecentUsage = (service as any).buildPrompt(
      'mark_sentences_correct',
      phrasalVerbs,
      [],
    ) as string;

    expect(promptWithRecentUsage).toContain('RECENT USAGE TO AVOID REPEATING');
    expect(promptWithRecentUsage).toContain('I looked up the restaurant before dinner.');
    expect(promptWithoutRecentUsage).not.toContain('RECENT USAGE TO AVOID REPEATING');
  });

  it('rejects fill-in-gaps exercises when correctWord is not one part of the phrasal verb', () => {
    const service = new GeminiPracticeExerciseService();

    expect(() =>
      (service as any).normalizeExercise('fill_in_gaps_drag_drop', {
        exerciseType: 'fill_in_gaps_drag_drop',
        title: 'Fill the gap',
        instructions: 'Drag the right option.',
        items: [
          {
            pvId: 'pv-1',
            phrasalVerb: 'look up',
            sentencePrefix: 'I need to',
            sentenceSuffix: 'the answer later.',
            correctWord: 'later',
          },
        ],
        wordBank: ['later'],
      }),
    ).toThrow('Fill-in-gaps correctWord must be one part of the phrasal verb.');
  });
});
