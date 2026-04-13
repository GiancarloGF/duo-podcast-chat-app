'use client';

import { useRouter } from 'next/navigation';
import type { Episode } from '@/features/stories/domain/entities/Episode';
import { StoryChatCompletion } from '@/features/stories/presentation/components/StoryChatCompletion';
import { ErrorAlert } from '@/features/stories/presentation/components/error-alert';
import { FeedbackModal } from '@/features/stories/presentation/components/feedback-modal';
import { MessageBubble } from '@/features/stories/presentation/components/message-bubble';
import { TranslationInput } from '@/features/stories/presentation/components/translation-input';
import { useStoryChatSessionContext } from '@/features/stories/presentation/components/StoryChatSessionProvider';

interface StoryChatBodyProps {
  episode: Episode;
}

export function StoryChatBody({ episode }: StoryChatBodyProps) {
  const router = useRouter();
  const {
    aiError,
    canInteract,
    currentEpisodeMessage,
    displayedMessages,
    episodeComplete,
    handleTranslation,
    isProcessing,
    needsTranslation,
    scrollRef,
    selectedFeedback,
    setAiError,
    setSelectedFeedback,
    userProgress,
  } = useStoryChatSessionContext();

  if (episodeComplete) {
    return (
      <main className='flex-1 p-4'>
        <StoryChatCompletion
          episode={episode}
          userProgress={userProgress}
          onBackToStories={() => router.push('/stories')}
        />
      </main>
    );
  }

  return (
    <>
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

      <main className='flex-1 overflow-y-auto p-0 sm:p-4 space-y-4 pb-safe md:pb-4'>
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
      </main>

      {selectedFeedback ? (
        <FeedbackModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          isOpen={true}
        />
      ) : null}
    </>
  );
}
