export interface WordDefinitionResult {
  success: boolean;
  data?: {
    definedWord: string;
    partOfSpeech: string;
    synonyms: string[];
    typeOf: string;
    definition: string;
    otherExamples: string[];
    summary: string;
    spanishTranslation: string;
  };
  error?: string;
}

export interface WordDefinitionService {
  getDetailedWordDefinition(
    word: string,
    sentence: string
  ): Promise<WordDefinitionResult['data']>;
}

export async function getWordDefinition(
  service: WordDefinitionService,
  word: string,
  sentence: string
): Promise<WordDefinitionResult> {
  try {
    const data = await service.getDetailedWordDefinition(word, sentence);
    return { success: true, data };
  } catch (error) {
    console.error('Error in getWordDefinition:', error);
    return { success: false, error: 'Failed to fetch definition' };
  }
}
