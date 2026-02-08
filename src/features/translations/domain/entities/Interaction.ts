import type { TranslationFeedback } from './TranslationFeedback';

export interface Interaction {
  messageId: string;
  userInput: string;
  translationFeedback: TranslationFeedback | undefined;
  isCorrect: boolean;
  timestamp: Date;
}
