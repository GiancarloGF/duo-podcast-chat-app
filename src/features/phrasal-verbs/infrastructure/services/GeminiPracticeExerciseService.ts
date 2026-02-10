import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  practiceExerciseSchema,
  type PracticeExercise,
  type PracticeExercisePhrasalVerbInput,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';

export class GeminiPracticeExerciseService {
  private client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  async generateReadAndMarkMeaningExercise(
    phrasalVerbs: PracticeExercisePhrasalVerbInput[]
  ): Promise<PracticeExercise> {
    console.info('[GeminiPracticeExerciseService] generate:start', {
      pvCount: phrasalVerbs.length,
      pvIds: phrasalVerbs.map((pv) => pv.id),
    });

    const prompt = this.buildPrompt(phrasalVerbs);

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(practiceExerciseSchema),
      },
    });

    if (!response.text) {
      console.error(
        '[GeminiPracticeExerciseService] No response received from Gemini'
      );
      throw new Error('No response received from Gemini for practice exercise');
    }

    console.info('[GeminiPracticeExerciseService] generate:response', {
      hasText: Boolean(response.text),
      textLength: response.text.length,
    });

    const parsed = practiceExerciseSchema.parse(JSON.parse(response.text));
    const shuffled = {
      ...parsed,
      items: parsed.items.map((item) => this.shuffleMeanings(item)),
    };

    console.info('[GeminiPracticeExerciseService] generate:parsed', {
      itemCount: shuffled.items.length,
      exerciseType: shuffled.exerciseType,
    });

    return shuffled;
  }

  private shuffleMeanings(item: PracticeExercise['items'][number]): PracticeExercise['items'][number] {
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

  private buildPrompt(phrasalVerbs: PracticeExercisePhrasalVerbInput[]): string {
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
}
