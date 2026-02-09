'use client';

import type { TranslationFeedback } from '@/features/stories/domain/entities/TranslationFeedback';
import { Button } from '@/shared/presentation/components/ui/button';
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
    <div className='fixed inset-0 bg-[rgba(25,21,20,0.75)] backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'>
      <div className='bg-card rounded-[10px] max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border-2 border-border shadow-[10px_10px_0_0_var(--color-border)]'>
        <div className='flex items-center justify-between px-6 py-4 border-b-2 border-border bg-card sticky top-0 z-10'>
          <div>
            <h2 className='text-lg font-black text-foreground'>
              Análisis de Traducción
            </h2>
            <p className='text-xs text-muted-foreground mt-0.5 font-semibold uppercase'>
              Detalles y sugerencias de mejora
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-secondary rounded-[6px] border-2 border-border bg-card shadow-[3px_3px_0_0_var(--color-border)] transition-all text-foreground'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='overflow-y-auto p-6 space-y-8'>
          <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
              <div className='col-span-1 md:col-span-3 flex flex-col items-center justify-center bg-muted rounded-[8px] p-4 border-2 border-border shadow-[4px_4px_0_0_var(--color-border)]'>
              <div
                className='w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2'
                style={{
                  background: `conic-gradient(var(--color-primary) ${feedback.score}%, transparent 0)`,
                }}
              >
                <div className='w-14 h-14 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400'>
                  {feedback.score}
                </div>
              </div>
                <span className='text-xs font-bold text-muted-foreground uppercase tracking-wide'>
                  Puntuación
                </span>
              </div>

            <div className='col-span-1 md:col-span-9 space-y-4'>
              <div>
                <label className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block'>
                  Tu Traducción
                </label>
                <div className='p-3.5 bg-muted rounded-[8px] text-foreground text-[15px] border-2 border-border'>
                  {feedback.userTranslation}
                </div>
              </div>
              <div>
                <label className='text-xs font-bold text-primary uppercase tracking-wider mb-1.5 block'>
                  Mejor Opción
                </label>
                <div className='p-3.5 bg-[#e7e7ff] rounded-[8px] text-foreground text-[15px] border-2 border-border'>
                  {feedback.officialTranslation}
                </div>
              </div>
            </div>
          </div>

          <div className='h-0.5 bg-border' />

          <div className='space-y-4'>
            <h3 className='text-base font-black text-foreground flex items-center gap-2'>
              Análisis General
            </h3>
            <div className='text-sm text-muted-foreground leading-relaxed bg-card font-medium'>
              {feedback.analysis}
            </div>
          </div>

          {feedback.detailedAnalysis && (
            <div className='space-y-4'>
                <h3 className='text-base font-black text-foreground'>
                  Detalles Técnicos
                </h3>
                <div className='flex flex-col gap-4'>
                  {feedback.detailedAnalysis.grammar && (
                    <div className='p-4 rounded-[8px] bg-muted border-2 border-border'>
                      <div className='text-xs font-bold text-muted-foreground uppercase mb-2'>
                        Gramática
                      </div>
                      <div className='text-sm text-foreground'>
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
                    <div className='p-4 rounded-[8px] bg-muted border-2 border-border'>
                      <div className='text-xs font-bold text-muted-foreground uppercase mb-2'>
                        Vocabulario
                      </div>
                      <div className='text-sm text-foreground'>
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
                    <div className='p-4 rounded-[8px] bg-muted border-2 border-border'>
                      <div className='text-xs font-bold text-muted-foreground uppercase mb-2'>
                        Estructura
                      </div>
                      <div className='text-sm text-foreground'>
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

          {(feedback.suggestions?.length > 0 ||
            feedback.phrasalVerbs?.suggestions?.length > 0) && (
            <div className='space-y-4'>
                <h3 className='text-base font-black text-foreground'>
                  Sugerencias
                </h3>
                <div className='space-y-3'>
                {feedback.suggestions?.map((suggestion, idx) => (
                  <div
                    key={`sugg-${idx}`}
                    className='flex gap-3 text-sm text-foreground items-start'
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
                    className='flex gap-3 text-sm text-foreground items-start'
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

        <div className='p-4 px-6 border-t-2 border-border bg-muted'>
          <Button
            onClick={onClose}
            className='w-full py-6'
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
