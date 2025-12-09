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

export default function EpisodePage() {
  const params = useParams();
  const router = useRouter();
  const episodeId = params.id as string;

  // Use targeted selectors to get only what we need and prevent unnecessary re-renders
  const episode = useChatStore((state) =>
    state.episodes.find((e) => e.id === episodeId)
  );
  const chat = useChatStore((state) =>
    state.chats.find((c) => c.episodeId === episodeId)
  );
  const episodesLength = useChatStore((state) => state.episodes.length);
  const initializeChat = useChatStore((state) => state.initializeChat);
  const updateLocalChatProgress = useChatStore(
    (state) => state.updateLocalChatProgress
  );
  const syncChatToDB = useChatStore((state) => state.syncChatToDB);
  const loadData = useChatStore((state) => state.loadData);
  const loadEpisodeWithChat = useChatStore(
    (state) => state.loadEpisodeWithChat
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false); // Track skip action specifically
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] =
    useState<UserTranslation | null>(null);
  const [isLoadingEpisodeData, setIsLoadingEpisodeData] = useState(false);
  const loadingRef = useRef(false); // Track if a load is in progress
  const loadedEpisodeIdRef = useRef<string | null>(null); // Track which episode we've loaded

  // Loading if episode doesn't exist or if we're currently loading episode data
  const loading = !episode || isLoadingEpisodeData;

  // Derived values for stable comparison
  const episodeHasMessages = episode?.messages && episode.messages.length > 0;
  const episodeMessagesLength = episode?.messages?.length ?? 0;
  const chatExists = !!chat;

  useEffect(() => {
    // If deep linked and no data, load summary first
    if (episodesLength === 0) {
      loadData();
    }
  }, [episodesLength, loadData]);

  useEffect(() => {
    // Reset loaded ref if episodeId changes
    if (loadedEpisodeIdRef.current !== episodeId) {
      loadedEpisodeIdRef.current = null;
      loadingRef.current = false;
    }

    // Get current state inside effect to avoid stale closures
    const state = useChatStore.getState();
    const currentEpisode = state.episodes.find((e) => e.id === episodeId);
    const currentEpisodeHasMessages =
      currentEpisode?.messages && currentEpisode.messages.length > 0;

    // Skip if we've already loaded this episode and it has messages
    if (
      loadedEpisodeIdRef.current === episodeId &&
      currentEpisodeHasMessages
    ) {
      return;
    }

    // Load episode with chat in a single call if:
    // 1. Episode doesn't exist OR
    // 2. Episode exists but doesn't have messages
    // And we're not already loading
    const needsLoading = !currentEpisode || !currentEpisodeHasMessages;

    // Prevent multiple simultaneous calls
    if (needsLoading && !isLoadingEpisodeData && !loadingRef.current) {
      loadingRef.current = true;
      setIsLoadingEpisodeData(true);
      loadEpisodeWithChat(episodeId)
        .then((result) => {
          if (result) {
            loadedEpisodeIdRef.current = episodeId;
            // If chat doesn't exist after loading, initialize it
            if (!result.chat) {
              // Small delay to ensure state is updated
              setTimeout(() => {
                initializeChat(episodeId);
              }, 50);
            }
          }
        })
        .catch((error) => {
          console.error('Error loading episode with chat:', error);
          loadedEpisodeIdRef.current = null; // Reset on error so we can retry
        })
        .finally(() => {
          setIsLoadingEpisodeData(false);
          loadingRef.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]); // Only depend on episodeId to prevent infinite loops

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
  // Only mark as complete if:
  // 1. Episode has messages loaded (episode.messages.length > 0)
  // 2. Current message index is >= total messages
  // 3. Chat status is 'completed' (to avoid showing completion screen for new chats)
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

    const isSkipAction = !translation;
    if (isSkipAction) setIsSkipping(true);
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

      // 1. Add User Message (ONLY if translation provided)
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
      setIsSkipping(false);
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
                  <div className='grid gap-4 sm:grid-cols-3 text-sm'>
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

                {/* Phrasal Verbs Section - Only if relevant */}
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
