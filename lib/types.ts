export type SenderType = 'host' | 'protagonist' | 'user';
export type MessageLanguage = 'es' | 'en';

export interface KeyPoint {
  type: string;
  concept: string;
  word: string;
  example: string;
  definition_es: string;
  definition_en: string;
}

export interface Message {
  id: string;
  sender: string;
  senderType: SenderType | string; // Added field
  language: MessageLanguage;
  requiresTranslation: boolean;
  content: string; // Was contentText
  contentHtml: string;
  contentMarkdown: string;
  officialTranslation: string | null; // Was contentTranslation
  keyPoints: KeyPoint[];
}

export interface Character {
  name: string;
  role: string;
}

export interface Episode {
  id: string;
  title: string;
  imageUrl: string;
  summaryText: string;
  summaryHtml: string;
  languageLevel: string;
  themes: string[];
  characters: Character[];
  messages: Message[];
}

export interface ChatMessage {
  id: string;
  order: number;
  episodeMessageId: string;
  sender: string;
  message: string;
  translationFeedback?: TranslationFeedback;
}

export interface Chat {
  episodeId: string;
  messages: ChatMessage[];
}

export interface TranslationFeedback {
  analysis: string;
  score: number;
  suggestions: string[];
  differences?: string;
}

export interface UserTranslation {
  messageId: string; // Changed to string
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
