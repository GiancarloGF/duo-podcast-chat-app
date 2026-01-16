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

export interface EpisodeMessage {
  id: string;
  sender: string;
  senderType: SenderType | string;
  language: MessageLanguage;
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
  slug: string;
  number: number;
  title: string;
  url?: string;
  imageUrl: string;
  summaryText: string;
  summaryHtml: string;
  languageLevel: string;
  themes: string[];
  characters: Character[];
  messages: EpisodeMessage[];
  messageCount: number;
}

export interface Interaction {
  messageId: string;
  userInput: string;
  translationFeedback: TranslationFeedback | undefined;
  isCorrect: boolean;
  timestamp: Date;
}

// UI Type for rendering messages (Interleaved list)
export interface ChatMessage {
  id: string;
  episodeMessageId?: string;
  sender: string;
  message?: EpisodeMessage;
  content: string;
  isUserMessage: boolean;
  translationFeedback?: TranslationFeedback;
  timestamp: number | string;
  isValidating?: boolean;
}

export interface UserProgress {
  id?: string;
  userId: string;
  episodeId: string;
  currentMessageIndex: number;
  interactions: Interaction[];
  status: 'started' | 'completed';
  lastActiveAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TranslationFeedback {
  userTranslation: string;
  officialTranslation: string;
  originalContent: string;
  analysis: string;
  score: number;
  suggestions: string[];
  differences?: string;
  detailedAnalysis: {
    grammar: string;
    vocabulary: string;
    construction: string;
  };
  phrasalVerbs: {
    relevant: boolean;
    suggestions: string[];
  };
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

export interface EpisodeWithProgress {
  // Datos del Episodio
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  messageCount: number;
  summaryText: string;

  // Datos del Progreso (Calculados)
  progressId: string | undefined;
  status: 'new' | 'started' | 'completed';
  percentCompleted: number; // 0 a 100
  lastActiveAt: Date | null;
  currentMessageIndex: number;
}
