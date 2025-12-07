'use client';

import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
  showFeedbackButton?: boolean;
  onFeedbackClick?: (messageId: string) => void;
}

// Function to generate consistent pastel colors from a string
function stringToPastelColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360; // Hue: 0-360
  return `hsl(${h}, 70%, 90%)`; // Pastel color: high saturation, high lightness
}

function stringToDarkColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 30%)`; // Darken for text consistency if needed, or just use black/gray
}

export function MessageBubble({
  message,
  showFeedbackButton = false,
  onFeedbackClick,
}: MessageBubbleProps) {
  const isUserMessage = message.senderType === 'user';
  const isHostMessage = message.senderType === 'host';
  const isProtagonistMessage = message.senderType === 'protagonist';

  // Get the first letter of the sender's name for the avatar
  const avatarInitial = message.sender.charAt(0).toUpperCase();

  // Consistent random-ish color for protagonist background
  const protagonistBgColor = useMemo(() => {
    if (isProtagonistMessage) return stringToPastelColor(message.sender);
    return undefined;
  }, [message.sender, isProtagonistMessage]);

  // Consistent random-ish color for protagonist avatar
  const protagonistAvatarColor = useMemo(() => {
    if (isProtagonistMessage) return stringToDarkColor(message.sender);
    return undefined;
  }, [message.sender, isProtagonistMessage]);

  // Avatar colors based on sender type
  const avatarClasses = cn(
    'w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0',
    isUserMessage && 'bg-gray-900 dark:bg-gray-600',
    isHostMessage && 'bg-blue-600 dark:bg-blue-500'
    // Protagonist uses inline style for custom color
  );

  const bubbleClasses = cn(
    'max-w-md break-words',
    isUserMessage
      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-3xl px-5 py-3' // User: Pill
      : isProtagonistMessage
      ? 'text-gray-900 px-5 py-3 rounded-3xl' // Protagonist: Pill (color applied via style)
      : 'px-0 py-1 text-gray-900 dark:text-gray-100' // Host: Text-only
  );

  const containerClasses = cn(
    'flex gap-3 items-start mb-4',
    isUserMessage && 'flex-row-reverse justify-start ml-auto'
  );

  return (
    <div
      className={containerClasses}
      role='article'
      aria-label={`Mensaje de ${message.sender}`}
    >
      {/* Avatar */}
      <div
        className={cn(avatarClasses, isProtagonistMessage && 'text-white')}
        aria-hidden='true'
        style={
          isProtagonistMessage
            ? { backgroundColor: protagonistAvatarColor }
            : undefined
        }
      >
        {avatarInitial}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-1',
          isUserMessage ? 'items-end' : 'items-start'
        )}
      >
        {/* Sender Name - Show for all except User to identify Protagonists */}
        {!isUserMessage && (
          <div
            className='text-xs font-bold text-gray-700 dark:text-gray-300 ml-1'
            id={`sender-${message.id}`}
          >
            {message.sender}
          </div>
        )}

        {/* Message Bubble/Text */}
        <div
          className={bubbleClasses}
          role='region'
          aria-labelledby={`sender-${message.id}`}
          style={
            isProtagonistMessage
              ? { backgroundColor: protagonistBgColor }
              : undefined
          }
        >
          {/* Render Markdown Content */}
          <div className='text-[15px] leading-relaxed [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>a]:underline [&>strong]:font-bold [&>em]:italic'>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.contentMarkdown || message.content}
            </ReactMarkdown>
          </div>

          {/* Feedback Button */}
          {showFeedbackButton && (
            <button
              onClick={() => onFeedbackClick?.(message.id)}
              className='mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1'
              aria-label={`Ver retroalimentación para el mensaje ${message.id}`}
            >
              Ver feedback
            </button>
          )}
        </div>

        {/* Key Points Display */}
        {message.keyPoints && message.keyPoints.length > 0 && (
          <div className='text-xs text-gray-500 dark:text-gray-400 mt-1 pl-1'>
            <details className='cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 group'>
              <summary className='font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1'>
                Puntos clave
              </summary>
              <div className='ml-2 mt-1 space-y-2'>
                {message.keyPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className='text-xs border-l-2 border-blue-200 dark:border-blue-800 pl-2'
                  >
                    <div className='font-semibold text-blue-600 dark:text-blue-400'>
                      {point.word}{' '}
                      <span className='text-gray-400 font-normal'>
                        ({point.concept})
                      </span>
                    </div>
                    <div className='text-gray-600 dark:text-gray-300'>
                      {point.definition_es}
                    </div>
                    {point.example && (
                      <div className='text-gray-500 italic mt-0.5'>
                        {point.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
