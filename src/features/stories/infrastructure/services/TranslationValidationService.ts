export interface TranslationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TranslationValidationService {
  static isEmpty(translation: string): boolean {
    return translation.trim().length === 0;
  }

  static isMinimumLength(translation: string, minLength = 3): boolean {
    return translation.trim().length >= minLength;
  }

  static appearsToBeEnglish(translation: string): boolean {
    const commonEnglishWords = [
      'the', 'is', 'at', 'which', 'on', 'a', 'and', 'or', 'but', 'in', 'to',
      'for', 'of', 'that', 'this', 'was', 'be', 'are', 'been', 'were',
    ];
    const words = translation.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter((word) =>
      commonEnglishWords.includes(word)
    ).length;
    return englishWordCount > 0 || words.length <= 2;
  }

  static validate(translation: string): TranslationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.isEmpty(translation)) {
      errors.push('La traducción no puede estar vacía');
      return { isValid: false, errors, warnings };
    }

    if (!this.isMinimumLength(translation)) {
      errors.push('La traducción debe tener al menos 3 caracteres');
    }

    if (
      this.isMinimumLength(translation) &&
      !this.appearsToBeEnglish(translation)
    ) {
      warnings.push('Asegúrate de que escribiste la traducción en inglés');
    }

    if (this.hasSpanishPatterns(translation)) {
      warnings.push('Parece que usaste español. Recuerda traducir al inglés');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static hasSpanishPatterns(text: string): boolean {
    const spanishPatterns = /[áéíóúñü]|(?:ción|sión|dad|mente)$/;
    return spanishPatterns.test(text);
  }
}
