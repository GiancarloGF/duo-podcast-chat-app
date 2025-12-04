export type SenderType = 'host' | 'protagonist' | 'user';
export type MessageLanguage = 'es' | 'en';
export type MessageType =
  | 'context'
  | 'narrative'
  | 'educational'
  | 'introduction'
  | 'translation';

export interface KeyTerm {
  spanish: string;
  english: string;
  explanation?: string;
}

export interface Message {
  id: number;
  sender: string;
  senderType: SenderType;
  language: MessageLanguage;
  requiresTranslation: boolean;
  content: string;
  officialTranslation: string | null;
  messageType: MessageType;
  keyTerms?: KeyTerm[];
  culturalContext?: string;
  audioTimestamp?: string;
}

export interface Protagonist {
  name: string;
  role: string;
  language: MessageLanguage;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  publicationDate: string;
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hosts: string[];
  protagonists: Protagonist[];
  tags: string[];
  messages: Message[];
}

export interface UserTranslation {
  messageId: number;
  userTranslation: string;
  feedback?: {
    officialTranslation: string;
    analysis: string;
    score: number;
    suggestions: string[];
    differences?: string;
  };
  timestamp: number;
  skipped: boolean;
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
