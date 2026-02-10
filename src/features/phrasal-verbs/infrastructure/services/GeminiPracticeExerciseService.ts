import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  fillInGapsDragDropExerciseSchema,
  markSentencesCorrectExerciseSchema,
  readAndMarkMeaningExerciseSchema,
  type FillInGapsDragDropExercise,
  type PracticeExercise,
  type PracticeExerciseType,
  type PracticeExercisePhrasalVerbInput,
  type ReadAndMarkMeaningExercise,
  type MarkSentencesCorrectExercise,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';

export class GeminiPracticeExerciseService {
  private client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  async generateExercise(
    exerciseType: PracticeExerciseType,
    phrasalVerbs: PracticeExercisePhrasalVerbInput[]
  ): Promise<PracticeExercise> {
    const maxAttempts = 3;

    console.info('[GeminiPracticeExerciseService] generate:start', {
      exerciseType,
      pvCount: phrasalVerbs.length,
      pvIds: phrasalVerbs.map((pv) => pv.id),
      maxAttempts,
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const prompt = this.buildPrompt(exerciseType, phrasalVerbs);
        const responseSchema = this.getResponseSchema(exerciseType);

        const response = await this.client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: zodToJsonSchema(responseSchema),
          },
        });

        if (!response.text) {
          throw new Error('No response received from Gemini for practice exercise');
        }

        console.info('[GeminiPracticeExerciseService] generate:response', {
          attempt,
          hasText: Boolean(response.text),
          textLength: response.text.length,
        });

        const parsedJson = JSON.parse(response.text);
        const normalized = this.normalizeExercise(exerciseType, parsedJson);

        console.info('[GeminiPracticeExerciseService] generate:parsed', {
          attempt,
          itemCount: normalized.items.length,
          exerciseType: normalized.exerciseType,
        });

        return normalized;
      } catch (error) {
        console.warn('[GeminiPracticeExerciseService] generate:attempt_failed', {
          attempt,
          exerciseType,
          error,
        });

        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error('Failed to generate exercise after retries.');
  }

  private getResponseSchema(exerciseType: PracticeExerciseType) {
    if (exerciseType === 'read_and_mark_meaning') {
      return readAndMarkMeaningExerciseSchema;
    }

    if (exerciseType === 'mark_sentences_correct') {
      return markSentencesCorrectExerciseSchema;
    }

    return fillInGapsDragDropExerciseSchema;
  }

  private buildPrompt(
    exerciseType: PracticeExerciseType,
    phrasalVerbs: PracticeExercisePhrasalVerbInput[]
  ): string {
    if (exerciseType === 'read_and_mark_meaning') {
      return this.buildReadAndMarkMeaningPrompt(phrasalVerbs);
    }

    if (exerciseType === 'mark_sentences_correct') {
      return this.buildMarkSentencesCorrectPrompt(phrasalVerbs);
    }

    return this.buildFillInGapsDragDropPrompt(phrasalVerbs);
  }

  private normalizeExercise(
    exerciseType: PracticeExerciseType,
    parsedJson: unknown
  ): PracticeExercise {
    if (exerciseType === 'read_and_mark_meaning') {
      const parsed = readAndMarkMeaningExerciseSchema.parse(parsedJson);
      return {
        ...parsed,
        items: parsed.items.map((item) => this.shuffleMeanings(item)),
      };
    }

    if (exerciseType === 'mark_sentences_correct') {
      const parsed = markSentencesCorrectExerciseSchema.parse(parsedJson);
      return {
        ...parsed,
        items: parsed.items.map((item) => this.shuffleSentencePair(item)),
      };
    }

    const parsed = fillInGapsDragDropExerciseSchema.parse(parsedJson);
    return this.normalizeFillInGapsExercise(parsed);
  }

  private shuffleMeanings(
    item: ReadAndMarkMeaningExercise['items'][number]
  ): ReadAndMarkMeaningExercise['items'][number] {
    const options = item.meanings.map((meaning, index) => ({
      meaning,
      isCorrect: index === item.correctMeaningIndex,
    }));

    for (let i = options.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [options[i], options[randomIndex]] = [options[randomIndex], options[i]];
    }

    const nextCorrectIndex = options.findIndex((option) => option.isCorrect);
    const shuffledMeanings = options.map((option) => option.meaning);

    if (shuffledMeanings.length !== 3 || nextCorrectIndex < 0) {
      throw new Error('Failed to shuffle exercise meanings.');
    }

    return {
      ...item,
      meanings: [shuffledMeanings[0], shuffledMeanings[1], shuffledMeanings[2]],
      correctMeaningIndex: nextCorrectIndex,
    };
  }

  private shuffleSentencePair(
    item: MarkSentencesCorrectExercise['items'][number]
  ): MarkSentencesCorrectExercise['items'][number] {
    const options = [
      {
        sentence: item.firstSentenceMarkdown,
        isCorrect: item.correctSentenceIndex === 0,
      },
      {
        sentence: item.secondSentenceMarkdown,
        isCorrect: item.correctSentenceIndex === 1,
      },
    ];

    const shouldSwap = Math.random() >= 0.5;
    const ordered = shouldSwap ? [options[1], options[0]] : options;
    const nextCorrectIndex = ordered.findIndex((option) => option.isCorrect);

    if (nextCorrectIndex < 0) {
      throw new Error('Failed to shuffle sentence pair options.');
    }

    return {
      ...item,
      firstSentenceMarkdown: ordered[0].sentence,
      secondSentenceMarkdown: ordered[1].sentence,
      correctSentenceIndex: nextCorrectIndex,
    };
  }

  private normalizeFillInGapsExercise(
    exercise: FillInGapsDragDropExercise
  ): FillInGapsDragDropExercise {
    const normalizedCorrectWords = exercise.items.map((item) =>
      item.correctWord.trim().toLowerCase()
    );
    const uniqueCorrectWords = new Set(normalizedCorrectWords);

    if (uniqueCorrectWords.size !== exercise.items.length) {
      throw new Error('Fill-in-gaps exercise contains repeated correct words.');
    }

    const normalizedWordBank = exercise.wordBank.map((word) =>
      word.trim().toLowerCase()
    );
    const uniqueWordBank = new Set(normalizedWordBank);

    if (uniqueWordBank.size !== exercise.wordBank.length) {
      throw new Error('Fill-in-gaps word bank contains repeated words.');
    }

    if (exercise.wordBank.length !== exercise.items.length) {
      throw new Error('Fill-in-gaps word bank size must match items count.');
    }

    if (normalizedWordBank.some((word) => !uniqueCorrectWords.has(word))) {
      throw new Error('Fill-in-gaps word bank includes words outside correct answers.');
    }

    return {
      ...exercise,
      wordBank: this.shuffleArray(exercise.wordBank),
    };
  }

  private shuffleArray<T>(entries: T[]): T[] {
    const next = [...entries];

    for (let i = next.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
    }

    return next;
  }

  private buildReadAndMarkMeaningPrompt(
    phrasalVerbs: PracticeExercisePhrasalVerbInput[]
  ): string {
    return `You are an expert English teacher creating a multiple-choice exercise.

TASK:
Generate exactly one exercise of type "read_and_mark_meaning" using ONLY the provided phrasal verbs.

OUTPUT LANGUAGE:
- Everything in ENGLISH only.

STRICT REQUIREMENTS:
1. Return valid JSON that strictly matches the provided schema.
2. Keep "exerciseType" as "read_and_mark_meaning".
3. Generate exactly ${phrasalVerbs.length} items (one item per provided phrasal verb).
4. For each item:
   - Use the same "pvId" that was provided.
   - Keep "phrasalVerb" matching the provided phrasal verb text.
   - Create ONE new sentence in English where the phrasal verb is used naturally.
   - Return this sentence in "sentenceMarkdown".
   - In "sentenceMarkdown", highlight only the phrasal verb using markdown bold (example: **look up to**).
   - The sentence MUST be new and MUST NOT copy the provided "example".
   - Provide exactly 3 meaning options in "meanings".
   - Only one option is correct.
   - The correct option should not always appear in the same position.
   - "correctMeaningIndex" must be 0, 1, or 2 and point to the correct option.
   - Distractors must be plausible but clearly incorrect.
5. Avoid ambiguous or overlapping options.
6. Keep level around intermediate (B1-B2).

PROVIDED PHRASAL VERBS (JSON):
${JSON.stringify(phrasalVerbs, null, 2)}

Do not include markdown. Return JSON only.`;
  }

  private buildMarkSentencesCorrectPrompt(
    phrasalVerbs: PracticeExercisePhrasalVerbInput[]
  ): string {
    return `You are an expert English teacher creating an exercise about phrasal verb accuracy.

TASK:
Generate exactly one exercise of type "mark_sentences_correct" using ONLY the provided phrasal verbs.

OUTPUT LANGUAGE:
- Everything in ENGLISH only.

STRICT REQUIREMENTS:
1. Return valid JSON that strictly matches the provided schema.
2. Keep "exerciseType" as "mark_sentences_correct".
3. Generate exactly ${phrasalVerbs.length} items (one item per provided phrasal verb).
4. For each item:
   - Use the same "pvId" that was provided.
   - Keep "phrasalVerb" matching the provided phrasal verb text.
   - Create two almost identical everyday-context sentences:
     - "firstSentenceMarkdown"
     - "secondSentenceMarkdown"
   - Exactly one sentence must be correct and logical with the right verb + preposition combination.
   - The other sentence must be incorrect due to the wrong preposition or phrasal verb particle.
   - In BOTH sentences, highlight only the target verb + preposition chunk in markdown bold.
   - Sentences must be new and MUST NOT copy the provided "example".
   - "correctSentenceIndex" must be 0 or 1 and indicate the correct sentence.
5. Keep distractors realistic, but clearly wrong to an attentive learner.
6. Avoid offensive, unsafe, or highly niche contexts.
7. Keep level around intermediate (B1-B2).

PROVIDED PHRASAL VERBS (JSON):
${JSON.stringify(phrasalVerbs, null, 2)}

Do not include markdown outside the JSON string values. Return JSON only.`;
  }

  private buildFillInGapsDragDropPrompt(
    phrasalVerbs: PracticeExercisePhrasalVerbInput[]
  ): string {
    return `You are an expert English teacher creating a drag-and-drop gap-fill exercise.

TASK:
Generate exactly one exercise of type "fill_in_gaps_drag_drop" using ONLY the provided phrasal verbs.

OUTPUT LANGUAGE:
- Everything in ENGLISH only.

STRICT REQUIREMENTS:
1. Return valid JSON that strictly matches the provided schema.
2. Keep "exerciseType" as "fill_in_gaps_drag_drop".
3. Generate exactly ${phrasalVerbs.length} items (one item per provided phrasal verb).
4. For each item:
   - Use the same "pvId" that was provided.
   - Keep "phrasalVerb" exactly as provided.
   - Create one NEW natural sentence in an everyday context split into:
     - "sentencePrefix"
     - "sentenceSuffix"
   - The missing word between prefix and suffix is "correctWord".
   - The completed sentence (prefix + correctWord + suffix) must be grammatically correct and coherent.
   - Use exactly one blank per item.
   - The sentence MUST be new and MUST NOT copy the provided "example".
5. All "correctWord" values MUST be unique across all items (no repeated correct words).
6. Build "wordBank" with NO distractors:
   - Include exactly the set of correct words, one each.
   - Do not include extra words.
   - Do not repeat words.
7. Keep words in "wordBank" short and draggable-friendly (typically one lowercase word).
8. Keep difficulty around B1-B2.

PROVIDED PHRASAL VERBS (JSON):
${JSON.stringify(phrasalVerbs, null, 2)}

Return JSON only.`;
  }
}
