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
