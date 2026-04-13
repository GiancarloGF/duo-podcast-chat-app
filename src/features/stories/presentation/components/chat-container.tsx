'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';
import { StoryChatCompletion } from '@/features/stories/presentation/components/StoryChatCompletion';
import { ErrorAlert } from '@/features/stories/presentation/components/error-alert';
import { FeedbackModal } from '@/features/stories/presentation/components/feedback-modal';
import { MessageBubble } from '@/features/stories/presentation/components/message-bubble';
import { TranslationInput } from '@/features/stories/presentation/components/translation-input';
import { useStoryChatSession } from '@/features/stories/presentation/hooks/useStoryChatSession';
import { Button } from '@/shared/presentation/components/ui/button';

interface ChatContainerProps {
  initialEpisode: Episode;
  initialUserProgress: UserProgress;
}

// Presentation shell for the story chat. State transitions live in the hook so
// this component can focus on layout, boundaries, and wiring callbacks.
export function ChatContainer({
  initialEpisode,
  initialUserProgress,
}: ChatContainerProps) {
  const router = useRouter();
  const {
    aiError,
    canInteract,
    currentEpisodeMessage,
    displayedMessages,
    episodeComplete,
    handleNext,
    handleTranslation,
    isProcessing,
    needsTranslation,
    scrollRef,
    selectedFeedback,
    setAiError,
    setSelectedFeedback,
    userProgress,
  } = useStoryChatSession({
    episode: initialEpisode,
    initialUserProgress,
  });

  if (episodeComplete) {
    return (
      <StoryChatCompletion
        episode={initialEpisode}
        userProgress={userProgress}
        onBackToStories={() => router.push('/stories')}
      />
    );
  }

  return (
    <div className='min-h-screen flex flex-col'>
      <header className='bg-card border-b-2 border-border p-4 sticky top-0 z-40'>
        <div className='max-w-4xl mx-auto space-y-3 flex gap-4 sm:gap-6 items-start'>
          <Link href='/stories'>
            <Button variant='outline' size='sm' className='gap-2 shrink-0'>
              <ChevronLeft className='w-4 h-4' aria-hidden='true' />
              <span className='hidden sm:inline'>Atrás</span>
            </Button>
          </Link>

          <div className='flex flex-col gap-2 w-full'>
            <h1 className='sm:text-lg font-black text-foreground leading-tight line-clamp-2 min-w-0 flex-1'>
              {initialEpisode.title || 'Episodio'}
            </h1>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-xs text-muted-foreground font-semibold uppercase shrink-0'>
                Mensaje {userProgress.currentMessageIndex + 1} de{' '}
                {initialEpisode.messages.length}
              </p>
              <div className='flex items-center gap-3 min-w-0'>
                <span className='text-xs font-bold text-foreground min-w-10 text-right'>
                  {Math.round(
                    ((userProgress.currentMessageIndex + 1) /
                      initialEpisode.messages.length) *
                      100,
                  )}
                  %
                </span>
                <div className='w-24 sm:w-32'>
                  <div className='w-full bg-muted rounded-lg h-3 border-2 border-border'>
                    <div
                      className='bg-primary h-full transition-all'
                      style={{
                        width: `${
                          ((userProgress.currentMessageIndex + 1) /
                            initialEpisode.messages.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {aiError ? (
        <div className='bg-card border-b-2 border-border p-4'>
          <ErrorAlert
            message={aiError}
            onDismiss={() => setAiError(null)}
            autoDismiss={true}
            dismissAfter={5000}
          />
        </div>
      ) : null}

      <div className='flex-1 overflow-y-auto p-0 sm:p-4 space-y-4 pb-safe md:pb-4'>
        <div className='max-w-4xl mx-auto w-full pb-20 md:pb-20'>
          {displayedMessages.map((message) => (
            <div key={message.id} className='mb-4'>
              <MessageBubble
                message={message}
                showFeedbackButton={!!message.translationFeedback}
                onFeedbackClick={() =>
                  message.translationFeedback &&
                  setSelectedFeedback(message.translationFeedback)
                }
              >
                {needsTranslation &&
                !message.isValidating &&
                currentEpisodeMessage?.id === message.episodeMessageId ? (
                  <TranslationInput
                    onSubmit={handleTranslation}
                    isLoading={isProcessing}
                    disabled={isProcessing || !canInteract}
                  />
                ) : null}
              </MessageBubble>
            </div>
          ))}

          <div ref={scrollRef} />
        </div>
      </div>

      <footer className='fixed md:sticky bottom-0 left-0 right-0 bg-card border-t-2 border-border p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:pb-6 z-50'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex justify-center'>
            <Button
              onClick={() => void handleNext()}
              disabled={isProcessing || !canInteract}
              className='min-w-36 sm:text-lg'
            >
              Continuar
            </Button>
          </div>
        </div>
      </footer>

      {selectedFeedback ? (
        <FeedbackModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          isOpen={true}
        />
      ) : null}
    </div>
  );
}
