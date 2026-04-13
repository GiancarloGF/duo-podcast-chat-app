'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/presentation/components/ui/dialog';
import { Loader2, BookmarkPlus, Check } from 'lucide-react';
import { saveWord, getWordDefinition } from '@/features/stories/presentation/actions';
import { toast } from 'sonner';

interface WordDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  sentence: string;
}

export function WordDefinitionModal({
  isOpen,
  onClose,
  word,
  sentence,
}: WordDefinitionModalProps) {
  const [definitionData, setDefinitionData] = useState<{
    definedWord: string;
    partOfSpeech: string;
    spanishTranslation: string;
    synonyms: string[];
    typeOf: string;
    definition: string;
    otherExamples: string[];
    summary: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fetchDefinition = useCallback(async () => {
    // Definitions depend on both the selected word and the sentence context,
    // so the request is rebuilt whenever either value changes.
    setLoading(true);
    setError(null);
    try {
      const result = await getWordDefinition(word, sentence);
      if (result.success && result.data) {
        setDefinitionData(result.data as {
          definedWord: string;
          partOfSpeech: string;
          spanishTranslation: string;
          synonyms: string[];
          typeOf: string;
          definition: string;
          otherExamples: string[];
          summary: string;
        });
      } else {
        throw new Error(result.error || 'Failed to fetch definition');
      }
    } catch (_error) {
      setError('No se encontro definicion para esta palabra.');
      setDefinitionData(null);
    } finally {
      setLoading(false);
    }
  }, [sentence, word]);

  useEffect(() => {
    if (isOpen && word) {
      void fetchDefinition();
      setIsSaved(false);
    }
  }, [fetchDefinition, isOpen, word]);

  const handleSave = async () => {
    if (!definitionData) return;

    // Saving is explicit and independent from fetching so read failures do not
    // accidentally create partial saved-word state.
    setIsSaving(true);
    try {
      const result = await saveWord(definitionData.definedWord, sentence);
      if (result.success) {
        setIsSaved(true);
        toast.success(
          `Se guardo "${definitionData.definedWord}" en tu coleccion!`
        );
      } else {
        toast.error('No se pudo guardar la palabra.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocurrio un error.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-lg max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex flex-col gap-1'>
            <div className='flex items-baseline justify-between'>
              <DialogTitle className='text-3xl font-bold text-primary capitalize'>
                {definitionData?.definedWord || word}
              </DialogTitle>
              {definitionData?.partOfSpeech && (
                <span className='px-3 py-1 text-xs font-bold text-primary bg-[#e7e7ff] rounded-[6px] italic border-2 border-border'>
                  {definitionData.partOfSpeech}
                </span>
              )}
            </div>
            {definitionData?.spanishTranslation && (
              <p className='text-lg font-semibold text-muted-foreground'>
                {definitionData.spanishTranslation}
              </p>
            )}
          </div>
          {definitionData?.typeOf && (
            <DialogDescription className='text-sm text-muted-foreground mt-1 font-semibold uppercase'>
              Tipo: {definitionData.typeOf}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className='mt-4 space-y-6'>
          {loading ? (
              <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                <Loader2 className='w-10 h-10 animate-spin text-primary' />
                <p className='text-sm text-muted-foreground animate-pulse font-semibold uppercase'>
                  Analizando contexto con Gemini AI...
                </p>
              </div>
            ) : error ? (
              <div className='p-4 text-center text-red-700 bg-[#ffe8e8] rounded-[8px] border-2 border-red-700'>
                {error}
              </div>
            ) : definitionData ? (
              <>
                <div className='space-y-2'>
                  <h4 className='text-sm font-bold text-foreground uppercase tracking-wider'>
                    Definicion
                  </h4>
                  <p className='text-lg leading-relaxed font-medium text-foreground'>
                    {definitionData.definition}
                  </p>
                </div>

                <div className='space-y-2'>
                  <h4 className='text-sm font-bold text-foreground uppercase tracking-wider'>
                    Analisis de contexto
                  </h4>
                  <div className='bg-muted p-3 rounded-[8px] border-2 border-border text-sm text-muted-foreground leading-relaxed'>
                    {definitionData.summary}
                  </div>
                </div>

              {definitionData.otherExamples?.length > 0 && (
                <div className='space-y-2'>
                  <h4 className='text-sm font-bold text-foreground uppercase tracking-wider'>
                    Ejemplos de uso
                  </h4>
                  <ul className='space-y-2'>
                    {definitionData.otherExamples.map((ex, idx) => (
                      <li key={idx} className='flex gap-2 text-sm group'>
                        <span className='text-primary mt-1'>•</span>
                        <span className='text-muted-foreground group-hover:text-foreground transition-colors'>
                          {ex}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {definitionData.synonyms?.length > 0 && (
                <div className='space-y-2'>
                  <h4 className='text-sm font-bold text-foreground uppercase tracking-wider'>
                    Sinonimos
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {definitionData.synonyms.map((syn, idx) => (
                      <span
                        key={idx}
                        className='px-2.5 py-1 text-xs rounded-[6px] bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0_0_var(--color-border)] cursor-default font-semibold'
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className='flex justify-end pt-4 border-t-2 border-border mt-6'>
          <button
            onClick={handleSave}
            disabled={isSaving || isSaved || loading || !definitionData}
            className={`
              relative flex items-center gap-2 px-6 py-2.5 rounded-[8px] font-bold uppercase tracking-wide text-white transition-all border-2 border-border
              ${
                isSaved
                  ? 'bg-accent text-accent-foreground shadow-[4px_4px_0_0_var(--color-border)]'
                  : 'bg-primary shadow-[4px_4px_0_0_var(--color-border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_var(--color-border)]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            `}
          >
            {isSaving ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Guardando...</span>
              </>
            ) : isSaved ? (
              <>
                <Check className='w-4 h-4' />
                <span>Guardada</span>
              </>
            ) : (
              <>
                <BookmarkPlus className='w-4 h-4' />
                <span>Guardar palabra</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
