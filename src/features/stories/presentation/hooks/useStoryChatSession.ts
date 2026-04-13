'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { ChatMessage } from '@/features/stories/domain/types';
import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { Interaction } from '@/features/stories/domain/entities/Interaction';
import type { TranslationFeedback } from '@/features/stories/domain/entities/TranslationFeedback';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';
import {
  submitTranslation,
  updateProgress,
} from '@/features/stories/presentation/actions';

interface UseStoryChatSessionParams {
  episode: Episode;
  initialUserProgress: UserProgress;
}

interface UseStoryChatSessionResult {
  aiError: string | null;
  canInteract: boolean;
  currentEpisodeMessage: Episode['messages'][number] | null;
  displayedMessages: ChatMessage[];
  episodeComplete: boolean;
  handleNext: () => Promise<void>;
  handleTranslation: (translation: string) => Promise<void>;
  isProcessing: boolean;
  needsTranslation: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  selectedFeedback: TranslationFeedback | null;
  setAiError: (value: string | null) => void;
  setSelectedFeedback: (value: TranslationFeedback | null) => void;
  userProgress: UserProgress;
  validatingMessageId: string | null;
}

// Encapsulate the chat flow state machine for story practice. The container stays
// mostly presentational while this hook coordinates progress updates and feedback.
export function useStoryChatSession({
  episode,
  initialUserProgress,
}: UseStoryChatSessionParams): UseStoryChatSessionResult {
  const [userProgress, setUserProgress] =
    useState<UserProgress>(initialUserProgress);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] =
    useState<TranslationFeedback | null>(null);
  const [validatingMessageId, setValidatingMessageId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentMessageIndex = userProgress.currentMessageIndex;
  const isProcessing = isPending;

  useEffect(() => {
    // Scroll after new content appears so the latest message or input stays visible.
    if (!scrollRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentMessageIndex, isProcessing]);

  const displayedMessages = useMemo(() => {
    // Rebuild the visible transcript from the immutable episode script plus the
    // interactions already recorded by the user.
    const messages: ChatMessage[] = [];
    const interactionsMap = new Map<string, Interaction>();

    if (userProgress.interactions) {
      userProgress.interactions.forEach((interaction) =>
        interactionsMap.set(interaction.messageId, interaction),
      );
    }

    const limit = Math.min(currentMessageIndex + 1, episode.messages.length);

    for (let index = 0; index < limit; index += 1) {
      const episodeMessage = episode.messages[index];
      const interaction = interactionsMap.get(episodeMessage.id);

      messages.push({
        id: episodeMessage.id,
        episodeMessageId: episodeMessage.id,
        sender: episodeMessage.sender,
        message: episodeMessage,
        content: episodeMessage.content,
        isUserMessage: false,
        translationFeedback: interaction?.translationFeedback,
        isValidating: validatingMessageId === episodeMessage.id && !interaction,
        timestamp: Date.now(),
      });
    }

    return messages;
  }, [currentMessageIndex, episode.messages, userProgress, validatingMessageId]);

  const currentEpisodeMessage = useMemo(() => {
    if (currentMessageIndex >= episode.messages.length) {
      return null;
    }

    return episode.messages[currentMessageIndex];
  }, [currentMessageIndex, episode.messages]);

  const episodeComplete = currentMessageIndex >= episode.messages.length;
  const needsTranslation =
    !episodeComplete && currentEpisodeMessage?.language === 'es';
  const canInteract = !isPending && !episodeComplete;

  const handleTranslation = useCallback(
    async (translation: string): Promise<void> => {
      if (!canInteract || !currentEpisodeMessage) {
        return;
      }

      setValidatingMessageId(currentEpisodeMessage.id);
      setAiError(null);
      startTransition(async () => {
        try {
          // Validation is optimistic in the UI but still persisted through the
          // server action after local state moves forward.
          const result = await submitTranslation(
            translation,
            currentEpisodeMessage.officialTranslation ?? '',
            currentEpisodeMessage.content,
          );

          if (!result.success || !result.feedback) {
            setAiError(result.message ?? 'Error desconocido');
            return;
          }

          const newInteraction: Interaction = {
            messageId: currentEpisodeMessage.id,
            userInput: translation,
            translationFeedback: result.feedback,
            isCorrect: true,
            timestamp: new Date(),
          };

          const nextIndex = (userProgress.currentMessageIndex ?? 0) + 1;
          const nextStatus =
            nextIndex >= episode.messages.length ? 'completed' : 'started';

          setUserProgress((previous) => ({
            ...previous,
            currentMessageIndex: nextIndex,
            interactions: [...(previous.interactions ?? []), newInteraction],
            status: nextStatus,
            lastActiveAt: new Date(),
          }));

          await updateProgress(
            episode.id,
            nextIndex,
            nextStatus,
            newInteraction,
          );
        } catch (error) {
          console.error('Error submitting translation:', error);
          setAiError('Error de conexión. Intenta de nuevo.');
        } finally {
          setValidatingMessageId(null);
        }
      });
    },
    [canInteract, currentEpisodeMessage, episode.id, episode.messages.length, startTransition, userProgress.currentMessageIndex],
  );

  const handleNext = useCallback(async (): Promise<void> => {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      try {
        // Messages that do not require translation can advance immediately while
        // still persisting the new index on the server.
        const nextIndex = (userProgress.currentMessageIndex ?? 0) + 1;
        const nextStatus =
          nextIndex >= episode.messages.length ? 'completed' : 'started';

        setUserProgress((previous) => ({
          ...previous,
          currentMessageIndex: nextIndex,
          status: nextStatus,
          lastActiveAt: new Date(),
        }));

        await updateProgress(episode.id, nextIndex, nextStatus);
      } catch (error) {
        console.error('Error next:', error);
      }
    });
  }, [episode.id, episode.messages.length, isPending, startTransition, userProgress.currentMessageIndex]);

  return {
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
    validatingMessageId,
  };
}
