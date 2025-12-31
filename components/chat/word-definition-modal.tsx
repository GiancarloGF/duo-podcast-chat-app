'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Volume2, Loader2, BookmarkPlus, Check } from 'lucide-react';
import { saveWord } from '@/lib/actions/save-word';
import { toast } from 'sonner';

interface WordDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  sentence: string;
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}

export function WordDefinitionModal({
  isOpen,
  onClose,
  word,
  sentence,
}: WordDefinitionModalProps) {
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen && word) {
      fetchDefinition();
      setIsSaved(false); // Reset saved state on new word
    }
  }, [isOpen, word]);

  const fetchDefinition = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
          word
        )}`
      );
      if (!response.ok) {
        throw new Error('Definition not found');
      }
      const data = await response.json();
      setDefinition(data[0]);
    } catch (err) {
      setError('Could not find definition for this word.');
      setDefinition(null);
    } finally {
      setLoading(false);
    }
  };

  const getAccentLabel = (url: string) => {
    if (url.includes('-uk.mp3')) return 'UK';
    if (url.includes('-us.mp3')) return 'US';
    if (url.includes('-au.mp3')) return 'AU';
    return 'General';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveWord(word, sentence);
      if (result.success) {
        setIsSaved(true);
        toast.success('Word saved successfully with AI context!');
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
      <DialogContent className='sm:max-w-md max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <DialogTitle className='text-2xl font-bold capitalize'>
                {word}
              </DialogTitle>
            </div>

            {/* Pronunciations List */}
            {definition?.phonetics.filter((p) => p.audio).length ? (
              <div className='flex flex-wrap gap-2 mt-1'>
                {definition.phonetics
                  .filter((p) => p.audio && p.audio.trim() !== '')
                  .map((phonetic, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        new Audio(phonetic.audio).play().catch(console.error)
                      }
                      className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm'
                      title={`Listen to ${getAccentLabel(
                        phonetic.audio!
                      )} pronunciation`}
                    >
                      <Volume2 className='w-4 h-4 text-blue-500' />
                      <span className='font-medium text-xs text-gray-600 dark:text-gray-300'>
                        {getAccentLabel(phonetic.audio!)}
                      </span>
                      {phonetic.text && (
                        <span className='text-xs text-gray-500 font-mono border-l border-gray-300 dark:border-gray-600 pl-2 ml-1'>
                          {phonetic.text}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            ) : definition?.phonetic ? (
              <DialogDescription className='text-base font-mono'>
                {definition.phonetic}
              </DialogDescription>
            ) : null}
          </div>
        </DialogHeader>

        <div className='space-y-4 my-2'>
          {loading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='w-8 h-8 animate-spin text-gray-400' />
            </div>
          ) : error ? (
            <div className='text-center py-6 text-gray-500'>{error}</div>
          ) : (
            <div className='space-y-4'>
              {definition?.meanings.map((meaning, index) => (
                <div key={index} className='space-y-2'>
                  <div className='font-semibold italic text-gray-600 dark:text-gray-400'>
                    {meaning.partOfSpeech}
                  </div>
                  <ul className='list-disc pl-5 space-y-1 text-sm'>
                    {meaning.definitions.slice(0, 3).map((def, idx) => (
                      <li key={idx}>
                        <span className='text-gray-800 dark:text-gray-200'>
                          {def.definition}
                        </span>
                        {def.example && (
                          <div className='text-gray-500 dark:text-gray-500 text-xs mt-0.5 italic'>
                            "{def.example}"
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='flex justify-end pt-2 border-t mt-2'>
          <button
            onClick={handleSave}
            disabled={isSaving || isSaved || !!error}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors ${
              isSaved
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>AI Generating...</span>
              </>
            ) : isSaved ? (
              <>
                <Check className='w-4 h-4' />
                <span>Saved</span>
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
