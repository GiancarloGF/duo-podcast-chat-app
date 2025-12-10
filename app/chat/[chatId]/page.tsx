'use client';

import { useEffect, useState, useRef } from 'react';
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;

  // Use targeted selectors
  const chat = useChatStore((state) =>
    state.chats.find((c) => (c._id || c.id) === chatId)
  );
  const episode = useChatStore((state) =>
    chat ? state.episodes.find((e) => e.id === chat.episodeId) : undefined
  );
  const loadChatById = useChatStore((state) => state.loadChatById);
  const loadEpisodeById = useChatStore((state) => state.loadEpisodeById);
  const updateLocalChatProgress = useChatStore(
    (state) => state.updateLocalChatProgress
  );
  const syncChatToDB = useChatStore((state) => state.syncChatToDB);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] =
    useState<UserTranslation | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingEpisode, setIsLoadingEpisode] = useState(false);

  // Loading states
  const isLoading = isLoadingChat || isLoadingEpisode;
  const isEpisodeReady =
    episode && episode.messages && episode.messages.length > 0;
  const canInteract = isEpisodeReady && !isLoading;

  // Load chat by ID
  useEffect(() => {
    if (!chat && !isLoadingChat) {
      setIsLoadingChat(true);
      loadChatById(chatId)
        .then((loadedChat) => {
          if (!loadedChat) {
            console.error('Chat not found');
            router.push('/');
          }
        })
        .catch((error) => {
          console.error('Error loading chat:', error);
          router.push('/');
        })
        .finally(() => {
          setIsLoadingChat(false);
        });
    }
  }, [chatId, chat, isLoadingChat, loadChatById, router]);

  // Load episode after chat is loaded
  useEffect(() => {
    if (!chat || !chat.episodeId) return;

    const currentEpisode = useChatStore
      .getState()
      .episodes.find((e) => e.id === chat.episodeId);
    const currentEpisodeHasMessages =
      currentEpisode?.messages && currentEpisode.messages.length > 0;

    if (currentEpisodeHasMessages) return;

    if (!currentEpisodeHasMessages && !isLoadingEpisode) {
      setIsLoadingEpisode(true);
      loadEpisodeById(chat.episodeId)
        .then((loadedEpisode) => {
          if (!loadedEpisode) {
            console.error('Failed to load episode');
          }
        })
        .catch((error) => {
          console.error('Error loading episode:', error);
        })
        .finally(() => {
          setIsLoadingEpisode(false);
        });
    }
  }, [chat?.episodeId, isLoadingEpisode, loadEpisodeById]);

  // Show loading screen
  if (isLoading || !chat || !episode || !isEpisodeReady) {
    let loadingMessage = 'Cargando...';
    if (isLoadingChat) {
      loadingMessage = 'Cargando chat...';
    } else if (isLoadingEpisode || !isEpisodeReady) {
      loadingMessage = 'Cargando episodio...';
    }

    return (
      <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4'>
        <div className='text-center'>
          <div
            className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4'
            aria-hidden='true'
          ></div>
          <p className='text-gray-600 dark:text-gray-400'>{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Calculate rendering state
  const progress = chat?.progress || 0;
  const currentMessageIndex = progress;
  const currentMessage = episode.messages[currentMessageIndex];
  const episodeComplete =
    episode.messages.length > 0 &&
    currentMessageIndex >= episode.messages.length &&
    chat?.status === 'completed';

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

        const originalMsg = episode.messages.find(
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

  const needsTranslation =
    !episodeComplete &&
    currentMessage?.language === 'es' &&
    currentMessage?.requiresTranslation;

  const handleTranslation = async (translation: string) => {
    if (!canInteract || !currentMessage || !chat) return;

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

      const newMessages = [...chat.messages];

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

      const newProgress = currentMessageIndex + 1;
      const isComplete = newProgress >= episode.messages.length;

      updateLocalChatProgress(
        chat._id || '',
        newProgress,
        newMessages,
        isComplete ? 'completed' : 'initialized'
      );

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
      setIsSkipping(false);
    }
  };

  const handleSkip = () => {
    if (!canInteract) return;
    handleTranslation('');
  };

  const handleNext = () => {
    if (!canInteract) return;
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

    updateLocalChatProgress(
      chat._id || '',
      newProgress,
      newMessages,
      isComplete ? 'completed' : 'initialized'
    );

    syncChatToDB(chat._id || '', {
      progress: newProgress,
      messages: newMessages,
      status: isComplete ? 'completed' : 'initialized',
    });
  };

  const handleRestartEpisode = async () => {
    if (!chat) return;
    updateLocalChatProgress(chat._id || '', 0, [], 'initialized');
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
      <div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4'>
        <div className='max-w-2xl mx-auto py-8 sm:py-12'>
          <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8 text-center'>
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
                {episode.title || 'Episodio'}
              </h1>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Mensaje {currentMessageIndex + 1} de {episode.messages.length}
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
        isLoading={isProcessing && !isSkipping}
      />

      {/* Input Area */}
      <footer className='bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4'>
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
      {selectedFeedback && (
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
