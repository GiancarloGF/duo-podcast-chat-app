'use client';

import type { TranslationFeedback, UserTranslation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FeedbackModalProps {
  feedback: TranslationFeedback;
  onClose: () => void;
  isOpen: boolean;
}

export function FeedbackModal({
  feedback,
  onClose,
  isOpen,
}: FeedbackModalProps) {
  if (!isOpen || !feedback) return null;

  console.log('Feedback:', feedback);

  return (
    <div className='fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900'>
          <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
            Feedback de tu Traducción
          </h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition'
          >
            <X className='w-5 h-5 text-gray-600 dark:text-gray-400' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Score */}
          <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
            <div className='flex items-center justify-between'>
              <span className='font-semibold text-gray-900 dark:text-white'>
                Puntuación
              </span>
              <span className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                {feedback.score}/100
              </span>
            </div>
          </div>

          {/* Official Translation */}
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
              Traducción Oficial
            </h3>
            <div className='bg-gray-100 dark:bg-slate-800 p-3 rounded-lg text-gray-900 dark:text-gray-100 text-sm'>
              {feedback.officialTranslation}
            </div>
          </div>

          {/* User Translation */}
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
              Tu Traducción
            </h3>
            <div className='bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-gray-900 dark:text-gray-100 text-sm'>
              {feedback.userTranslation}
            </div>
          </div>

          {/* Analysis */}
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
              Análisis
            </h3>
            <div className='bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap'>
              {feedback.analysis}
            </div>
          </div>

          {/* Detailed Analysis */}
          {feedback.detailedAnalysis && (
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white mb-3'>
                Análisis Detallado
              </h3>
              <div className='space-y-3'>
                {feedback.detailedAnalysis.grammar && (
                  <div className='bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg'>
                    <h4 className='font-semibold text-purple-900 dark:text-purple-300 text-sm mb-1'>
                      Gramática
                    </h4>
                    <p className='text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap'>
                      {feedback.detailedAnalysis.grammar}
                    </p>
                  </div>
                )}
                {feedback.detailedAnalysis.vocabulary && (
                  <div className='bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg'>
                    <h4 className='font-semibold text-indigo-900 dark:text-indigo-300 text-sm mb-1'>
                      Vocabulario
                    </h4>
                    <p className='text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap'>
                      {feedback.detailedAnalysis.vocabulary}
                    </p>
                  </div>
                )}
                {feedback.detailedAnalysis.construction && (
                  <div className='bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg'>
                    <h4 className='font-semibold text-cyan-900 dark:text-cyan-300 text-sm mb-1'>
                      Construcción
                    </h4>
                    <p className='text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap'>
                      {feedback.detailedAnalysis.construction}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phrasal Verbs */}
          {feedback.phrasalVerbs?.relevant &&
            feedback.phrasalVerbs.suggestions.length > 0 && (
              <div>
                <h3 className='font-semibold text-gray-900 dark:text-white mb-3'>
                  Phrasal Verbs
                </h3>
                <div className='bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg'>
                  <p className='text-sm text-gray-700 dark:text-gray-300 mb-3'>
                    Puedes usar phrasal verbs para sonar más natural:
                  </p>
                  <ul className='space-y-2'>
                    {feedback.phrasalVerbs.suggestions.map(
                      (suggestion, idx) => (
                        <li
                          key={idx}
                          className='flex gap-3 text-sm text-gray-700 dark:text-gray-300'
                        >
                          <span className='flex-shrink-0 w-6 h-6 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-amber-900 dark:text-amber-200 font-semibold text-xs'>
                            {idx + 1}
                          </span>
                          <span className='whitespace-pre-wrap'>
                            {suggestion}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}

          {/* Differences */}
          {feedback.differences && (
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
                Diferencias
              </h3>
              <div className='bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap'>
                {feedback.differences}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white mb-3'>
                Sugerencias de Mejora
              </h3>
              <ul className='space-y-2'>
                {feedback.suggestions.map((suggestion, idx) => (
                  <li
                    key={idx}
                    className='flex gap-3 text-sm text-gray-700 dark:text-gray-300'
                  >
                    <span className='flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-700 dark:text-green-300 font-semibold text-xs'>
                      {idx + 1}
                    </span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800'>
          <Button
            onClick={onClose}
            className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
