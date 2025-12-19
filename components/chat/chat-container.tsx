'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Episode,
  Message,
  ChatMessage,
  UserTranslation,
  Chat,
} from '@/lib/types';
import { AIService } from '@/lib/ai-service';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { TranslationInput } from '@/components/chat/translation-input';
import { ErrorAlert } from '@/components/chat/error-alert';
import { Button } from '@/components/ui/button';
import { ChevronLeft, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatContainerProps {
  initialChat: Chat;
  initialEpisode: Episode;
  chatId: string;
}

export function ChatContainer({
  initialChat,
  initialEpisode,
  chatId,
}: ChatContainerProps) {
  const router = useRouter();

  // Store sync removed in favor of local handling and server actions/api calls
  // const updateLocalChatProgress = useChatStore(
  //   (state) => state.updateLocalChatProgress
  // );
  // const syncChatToDB = useChatStore((state) => state.syncChatToDB);

  // Initialize store with server data if needed, or rely on internal state mostly?
  // We'll use internal state for immediate rendering and sync to store in background.
  // Actually, let's keep using the store for persistence but initialize it.

  const [chat, setChat] = useState<Chat>(initialChat);

  // Sync prop updates to local state
  useEffect(() => {
    if (initialChat) {
      setChat(initialChat);
    }
  }, [initialChat]);

  const syncChatToDB = useCallback(
    async (chatId: string, data: Partial<Chat>) => {
      try {
        const res = await fetch(`/api/chats/${chatId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error('Failed to sync chat to DB');
        }

        // Optional: Update local state with DB response if needed (e.g. timestamps)
        // const updatedChat = await res.json();
        // setChat(prev => ({ ...prev, ...updatedChat }));
      } catch (error) {
        console.error('Error syncing chat to DB:', error);
        // Constructively, we might want to notify user or retry
      }
    },
    []
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] =
    useState<UserTranslation | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chat.messages.length, isProcessing]);

  // Calculate rendering state
  const progress = chat.progress || 0;
  const currentMessageIndex = progress;

  // Ensure we don't go out of bounds if messages are missing
  const currentMessage = useMemo(
    () => initialEpisode.messages[currentMessageIndex],
    [initialEpisode.messages, currentMessageIndex]
  );

  const episodeComplete = useMemo(
    () =>
      initialEpisode.messages.length > 0 &&
      currentMessageIndex >= initialEpisode.messages.length,
    [initialEpisode.messages.length, currentMessageIndex]
  );

  // We can rely on index check or chat status.
  // chat.status === 'completed' might be safer but index is the driver.

  const displayedMessages = useMemo(
    () =>
      initialEpisode.messages.slice(
        0,
        currentMessageIndex + (episodeComplete ? 0 : 1)
      ),
    [initialEpisode.messages, currentMessageIndex, episodeComplete]
  );

  // Construct userTranslations map from Chat History
  const { userTranslations, feedbackAvailable, allTranslations } =
    useMemo(() => {
      const userTranslations: Record<string, string> = {};
      const feedbackAvailable: Record<string, boolean> = {};
      const allTranslations: UserTranslation[] = [];

      if (chat) {
        chat.messages.forEach((msg) => {
          if (msg.isUserMessage && msg.episodeMessageId) {
            userTranslations[msg.episodeMessageId] = msg.message;
            if (msg.translationFeedback) {
              feedbackAvailable[msg.episodeMessageId] = true;
            }

            const originalMsg = initialEpisode.messages.find(
              (m) => m.id === msg.episodeMessageId
            );
            allTranslations.push({
              messageId: msg.episodeMessageId,
              userTranslation: msg.message,
              officialTranslation: originalMsg?.officialTranslation || '',
              timestamp:
                typeof msg.timestamp === 'number' ? msg.timestamp : Date.now(),
              skipped: msg.message === '',
              feedback: msg.translationFeedback,
            });
          }
        });
      }
      return { userTranslations, feedbackAvailable, allTranslations };
    }, [chat, initialEpisode.messages]);

  const needsTranslation = useMemo(
    () =>
      !episodeComplete &&
      currentMessage?.language === 'es' &&
      currentMessage?.requiresTranslation,
    [episodeComplete, currentMessage]
  );

  // Interaction handlers
  const canInteract = !isProcessing && !episodeComplete;

  const handleTranslation = useCallback(
    async (translation: string) => {
      if (!canInteract || !currentMessage) return;

      const isSkipAction = !translation;
      if (isSkipAction) setIsSkipping(true);
      setIsProcessing(true);
      setAiError(null);

      try {
        let feedback = null;
        if (translation) {
          feedback = await AIService.getFeedbackWithRetry(
            currentMessage.content,
            currentMessage.officialTranslation || '',
            translation
          );
        }

        // Optimization: use functional update and local vars to avoid dependency on chat state deep changes
        setChat((prev) => {
          const newMessages = [...prev.messages];

          if (translation) {
            const userMsgId = `user-msg-${Date.now()}`;
            const userMsg: ChatMessage = {
              id: userMsgId,
              episodeMessageId: currentMessage.id,
              sender: 'user',
              message: translation,
              isUserMessage: true,
              translationFeedback: feedback || undefined,
              timestamp: Date.now(),
            };
            newMessages.push(userMsg);
          }

          const epMsgCopy: ChatMessage = {
            id: `ep-msg-copy-${Date.now()}`,
            episodeMessageId: currentMessage.id,
            sender: currentMessage.sender,
            message: currentMessage.content,
            isUserMessage: false,
            timestamp: Date.now(),
          };
          newMessages.push(epMsgCopy);

          const newProgress = prev.progress + 1; // Use prev.progress instead of currentMessageIndex for atomicity
          const isComplete = newProgress >= initialEpisode.messages.length;

          const newStatus = isComplete ? 'completed' : 'initialized';

          // Fire and forget sync
          syncChatToDB(prev._id || prev.id || '', {
            progress: newProgress,
            messages: newMessages,
            status: newStatus,
          });

          return {
            ...prev,
            messages: newMessages,
            progress: newProgress,
            status: newStatus,
          };
        });
      } catch (error) {
        console.error('Error processing translation:', error);
        setAiError(
          'Error procesando tu traducción. Por favor intenta de nuevo.'
        );
        // Revert state if needed? For now we just show error.
      } finally {
        setIsProcessing(false);
        setIsSkipping(false);
      }
    },
    [canInteract, currentMessage, initialEpisode.messages.length, syncChatToDB]
  );

  const handleSkip = useCallback(() => {
    if (!canInteract) return;
    handleTranslation('');
  }, [canInteract, handleTranslation]);

  const handleNext = useCallback(() => {
    if (!canInteract) return;
    if (!currentMessage) return;

    setChat((prev) => {
      const newMessages = [...prev.messages];
      const epMsgCopy: ChatMessage = {
        id: `ep-msg-copy-${Date.now()}`,
        episodeMessageId: currentMessage.id,
        sender: currentMessage.sender,
        message: currentMessage.content,
        isUserMessage: false,
        timestamp: Date.now(),
      };
      newMessages.push(epMsgCopy);

      const newProgress = prev.progress + 1;
      const isComplete = newProgress >= initialEpisode.messages.length;
      const newStatus = isComplete ? 'completed' : 'initialized';

      syncChatToDB(prev._id || prev.id || '', {
        progress: newProgress,
        messages: newMessages,
        status: newStatus,
      });

      return {
        ...prev,
        messages: newMessages,
        progress: newProgress,
        status: newStatus,
      };
    });
  }, [
    canInteract,
    currentMessage,
    initialEpisode.messages.length,
    syncChatToDB,
  ]);

  const handleRestartEpisode = useCallback(async () => {
    const emptyMessages: ChatMessage[] = [];

    setChat((prev) => ({
      ...prev,
      progress: 0,
      messages: emptyMessages,
      status: 'initialized',
    }));

    await syncChatToDB(chatId, {
      progress: 0,
      messages: emptyMessages,
      status: 'initialized',
    });
    setAiError(null);
  }, [chatId, syncChatToDB]);

  const renderCompletionScreen = () => {
    const completedTranslations = allTranslations.filter(
      (t) => !t.skipped
    ).length;
    const skippedCount = allTranslations.filter((t) => t.skipped).length;
    const averageScore =
      allTranslations.filter((t) => t.feedback).length > 0
        ? Math.round(
            allTranslations
              .filter((t) => t.feedback)
              .reduce((sum, t) => sum + (t.feedback?.score || 0), 0) /
              allTranslations.filter((t) => t.feedback).length
          )
        : 0;

    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4'>
        <div className='max-w-2xl mx-auto py-8 sm:py-12'>
          <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8 text-center'>
            {/* Completion Screen Content */}
            <div className='mb-6'>
              <div className='text-5xl sm:text-6xl mb-4' aria-hidden='true'>
                🎉
              </div>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                ¡Episodio Completado!
              </h1>
              <p className='text-gray-600 dark:text-gray-300'>
                Excelente trabajo practicando inglés
              </p>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-3 gap-2 sm:gap-4 mb-8'>
              <div className='bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg'>
                <div className='text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  {completedTranslations}
                </div>
                <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
                  Traducciones
                </div>
              </div>
              <div className='bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 rounded-lg'>
                <div className='text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400'>
                  {skippedCount}
                </div>
                <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
                  Saltadas
                </div>
              </div>
              <div className='bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg'>
                <div className='text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400'>
                  {averageScore}
                </div>
                <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-400'>
                  Promedio
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='space-y-3 flex flex-col'>
              <Button
                onClick={handleRestartEpisode}
                className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
              >
                <RotateCcw className='w-4 h-4 mr-2' aria-hidden='true' />
                Reiniciar Episodio
              </Button>
              <Link href='/' className='block'>
                <Button variant='outline' className='w-full bg-transparent'>
                  <Home className='w-4 h-4 mr-2' aria-hidden='true' />
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (episodeComplete) {
    return renderCompletionScreen();
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col'>
      {/* Header */}
      <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 sticky top-0 z-40'>
        <div className='max-w-4xl mx-auto flex items-center justify-between gap-4'>
          <div className='flex items-center gap-2 sm:gap-4 flex-1 min-w-0'>
            <Link href='/'>
              <Button variant='ghost' size='sm' className='gap-2 shrink-0'>
                <ChevronLeft className='w-4 h-4' aria-hidden='true' />
                <span className='hidden sm:inline'>Atrás</span>
              </Button>
            </Link>
            <div className='min-w-0 flex-1'>
              <h1 className='font-bold text-gray-900 dark:text-white truncate'>
                {initialEpisode.title || 'Episodio'}
              </h1>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Mensaje {currentMessageIndex + 1} de{' '}
                {initialEpisode.messages.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='w-24 sm:w-32 shrink-0'>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
              <div
                className='bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all'
                style={{
                  width: `${
                    ((currentMessageIndex + 1) /
                      initialEpisode.messages.length) *
                    100
                  }%`,
                }}
                role='progressbar'
                aria-valuenow={
                  ((currentMessageIndex + 1) / initialEpisode.messages.length) *
                  100
                }
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {aiError && (
        <div className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4'>
          <ErrorAlert
            message={aiError}
            onDismiss={() => setAiError(null)}
            autoDismiss={true}
            dismissAfter={5000}
          />
        </div>
      )}

      {/* Chat Area */}
      {/* Reusing the message list rendering logic here */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900'>
        <div className='max-w-4xl mx-auto w-full pb-20'>
          {displayedMessages.map((message, idx) => {
            return (
              <div key={`original-${message.id}`}>
                <MessageBubble message={message} />
                {userTranslations[message.id] && (
                  <div className='mt-2'>
                    <MessageBubble
                      message={{
                        id: message.id,
                        sender: 'Tú',
                        senderType: 'user',
                        language: 'en',
                        requiresTranslation: false,
                        content: userTranslations[message.id],
                        officialTranslation: null,
                        contentHtml: '',
                        contentMarkdown: '',
                        keyPoints: [],
                      }}
                      showFeedbackButton={feedbackAvailable[message.id]}
                      onFeedbackClick={(messageId) => {
                        const trans = allTranslations.find(
                          (t) => t.messageId === messageId
                        );
                        if (trans) setSelectedFeedback(trans);
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isProcessing && !isSkipping && (
            <div className='flex justify-end py-2 animate-in fade-in slide-in-from-bottom-2 duration-300'>
              <TypingIndicator />
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      <footer className='sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4'>
        <div className='max-w-4xl mx-auto'>
          {needsTranslation ? (
            <TranslationInput
              onSubmit={handleTranslation}
              onSkip={handleSkip}
              isLoading={isProcessing}
              disabled={isProcessing || !canInteract}
            />
          ) : (
            <div className='flex justify-center'>
              <Button
                onClick={handleNext}
                disabled={isProcessing || !canInteract}
                className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </footer>

      {/* Feedback Modal */}
      {selectedFeedback && selectedFeedback.feedback && (
        <div className='fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50'>
          <div
            className='bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg md:max-w-3xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto'
            role='dialog'
            aria-labelledby='feedback-title'
          >
            <h3
              id='feedback-title'
              className='text-lg font-bold text-gray-900 dark:text-white mb-4'
            >
              Retroalimentación
            </h3>

            {selectedFeedback.feedback ? (
              <div className='space-y-6'>
                {/* Comparison Section */}
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='border-l-4 border-gray-300 dark:border-gray-600 pl-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-r'>
                    <h4 className='font-bold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide mb-1'>
                      Tu traducción
                    </h4>
                    <p className='text-gray-800 dark:text-gray-200 text-sm italic'>
                      &quot;{selectedFeedback.userTranslation}&quot;
                    </p>
                  </div>
                  <div className='border-l-4 border-blue-500 pl-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-r'>
                    <h4 className='font-bold text-blue-700 dark:text-blue-300 text-xs uppercase tracking-wide mb-1'>
                      Oficial
                    </h4>
                    <p className='text-blue-900 dark:text-blue-100 text-sm'>
                      &quot;{selectedFeedback.officialTranslation}&quot;
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className='flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700'>
                  <div className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                    {selectedFeedback.feedback.score}
                    <span className='text-base font-normal text-gray-400'>
                      /100
                    </span>
                  </div>
                  <div className='text-sm text-gray-600 dark:text-gray-400 leading-tight'>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedFeedback.feedback.analysis}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Detailed Analysis Categories */}
                {selectedFeedback.feedback.detailedAnalysis && (
                  <div className='space-y-4 text-sm'>
                    <div className='space-y-1'>
                      <h5 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                        📖 Gramática
                      </h5>
                      <div className='text-gray-600 dark:text-gray-400 text-xs'>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedFeedback.feedback.detailedAnalysis.grammar ||
                            'Sin comentarios.'}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <h5 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                        🗣️ Vocabulario
                      </h5>
                      <div className='text-gray-600 dark:text-gray-400 text-xs'>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedFeedback.feedback.detailedAnalysis
                            .vocabulary || 'Sin comentarios.'}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <h5 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                        🏗️ Construcción
                      </h5>
                      <div className='text-gray-600 dark:text-gray-400 text-xs'>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedFeedback.feedback.detailedAnalysis
                            .construction || 'Sin comentarios.'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phrasal Verbs Section */}
                {selectedFeedback.feedback.phrasalVerbs?.relevant && (
                  <div className='bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3'>
                    <h5 className='font-bold text-indigo-700 dark:text-indigo-300 text-sm mb-2 flex items-center gap-2'>
                      ✨ Boost your fluency: Phrasal Verbs
                    </h5>
                    <ul className='space-y-1'>
                      {selectedFeedback.feedback.phrasalVerbs.suggestions.map(
                        (sug, i) => (
                          <li
                            key={i}
                            className='text-sm text-indigo-900 dark:text-indigo-100 pl-4 relative before:content-["•"] before:absolute before:left-1 before:text-indigo-400'
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <>{children}</>,
                              }}
                            >
                              {sug}
                            </ReactMarkdown>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* General Suggestions */}
                {selectedFeedback.feedback.suggestions.length > 0 && (
                  <div>
                    <h5 className='font-semibold text-gray-900 dark:text-white text-sm mb-2'>
                      💡 Tips extra
                    </h5>
                    <ul className='space-y-2'>
                      {selectedFeedback.feedback.suggestions.map(
                        (suggestion, idx) => (
                          <li
                            key={idx}
                            className='text-sm text-gray-600 dark:text-gray-300 pl-5 relative before:content-["✓"] before:absolute before:left-0 before:text-green-500'
                          >
                            <span className='inline-block'>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => <>{children}</>,
                                }}
                              >
                                {suggestion}
                              </ReactMarkdown>
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Differences Section */}
                {selectedFeedback.feedback.differences && (
                  <div>
                    <h5 className='font-semibold text-gray-900 dark:text-white text-sm mb-2'>
                      🔍 Diferencias Clave
                    </h5>
                    <div className='text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg'>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedFeedback.feedback.differences}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                <div className='pt-2 flex justify-end'>
                  <Button
                    onClick={() => setSelectedFeedback(null)}
                    className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 text-white'
                  >
                    Entendido
                  </Button>
                </div>
              </div>
            ) : (
              <div className='text-center py-6'>
                <p className='text-gray-600 dark:text-gray-400'>
                  No hay retroalimentación disponible
                </p>
                <Button
                  onClick={() => setSelectedFeedback(null)}
                  variant='outline'
                  className='mt-4 bg-transparent w-full sm:w-auto'
                >
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
