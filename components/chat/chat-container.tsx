'use client';

import { ErrorAlert } from '@/components/chat/error-alert';
import { TranslationInput } from '@/components/chat/translation-input';
import { Button } from '@/components/ui/button';
import { submitTranslation } from '@/lib/actions/submit-translation';
import { updateProgress } from '@/lib/actions/update-progress';
import type {
  ChatMessage,
  Episode,
  Interaction,
  TranslationFeedback,
  UserProgress,
} from '@/lib/types';
import { ChevronLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';

import ReactMarkdown from 'react-markdown';
import { FeedbackModal } from './feedback-modal';
// import remarkGfm from 'remark-gfm';

interface ChatContainerProps {
  initialEpisode: Episode;
  initialUserProgress: UserProgress;
  userId: string; // Needed for server action
}

export function ChatContainer({
  initialEpisode,
  initialUserProgress,
  userId,
}: ChatContainerProps) {
  const router = useRouter();

  // Initialize state from props
  const [userProgress, setUserProgress] =
    useState<UserProgress>(initialUserProgress);

  // If no progress, we assume index 0 (handled by rendering logic null check)
  const currentMessageIndex = userProgress.currentMessageIndex;

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] =
    useState<TranslationFeedback | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentMessageIndex, isProcessing]);

  // --- INTERLEAVING LOGIC ---
  const displayedMessages = useMemo(() => {
    const messages: ChatMessage[] = [];
    const interactionsMap = new Map<string, Interaction>();

    if (userProgress.interactions) {
      userProgress.interactions.forEach((i) =>
        interactionsMap.set(i.messageId, i)
      );
    }

    // Determine how many messages to show.
    // Show messages up to currentMessageIndex.
    // If completed, show all.
    const limit = Math.min(
      currentMessageIndex + 1,
      initialEpisode.messages.length
    );

    // If we are at the end, maybe show all (handled by loop condition)

    for (let i = 0; i < limit; i++) {
      const episodeMessage = initialEpisode.messages[i];

      // 1. Original Message Bubble
      messages.push({
        id: episodeMessage.id,
        episodeMessageId: episodeMessage.id,
        sender: episodeMessage.sender,
        message: episodeMessage,
        content: episodeMessage.content,
        isUserMessage: false,
        timestamp: Date.now(),
      });

      // 2. User Interaction Bubble (if exists)
      const interaction = interactionsMap.get(episodeMessage.id);
      if (interaction) {
        messages.push({
          id: `user-${episodeMessage.id}`,
          episodeMessageId: episodeMessage.id,
          sender: 'Tú', // Or User name
          content: interaction.userInput,
          isUserMessage: true,
          translationFeedback: interaction.translationFeedback,
          timestamp: interaction.timestamp
            ? new Date(interaction.timestamp).getTime()
            : Date.now(),
        });
      }
    }
    return messages;
  }, [initialEpisode.messages, userProgress, currentMessageIndex]);

  const currentEpisodeMessage = useMemo(() => {
    if (currentMessageIndex >= initialEpisode.messages.length) return null;
    return initialEpisode.messages[currentMessageIndex];
  }, [initialEpisode.messages, currentMessageIndex]);

  const episodeComplete = currentMessageIndex >= initialEpisode.messages.length;

  const needsTranslation = useMemo(
    () => !episodeComplete && currentEpisodeMessage?.language === 'es',
    [episodeComplete, currentEpisodeMessage]
  );

  const canInteract = !isProcessing && !episodeComplete;

  // --- ACTIONS ---

  const handleTranslation = useCallback(
    async (translation: string) => {
      if (!canInteract || !currentEpisodeMessage) return;

      setIsProcessing(true);
      setAiError(null);

      try {
        // 1. Get AI Feedback
        const result = await submitTranslation(
          translation,
          currentEpisodeMessage.officialTranslation || '',
          currentEpisodeMessage.content
        );

        if (!result.success || !result.feedback) {
          setAiError(result.message || 'Error desconocido');
          return;
        }

        // 2. Construct Interaction Object
        const newInteraction: Interaction = {
          messageId: currentEpisodeMessage.id,
          userInput: translation,
          translationFeedback: result.feedback,
          isCorrect: true,
          timestamp: new Date(),
        };

        // 3. Persist Progress
        const nextIndex = (userProgress.currentMessageIndex || 0) + 1;
        const nextStatus =
          nextIndex >= initialEpisode.messages.length ? 'completed' : 'started';

        // Optimistic Update
        setUserProgress((prev) => ({
          ...prev,
          currentMessageIndex: nextIndex,
          interactions: [...(prev.interactions || []), newInteraction],
          status: nextStatus,
          lastActiveAt: new Date(),
        }));

        // Server Update
        await updateProgress(
          userId,
          initialEpisode.id,
          nextIndex,
          nextStatus,
          newInteraction
        );
      } catch (error) {
        console.error('Error submitting translation:', error);
        setAiError('Error de conexión. Intenta de nuevo.');
        // Revert optimistic update if needed? For now, we leave it as error banner handles it.
      } finally {
        setIsProcessing(false);
      }
    },
    [
      canInteract,
      currentEpisodeMessage,
      initialEpisode.id,
      userId,
      initialEpisode.messages.length,
      userProgress.currentMessageIndex,
    ]
  );

  const handleSkip = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const nextIndex = (userProgress.currentMessageIndex || 0) + 1;
      const nextStatus =
        nextIndex >= initialEpisode.messages.length ? 'completed' : 'started';

      // Optimistic Update
      setUserProgress((prev) => ({
        ...prev,
        currentMessageIndex: nextIndex,
        status: nextStatus,
        lastActiveAt: new Date(),
      }));

      // Server Update (No interaction recorded for skip currently, or maybe empty one?)
      // User requirement didn't specify, assuming just index update.
      await updateProgress(userId, initialEpisode.id, nextIndex, nextStatus);
    } catch (error) {
      console.error('Error skipping:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    userProgress.currentMessageIndex,
    initialEpisode.messages.length,
    userId,
    initialEpisode.id,
    isProcessing,
  ]);

  const handleNext = useCallback(async () => {
    // Same logic as Skip for now
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const nextIndex = (userProgress.currentMessageIndex || 0) + 1;
      const nextStatus =
        nextIndex >= initialEpisode.messages.length ? 'completed' : 'started';

      setUserProgress((prev) => ({
        ...prev,
        currentMessageIndex: nextIndex,
        status: nextStatus,
        lastActiveAt: new Date(),
      }));

      await updateProgress(userId, initialEpisode.id, nextIndex, nextStatus);
    } catch (error) {
      console.error('Error next:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    userProgress.currentMessageIndex,
    initialEpisode.messages.length,
    userId,
    initialEpisode.id,
    isProcessing,
  ]);

  // --- RENDER HELPERS ---

  const renderCompletionScreen = () => {
    // Calculate stats from userProgress
    const stats = userProgress?.interactions.reduce(
      (acc, curr) => {
        if (curr.userInput) acc.completed++;
        else acc.skipped++;
        // Logic for skipped is fuzzy in new schema, assuming empty input = skipped
        return acc;
      },
      { completed: 0, skipped: 0 }
    ) || { completed: 0, skipped: 0 };

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
            </div>
            {/* Simple Stats Display */}
            <div className='flex justify-center gap-8 mb-8'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {stats.completed}
                </div>
                <div className='text-sm text-gray-500'>Traducciones</div>
              </div>
              {/* 
                <div className='text-center'>
                    <div className='text-2xl font-bold text-orange-600'>{stats.skipped}</div>
                    <div className='text-sm text-gray-500'>Saltadas</div>
                </div>
                 */}
            </div>

            <div className='space-y-3 flex flex-col'>
              <Button onClick={() => router.push('/')} className='w-full'>
                <Home className='w-4 h-4 mr-2' />
                Volver al Inicio
              </Button>
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
      <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900'>
        <div className='max-w-4xl mx-auto w-full pb-20'>
          {displayedMessages.map((msg) => (
            <div key={msg.id} className='mb-4'>
              <MessageBubble
                message={msg}
                showFeedbackButton={!!msg.translationFeedback}
                onFeedbackClick={() =>
                  msg.translationFeedback &&
                  setSelectedFeedback(msg.translationFeedback)
                }
              />
            </div>
          ))}

          {/* Loading Indicator */}
          {isProcessing && (
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

      {/* Feedback Modal Re-implementation or Reuse */}
      {selectedFeedback && (
        <FeedbackModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          isOpen={!!selectedFeedback}
        />
        // <div className='fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50'>
        //   <div className='bg-white dark:bg-slate-800 p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto'>
        //     <h3 className='text-xl font-bold mb-4 dark:text-white'>Feedback</h3>
        //     <div className='prose dark:prose-invert'>
        //       {/* Render feedback content. Assuming selectedFeedback has chat-like structure with translationFeedback */}
        //       {selectedFeedback.translationFeedback && (
        //         <div>
        //           <p>
        //             <strong>Score:</strong>{' '}
        //             {selectedFeedback.translationFeedback.score}
        //           </p>
        //           <ReactMarkdown>
        //             {selectedFeedback.translationFeedback.analysis}
        //           </ReactMarkdown>
        //           {/* Add more fields as needed */}
        //         </div>
        //       )}
        //     </div>
        //     <Button className='mt-4' onClick={() => setSelectedFeedback(null)}>
        //       Cerrar
        //     </Button>
        //   </div>
        // </div>
      )}
    </div>
  );
}
