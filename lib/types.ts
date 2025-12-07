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
  senderType: SenderType | string;
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
  id: string; // Unique ID for this specific chat message (e.g. generated or episode msg id)
  episodeMessageId?: string; // If it relates to an episode message
  sender: string;
  message: string;
  isUserMessage: boolean;
  translationFeedback?: TranslationFeedback;
  timestamp?: number | string; // Date from DB
}

export interface Chat {
  _id?: string; // Optional because Mongoose adds it, receiving from API
  episodeId: string;
  userId: string;
  status: 'idle' | 'initialized' | 'completed';
  progress: number;
  messages: ChatMessage[];
  createdAt?: string;
  updatedAt?: string;
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
