'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/presentation/components/ui/button';
import { Send, SkipForward, AlertCircle } from 'lucide-react';
import { TranslationValidationService } from '@/features/stories/infrastructure/services/TranslationValidationService';
import { cn } from '@/shared/presentation/utils';

interface TranslationInputProps {
  onSubmit: (translation: string) => void;
  onSkip: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function TranslationInput({
  onSubmit,
  onSkip,
  isLoading,
  disabled = false,
}: TranslationInputProps) {
  const [translation, setTranslation] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll input into view when focused on mobile
  useEffect(() => {
    const handleFocus = () => {
      // Small delay to ensure keyboard is opening
      setTimeout(() => {
        if (inputRef.current && window.innerWidth < 768) {
          inputRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 300);
    };

    const textarea = inputRef.current;
    if (textarea) {
      textarea.addEventListener('focus', handleFocus);
      return () => {
        textarea.removeEventListener('focus', handleFocus);
      };
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 120);
      inputRef.current.style.height = `${newHeight}px`;

      // Toggle overflow based on whether we hit the max height
      if (inputRef.current.scrollHeight > 120) {
        inputRef.current.style.overflowY = 'auto';
      } else {
        inputRef.current.style.overflowY = 'hidden';
      }
    }
  }, [translation]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTranslation(value);

    if (value.trim()) {
      const validation = TranslationValidationService.validate(value);
      // Only show errors if really invalid, don't nag too much while typing
      if (!validation.isValid && validation.errors.length > 0) {
        // Delay error showing or just show them? For now, clean UI is priority.
        // We'll show errors only on submit attempt or strict validation.
        // Let's keep state but maybe display differently.
        setValidationErrors(validation.errors);
      } else {
        setValidationErrors([]);
      }
    } else {
      setValidationErrors([]);
    }
  };

  const handleSubmit = () => {
    const validation = TranslationValidationService.validate(translation);

    if (validation.isValid) {
      onSubmit(translation);
      setTranslation('');
      setValidationErrors([]);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.overflowY = 'hidden';
      }
      inputRef.current?.focus();
    } else {
      setValidationErrors(validation.errors);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div ref={containerRef} className='w-full max-w-4xl mx-auto px-4 pb-4'>
      {/* Validation Errors Popup - Show above input if any */}
      {validationErrors.length > 0 && (
        <div className='mb-2 p-2 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2 animate-in slide-in-from-bottom-2'>
          <AlertCircle className='w-4 h-4' />
          <span>{validationErrors[0]}</span>
        </div>
      )}

      <div className='relative flex items-end gap-2 bg-gray-100 dark:bg-slate-800 rounded-4xl p-2 pr-2 shadow-sm border border-transparent focus-within:border-gray-300 dark:focus-within:border-slate-600 transition-colors'>
        {/* Text Input */}
        <textarea
          ref={inputRef}
          value={translation}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder='Type / for commands'
          disabled={isLoading || disabled}
          className='flex-1 max-h-[120px] py-3 pl-4 bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-[15px] leading-relaxed overflow-hidden'
          rows={1}
        />

        {/* Action Buttons */}
        <div className='flex items-center gap-1 pb-1'>
          {/* Skip Button (Replaces Mic) */}
          <Button
            variant='ghost'
            size='icon'
            className='h-9 w-9 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full'
            onClick={onSkip}
            disabled={isLoading || disabled}
            aria-label='Skip'
          >
            <SkipForward className='h-5 w-5' />
          </Button>

          {/* Send Button */}
          <Button
            onClick={handleSubmit}
            disabled={!translation.trim() || isLoading || disabled}
            size='icon'
            className={cn(
              'h-9 w-9 rounded-full transition-all duration-200',
              translation.trim()
                ? 'bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black'
                : 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'
            )}
          >
            <Send className='h-4 w-4 ml-0.5' />
          </Button>
        </div>
      </div>
    </div>
  );
}
