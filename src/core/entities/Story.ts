import { Message } from './Message';

export interface Character {
  name: string;
  role: string;
}

export interface Story {
  id: string;
  slug: string; // Added slug
  number: number;
  title: string;
  url?: string;
  imageUrl: string;
  summaryText: string;
  summaryHtml: string;
  languageLevel: string;
  themes: string[];
  characters: Character[];
  messages: Message[];
  messageCount?: number;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}
