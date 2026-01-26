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
  const [pendingTranslation, setPendingTranslation] = useState<{
    content: string;
    episodeMessageId: string;
  } | null>(null);

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
      } else if (
        pendingTranslation &&
        pendingTranslation.episodeMessageId === episodeMessage.id
      ) {
        // Show pending translation ONLY for the specific message
        messages.push({
          id: `pending-${episodeMessage.id}`,
          episodeMessageId: episodeMessage.id,
          sender: 'Tú',
          content: pendingTranslation.content,
          isUserMessage: true,
          isValidating: true, // New flag
          timestamp: Date.now(),
        });
      }
    }
    return messages;
  }, [
    initialEpisode.messages,
    userProgress,
    currentMessageIndex,
    pendingTranslation,
  ]);

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
      setPendingTranslation({
        content: translation,
        episodeMessageId: currentEpisodeMessage.id,
      });
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
        setPendingTranslation(null);
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
        if (curr.userInput) {
          acc.completed++;
          if (curr.translationFeedback?.score) {
            acc.totalScore += curr.translationFeedback.score;
            acc.scoredCount++;
          }
        } else {
          acc.skipped++;
        }
        return acc;
      },
      { completed: 0, skipped: 0, totalScore: 0, scoredCount: 0 }
    ) || { completed: 0, skipped: 0, totalScore: 0, scoredCount: 0 };

    const averageScore =
      stats.scoredCount > 0
        ? Math.round(stats.totalScore / stats.scoredCount)
        : 0;

    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4 flex items-center justify-center'>
        <div className='max-w-md w-full'>
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden'>
            {/* Header Image */}
            <div className='relative h-48 w-full bg-gray-200 dark:bg-gray-700'>
              <img
                src={initialEpisode.imageUrl}
                alt={initialEpisode.title}
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-black/30 flex items-end p-6'>
                <div>
                  <div className='text-white/90 text-sm font-medium uppercase tracking-wider mb-1'>
                    Episodio Completado
                  </div>
                  <h1 className='text-2xl font-bold text-white leading-tight'>
                    {initialEpisode.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='p-6'>
              <div className='mb-6'>
                <h3 className='text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2'>
                  Resumen
                </h3>
                <p className='text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3'>
                  {initialEpisode.summaryText}
                </p>
              </div>

              {/* Stats Grid */}
              <div className='grid grid-cols-2 gap-4 mb-8'>
                <div className='bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center'>
                  <div className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                    {stats.completed}
                  </div>
                  <div className='text-xs font-medium text-blue-800 dark:text-blue-200 mt-1'>
                    Traducciones
                  </div>
                </div>
                <div className='bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 text-center'>
                  <div className='text-3xl font-bold text-violet-600 dark:text-violet-400'>
                    {averageScore}%
                  </div>
                  <div className='text-xs font-medium text-violet-800 dark:text-violet-200 mt-1'>
                    Precisión Media
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <Button
                  onClick={() => router.push('/')}
                  className='w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 py-6 text-lg'
                >
                  <Home className='w-5 h-5 mr-2' />
                  Volver al Inicio
                </Button>
              </div>
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

          <div className='flex items-center gap-3 shrink-0'>
            <span className='text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[2.5rem] text-right'>
              {Math.round(
                ((currentMessageIndex + 1) / initialEpisode.messages.length) *
                  100
              )}
              %
            </span>
            <div className='w-24 sm:w-32'>
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

      {/* Chat Area - Add padding bottom on mobile to account for fixed footer */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900 pb-safe md:pb-4'>
        <div className='max-w-4xl mx-auto w-full pb-20 md:pb-20'>
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

          {/* Loading Indicator - Only show if processing but NO pending translation (e.g. initial load or skip) 
              Actually, validting uses pendingTranslation, so we hide this for translation. 
              Maybe keep for 'skip' or 'next' if they take time? 
              For now only hide if there is a pending translation because that has its own indicator.
          */}
          {isProcessing && !pendingTranslation && (
            <div className='flex justify-end py-2 animate-in fade-in slide-in-from-bottom-2 duration-300'>
              <TypingIndicator />
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area - Fixed on mobile to stay above keyboard */}
      <footer className='fixed md:sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 pb-safe md:pb-4 z-50'>
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
