import type { TranslationFeedback } from './entities/TranslationFeedback';
import type { Message } from './entities/Message';

/** UI type for rendering interleaved messages in chat */
export interface ChatMessage {
  id: string;
  episodeMessageId?: string;
  sender: string;
  message?: Message;
  content: string;
  isUserMessage: boolean;
  translationFeedback?: TranslationFeedback;
  timestamp: number | string;
  isValidating?: boolean;
}

export interface UserTranslation {
  messageId: string;
  userTranslation: string;
  officialTranslation: string;
  timestamp: number;
  skipped: boolean;
  feedback?: TranslationFeedback;
}

export interface EpisodeProgress {
  episodeId: string;
  currentMessageIndex: number;
  translations: UserTranslation[];
  completedAt?: number;
  startedAt: number;
  lastUpdated: number;
}

export interface UserStats {
  totalTranslations: number;
  totalSkipped: number;
  completedEpisodes: number;
  averageScore: number;
}
