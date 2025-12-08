'use client';

import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Languages } from 'lucide-react';

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
  const [isTranslated, setIsTranslated] = useState(false);
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
    'max-w-md break-words relative group/bubble', // Added group/bubble for hover effects if needed
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

  const hasTranslation = !!message.officialTranslation;

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
          {/* Header with Translate Button (Only if translation exists and NOT user message) */}
          {hasTranslation && !isUserMessage && (
            <div className='absolute top-2 right-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity'>
              <button
                onClick={() => setIsTranslated(!isTranslated)}
                className='p-1.5 rounded-full bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40 text-gray-700 dark:text-gray-200 transition-colors'
                title={isTranslated ? 'Ver original' : 'Ver traducción'}
              >
                <Languages size={14} />
              </button>
            </div>
          )}

          {/* Render Markdown Content */}
          <div className='text-[15px] leading-relaxed [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>a]:underline [&>strong]:font-bold [&>em]:italic pr-6'>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {isTranslated
                ? message.officialTranslation || ''
                : message.contentMarkdown || message.content}
            </ReactMarkdown>
          </div>

          {/* Key Points Display - NOW INSIDE BUBBLE */}
          {message.keyPoints &&
            message.keyPoints.length > 0 &&
            !isTranslated && (
              <div className='text-xs text-gray-600 dark:text-gray-300 mt-3 pt-3 border-t border-gray-400/20 dark:border-gray-500/30'>
                <details className='cursor-pointer group/details'>
                  <summary className='font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-1 -ml-1 inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors'>
                    Puntos clave
                  </summary>
                  <div className='mt-2 space-y-2'>
                    {message.keyPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className='text-xs border-l-2 border-blue-400/50 pl-2'
                      >
                        <div className='font-semibold'>
                          {point.word}{' '}
                          <span className='font-normal opacity-80'>
                            ({point.concept})
                          </span>
                        </div>
                        <div className='opacity-90'>{point.definition_es}</div>
                        {point.example && (
                          <div className='italic mt-0.5 opacity-75'>
                            {point.example}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

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
      </div>
    </div>
  );
}
