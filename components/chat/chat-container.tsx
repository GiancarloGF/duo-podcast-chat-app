'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/types';
import { MessageBubble } from './message-bubble';

interface ChatContainerProps {
  messages: Message[];
  userTranslations: Record<string, string>;
  feedbackAvailable: Record<string, boolean>;
  onFeedbackClick: (messageId: string) => void;
  isLoading?: boolean;
}

export function ChatContainer({
  messages,
  userTranslations,
  feedbackAvailable,
  onFeedbackClick,
  isLoading = false,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }, [messages, userTranslations]);

  return (
    <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900'>
      <div className='max-w-4xl mx-auto w-full'>
        {messages.map((message, idx) => {
          // Show original message
          return (
            <div key={`original-${message.id}`}>
              <MessageBubble message={message} />

              {/* Show user translation if exists */}
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
                      // messageType: 'translation', // Removed as it's not in Message type
                    }}
                    showFeedbackButton={feedbackAvailable[message.id]}
                    onFeedbackClick={onFeedbackClick}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className='flex justify-center py-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400'></div>
          </div>
        )}
      </div>

      {/* Scroll anchor */}
      <div ref={scrollRef} />
    </div>
  );
}
