import type { Character } from './Character';
import type { Message } from './Message';

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
  messages: Message[];
  messageCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}
