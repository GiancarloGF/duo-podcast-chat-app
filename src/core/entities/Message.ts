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
  content: string;
  contentHtml: string;
  contentMarkdown: string;
  officialTranslation: string | null;
  keyPoints: KeyPoint[];
  requiresTranslation?: boolean;
}
