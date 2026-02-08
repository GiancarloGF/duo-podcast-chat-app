'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/presentation/components/ui/dialog';
import { Loader2, BookmarkPlus, Check } from 'lucide-react';
import { saveWord, getWordDefinition } from '@/features/translations/presentation/actions';
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

  useEffect(() => {
    if (isOpen && word) {
      fetchDefinition();
      setIsSaved(false);
    }
  }, [isOpen, word]);

  const fetchDefinition = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWordDefinition(word, sentence);
      if (result.success && result.data) {
        setDefinitionData(result.data as any);
      } else {
        throw new Error(result.error || 'Failed to fetch definition');
      }
    } catch (err) {
      setError('Could not find definition for this word.');
      setDefinitionData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!definitionData) return;

    setIsSaving(true);
    try {
      // Save the DETECTED word (e.g., "get up") instead of the clicked word ("get")
      const result = await saveWord(definitionData.definedWord, sentence);
      if (result.success) {
        setIsSaved(true);
        toast.success(
          `Saved "${definitionData.definedWord}" to your collection!`
        );
      } else {
        toast.error('Failed to save word.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred.');
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
                <span className='px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 rounded-full italic'>
                  {definitionData.partOfSpeech}
                </span>
              )}
            </div>
            {definitionData?.spanishTranslation && (
              <p className='text-lg font-medium text-gray-600 dark:text-gray-300'>
                {definitionData.spanishTranslation}
              </p>
            )}
          </div>
          {definitionData?.typeOf && (
            <DialogDescription className='text-sm text-muted-foreground mt-1'>
              Type: {definitionData.typeOf}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className='mt-4 space-y-6'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-12 space-y-4'>
              <Loader2 className='w-10 h-10 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground animate-pulse'>
                Analyzing context with Gemini AI...
              </p>
            </div>
          ) : error ? (
            <div className='p-4 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg'>
              {error}
            </div>
          ) : definitionData ? (
            <>
              {/* Definition Section */}
              <div className='space-y-2'>
                <h4 className='text-sm font-semibold text-foreground/80 uppercase tracking-wider'>
                  Definition
                </h4>
                <p className='text-lg leading-relaxed font-medium text-foreground'>
                  {definitionData.definition}
                </p>
              </div>

              {/* Summary/Context Section */}
              <div className='space-y-2'>
                <h4 className='text-sm font-semibold text-foreground/80 uppercase tracking-wider'>
                  Context Analysis
                </h4>
                <div className='bg-muted/50 p-3 rounded-lg border border-border/50 text-sm text-muted-foreground leading-relaxed'>
                  {definitionData.summary}
                </div>
              </div>

              {/* Examples Section */}
              {definitionData.otherExamples?.length > 0 && (
                <div className='space-y-2'>
                  <h4 className='text-sm font-semibold text-foreground/80 uppercase tracking-wider'>
                    Usage Examples
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

              {/* Synonyms Section */}
              {definitionData.synonyms?.length > 0 && (
                <div className='space-y-2'>
                  <h4 className='text-sm font-semibold text-foreground/80 uppercase tracking-wider'>
                    Synonyms
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {definitionData.synonyms.map((syn, idx) => (
                      <span
                        key={idx}
                        className='px-2.5 py-1 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-default'
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

        {/* Footer Actions */}
        <div className='flex justify-end pt-4 border-t mt-6'>
          <button
            onClick={handleSave}
            disabled={isSaving || isSaved || loading || !definitionData}
            className={`
              relative flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white shadow-sm transition-all
              ${
                isSaved
                  ? 'bg-green-600 hover:bg-green-700 ring-green-200'
                  : 'bg-primary hover:bg-primary/90 hover:shadow-md'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            `}
          >
            {isSaving ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Saving...</span>
              </>
            ) : isSaved ? (
              <>
                <Check className='w-4 h-4' />
                <span>Saved to Layout</span>
              </>
            ) : (
              <>
                <BookmarkPlus className='w-4 h-4' />
                <span>Save Word</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
