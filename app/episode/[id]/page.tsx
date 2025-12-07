'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type {
  Episode,
  Message,
  ChatMessage,
  UserTranslation,
} from '@/lib/types';
import { AIService } from '@/lib/ai-service';
import { ChatContainer } from '@/components/chat/chat-container';
import { TranslationInput } from '@/components/chat/translation-input';
import { ErrorAlert } from '@/components/chat/error-alert';
import { Button } from '@/components/ui/button';
import { ChevronLeft, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { useChatStore } from '@/lib/store/useChatStore';

export default function EpisodePage() {
  const params = useParams();
  const router = useRouter();
  const episodeId = params.id as string;

  const {
    episodes,
    chats,
    initializeChat,
    updateLocalChatProgress,
    syncChatToDB,
    loadData,
  } = useChatStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] =
    useState<UserTranslation | null>(null);

  // Derived state
  const episode = episodes.find((e) => e.id === episodeId);
  const chat = chats.find((c) => c.episodeId === episodeId);
  const loading = !episode; // If we have episodes, we are good. Chat might be loading/creating.

  useEffect(() => {
    // If deep linked and no data, load data
    if (episodes.length === 0) {
      loadData();
    }
  }, [episodes.length, loadData]);

  useEffect(() => {
    // Initialize chat if it doesn't exist and we have the episode
    if (episode && !chat && !isProcessing) {
      // Avoid infinite loop if init fails, maybe check a flag?
      // For now assume it works.
      const init = async () => {
        await initializeChat(episodeId);
      };
      init();
    }
  }, [episode, chat, episodeId, initializeChat, isProcessing]);

  if (loading || !episode) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4'>
        <div className='text-center'>
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4'
            aria-hidden='true'
          ></div>
          <p className='text-gray-600 dark:text-gray-400'>
            Cargando episodio...
          </p>
        </div>
      </div>
    );
  }

  // Calculate rendering state
  const progress = chat?.progress || 0;
  const currentMessageIndex = progress;
  const currentMessage = episode.messages[currentMessageIndex];
  const episodeComplete = currentMessageIndex >= episode.messages.length;

  const displayedMessages = episode.messages.slice(
    0,
    currentMessageIndex + (episodeComplete ? 0 : 1)
  );

  // Construct userTranslations map from Chat History
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

        // Reconstruct UserTranslation object for Feedback Modal
        // We need to find the original official translation
        const originalMsg = episode.messages.find(
          (m) => m.id === msg.episodeMessageId
        );
        allTranslations.push({
          messageId: msg.episodeMessageId,
          userTranslation: msg.message,
          officialTranslation: originalMsg?.officialTranslation || '',
          timestamp:
            typeof msg.timestamp === 'number' ? msg.timestamp : Date.now(),
          skipped: msg.message === '', // Assuming empty message is skip
          feedback: msg.translationFeedback,
        });
      }
    });
  }

  const needsTranslation =
    !episodeComplete &&
    currentMessage?.language === 'es' &&
    currentMessage?.requiresTranslation;

  const handleTranslation = async (translation: string) => {
    if (!currentMessage || !chat) return;

    setIsProcessing(true);
    setAiError(null);

    try {
      let feedback = null;
      // Only get feedback if actual translation provided
      if (translation) {
        feedback = await AIService.getFeedbackWithRetry(
          currentMessage.content,
          currentMessage.officialTranslation || '',
          translation
        );
      }

      const newMessages = [...chat.messages];

      // 1. Add User Message (if translation provided or skipped as empty)
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

      // 2. Add THE Episode Message to the chat history as well?
      // The requirement "Los mensajes que se han agregado al chat" implies it.
      // But displayedMessages is derived from Episode static data.
      // Storing it in Chat.messages is redundant for display but good for "Transcript" in DB.
      // I will add it for DB completeness but UI uses 'episode' static data for display to keep rich content.
      // We will add it as a "host" or "protagonist" message.
      const epMsgCopy: ChatMessage = {
        id: `ep-msg-copy-${Date.now()}`,
        episodeMessageId: currentMessage.id,
        sender: currentMessage.sender,
        message: currentMessage.content,
        isUserMessage: false,
        timestamp: Date.now(),
      };
      newMessages.push(epMsgCopy);

      const newProgress = currentMessageIndex + 1;
      const isComplete = newProgress >= episode.messages.length;

      // Optimistic update
      updateLocalChatProgress(chat._id || '', newProgress, newMessages);

      // Sync to DB
      await syncChatToDB(chat._id || '', {
        progress: newProgress,
        messages: newMessages,
        status: isComplete ? 'completed' : 'initialized',
      });
    } catch (error) {
      console.error('Error processing translation:', error);
      setAiError('Error procesando tu traducción. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    handleTranslation(''); // Treat as empty translation
  };

  const handleNext = () => {
    // For non-translation messages, just advance progress
    // And maybe add the message to history?
    if (!currentMessage || !chat) return;

    const newMessages = [...chat.messages];
    const epMsgCopy: ChatMessage = {
      id: `ep-msg-copy-${Date.now()}`,
      episodeMessageId: currentMessage.id,
      sender: currentMessage.sender,
      message: currentMessage.content,
      isUserMessage: false,
      timestamp: Date.now(),
    };
    newMessages.push(epMsgCopy);

    const newProgress = currentMessageIndex + 1;
    const isComplete = newProgress >= episode.messages.length;

    updateLocalChatProgress(chat._id || '', newProgress, newMessages);

    syncChatToDB(chat._id || '', {
      progress: newProgress,
      messages: newMessages,
      status: isComplete ? 'completed' : 'initialized',
    });
  };

  const handleRestartEpisode = async () => {
    if (!chat) return;
    updateLocalChatProgress(chat._id || '', 0, []);
    await syncChatToDB(chat._id || '', {
      progress: 0,
      messages: [],
      status: 'initialized',
    });
    setAiError(null);
  };

  if (episodeComplete) {
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
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4'>
        <div className='max-w-2xl mx-auto py-8 sm:py-12'>
          <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8 text-center'>
            <div className='mb-6'>
              <div
                className='text-5xl sm:text-6xl mb-4'
                aria-hidden='true'
              ></div>
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
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col'>
      {/* Header */}
      <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 sticky top-0 z-40'>
        <div className='max-w-4xl mx-auto flex items-center justify-between gap-4'>
          <div className='flex items-center gap-2 sm:gap-4 flex-1 min-w-0'>
            <Link href='/'>
              <Button variant='ghost' size='sm' className='gap-2 flex-shrink-0'>
                <ChevronLeft className='w-4 h-4' aria-hidden='true' />
                <span className='hidden sm:inline'>Atrás</span>
              </Button>
            </Link>
            <div className='min-w-0 flex-1'>
              <h1 className='font-bold text-gray-900 dark:text-white truncate'>
                {episode.title || 'Episodio'}
              </h1>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Mensaje {currentMessageIndex + 1} de {episode.messages.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='w-24 sm:w-32 flex-shrink-0'>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
              <div
                className='bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all'
                style={{
                  width: `${
                    ((currentMessageIndex + 1) / episode.messages.length) * 100
                  }%`,
                }}
                role='progressbar'
                aria-valuenow={
                  ((currentMessageIndex + 1) / episode.messages.length) * 100
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
          <div className='max-w-4xl mx-auto'>
            <ErrorAlert
              message={aiError}
              onDismiss={() => setAiError(null)}
              autoDismiss={true}
              dismissAfter={5000}
            />
          </div>
        </div>
      )}

      {/* Chat Area */}
      <ChatContainer
        messages={displayedMessages}
        userTranslations={userTranslations}
        feedbackAvailable={feedbackAvailable}
        onFeedbackClick={(messageId) => {
          const trans = allTranslations.find((t) => t.messageId === messageId);
          if (trans) setSelectedFeedback(trans);
        }}
        isLoading={isProcessing}
      />

      {/* Input Area */}
      <footer className='bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4'>
        <div className='max-w-4xl mx-auto'>
          {needsTranslation ? (
            <TranslationInput
              onSubmit={handleTranslation}
              onSkip={handleSkip}
              isLoading={isProcessing}
              disabled={isProcessing}
            />
          ) : (
            <div className='flex justify-center'>
              <Button
                onClick={handleNext}
                disabled={isProcessing}
                className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </footer>

      {/* Feedback Modal */}
      {selectedFeedback && (
        <div className='fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50'>
          <div
            className='bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto'
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
              <div className='space-y-4'>
                <div>
                  <h4 className='font-semibold text-gray-700 dark:text-gray-300 text-sm'>
                    Tu traducción:
                  </h4>
                  <p className='text-gray-600 dark:text-gray-400 text-sm mt-1 break-words'>
                    {selectedFeedback.userTranslation}
                  </p>
                </div>

                <div>
                  <h4 className='font-semibold text-gray-700 dark:text-gray-300 text-sm'>
                    Traducción oficial:
                  </h4>
                  <p className='text-gray-600 dark:text-gray-400 text-sm mt-1 break-words'>
                    {selectedFeedback.officialTranslation}
                  </p>
                </div>

                <div>
                  <h4 className='font-semibold text-gray-700 dark:text-gray-300 text-sm'>
                    Análisis:
                  </h4>
                  <p className='text-gray-600 dark:text-gray-400 text-sm mt-1 whitespace-pre-wrap break-words'>
                    {selectedFeedback.feedback.analysis}
                  </p>
                </div>

                {selectedFeedback.feedback.suggestions.length > 0 && (
                  <div>
                    <h4 className='font-semibold text-gray-700 dark:text-gray-300 text-sm'>
                      Sugerencias:
                    </h4>
                    <ul className='text-gray-600 dark:text-gray-400 text-sm mt-1 space-y-1 list-disc list-inside'>
                      {selectedFeedback.feedback.suggestions.map(
                        (suggestion, idx) => (
                          <li key={idx} className='break-words'>
                            {suggestion}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-4'>
                  <div>
                    <span className='text-xs text-gray-600 dark:text-gray-400'>
                      Puntuación:
                    </span>
                    <div className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                      {selectedFeedback.feedback.score}/100
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedFeedback(null)}
                    className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
                  >
                    Cerrar
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
