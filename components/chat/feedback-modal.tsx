'use client';

import type { TranslationFeedback, UserTranslation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'>
      <div className='bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10'>
          <div>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
              Análisis de Traducción
            </h2>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
              Detalles y sugerencias de mejora
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className='overflow-y-auto p-6 space-y-8'>
          {/* Main Score & Comparison Section */}
          <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
            {/* Score Card */}
            <div className='col-span-1 md:col-span-3 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-800'>
              <div
                className='w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2'
                style={{
                  background: `conic-gradient(var(--color-blue-500) ${feedback.score}%, transparent 0)`,
                  // Quick hack for circular progress visual, or just simple color
                }}
              >
                <div className='w-14 h-14 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400'>
                  {feedback.score}
                </div>
              </div>
              <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                Puntuación
              </span>
            </div>

            {/* Translation Comparison */}
            <div className='col-span-1 md:col-span-9 space-y-4'>
              <div>
                <label className='text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 block'>
                  Tu Traducción
                </label>
                <div className='p-3.5 bg-gray-50 dark:bg-slate-800/80 rounded-lg text-gray-800 dark:text-gray-200 text-[15px] border border-gray-100 dark:border-slate-700/50'>
                  {feedback.userTranslation}
                </div>
              </div>
              <div>
                <label className='text-xs font-semibold text-blue-500/80 dark:text-blue-400/80 uppercase tracking-wider mb-1.5 block'>
                  Mejor Opción
                </label>
                <div className='p-3.5 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg text-gray-800 dark:text-gray-100 text-[15px] border border-blue-100 dark:border-blue-900/30'>
                  {feedback.officialTranslation}
                </div>
              </div>
            </div>
          </div>

          <div className='h-px bg-gray-100 dark:bg-slate-800' />

          {/* Analysis Section */}
          <div className='space-y-4'>
            <h3 className='text-base font-bold text-gray-900 dark:text-white flex items-center gap-2'>
              Análisis General
            </h3>
            <div className='text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-slate-900'>
              {feedback.analysis}
            </div>
          </div>

          {/* Detailed Breakdown */}
          {feedback.detailedAnalysis && (
            <div className='space-y-4'>
              <h3 className='text-base font-bold text-gray-900 dark:text-white'>
                Detalles Técnicos
              </h3>
              <div className='flex flex-col gap-4'>
                {feedback.detailedAnalysis.grammar && (
                  <div className='p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50'>
                    <div className='text-xs font-bold text-gray-400 uppercase mb-2'>
                      Gramática
                    </div>
                    <div className='text-sm text-gray-700 dark:text-gray-300'>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className='!m-0'>{children}</p>
                          ),
                        }}
                      >
                        {feedback.detailedAnalysis.grammar}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {feedback.detailedAnalysis.vocabulary && (
                  <div className='p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50'>
                    <div className='text-xs font-bold text-gray-400 uppercase mb-2'>
                      Vocabulario
                    </div>
                    <div className='text-sm text-gray-700 dark:text-gray-300'>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className='!m-0'>{children}</p>
                          ),
                        }}
                      >
                        {feedback.detailedAnalysis.vocabulary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {feedback.detailedAnalysis.construction && (
                  <div className='p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50'>
                    <div className='text-xs font-bold text-gray-400 uppercase mb-2'>
                      Estructura
                    </div>
                    <div className='text-sm text-gray-700 dark:text-gray-300'>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className='!m-0'>{children}</p>
                          ),
                        }}
                      >
                        {feedback.detailedAnalysis.construction}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggestions & Corrections */}
          {(feedback.suggestions?.length > 0 ||
            feedback.phrasalVerbs?.suggestions?.length > 0) && (
            <div className='space-y-4'>
              <h3 className='text-base font-bold text-gray-900 dark:text-white'>
                Sugerencias
              </h3>
              <div className='space-y-3'>
                {feedback.suggestions?.map((suggestion, idx) => (
                  <div
                    key={`sugg-${idx}`}
                    className='flex gap-3 text-sm text-gray-700 dark:text-gray-300 items-start'
                  >
                    <div className='w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0' />
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <span className='block'>{children}</span>
                        ),
                      }}
                    >
                      {suggestion}
                    </ReactMarkdown>
                  </div>
                ))}
                {feedback.phrasalVerbs?.suggestions?.map((suggestion, idx) => (
                  <div
                    key={`phrasal-${idx}`}
                    className='flex gap-3 text-sm text-gray-700 dark:text-gray-300 items-start'
                  >
                    <div className='w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0' />
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <span className='block'>{children}</span>
                        ),
                      }}
                    >
                      {suggestion}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-4 px-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50'>
          <Button
            onClick={onClose}
            className='w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium py-6 rounded-xl transition-all'
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
