'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/presentation/components/ui/button';
import { Send, AlertCircle } from 'lucide-react';
import { TranslationValidationService } from '@/features/stories/infrastructure/services/TranslationValidationService';
import { cn } from '@/shared/presentation/utils';

interface TranslationInputProps {
  onSubmit: (translation: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function TranslationInput({
  onSubmit,
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
    <div ref={containerRef} className='w-full pt-3'>
      {/* Validation Errors Popup - Show above input if any */}
      {validationErrors.length > 0 && (
        <div className='mb-2 p-2 bg-[#ffe8e8] text-red-700 text-xs rounded-[8px] border-2 border-red-700 shadow-[3px_3px_0_0_#7f1d1d] flex items-center gap-2 animate-in slide-in-from-bottom-2 font-semibold'>
          <AlertCircle className='w-4 h-4' />
          <span>{validationErrors[0]}</span>
        </div>
      )}

      <div className='relative flex items-end gap-2 bg-card rounded-[8px] p-2 pr-2 border-2 border-border transition-colors'>
        {/* Text Input */}
        <textarea
          ref={inputRef}
          value={translation}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder='Escribe tu traduccion...'
          disabled={isLoading || disabled}
          className='flex-1 max-h-[120px] py-3 pl-4 bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-foreground placeholder-muted-foreground text-[15px] leading-relaxed overflow-hidden font-medium'
          rows={1}
        />

        {/* Action Buttons */}
        <div className='flex items-center gap-1 pb-1'>
          <Button
            onClick={handleSubmit}
            disabled={!translation.trim() || isLoading || disabled}
            size='sm'
            className={cn(
              'h-9  px-1 sm:px-3 transition-all duration-200 min-w-min sm:min-w-24',
              translation.trim()
                ? 'bg-primary hover:brightness-95 text-primary-foreground border-2 border-border shadow-[3px_3px_0_0_var(--color-border)] rounded-[6px]'
                : 'bg-muted text-muted-foreground border-2 border-border rounded-[6px] cursor-not-allowed'
            )}
          >
            <Send className='h-4 w-4' />
            <span className='hidden sm:inline-block ml-2'>Enviar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
