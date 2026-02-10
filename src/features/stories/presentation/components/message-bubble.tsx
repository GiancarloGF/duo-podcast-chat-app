'use client';

import type { ChatMessage } from '@/features/stories/domain/types';
import { cn } from '@/shared/presentation/utils';
import { useState, useMemo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Languages, Sparkles } from 'lucide-react';

import { WordDefinitionModal } from './word-definition-modal';

interface MessageBubbleProps {
  message: ChatMessage;
  showFeedbackButton?: boolean;
  onFeedbackClick?: (messageId: string) => void;
  children?: ReactNode;
}

// Token type for text tokenization
type Token = {
  type: 'word' | 'non-word';
  text: string;
  sentence?: string; // The sentence containing this token (only for word tokens)
};

// Sentence boundary information
type SentenceBoundary = {
  start: number;
  end: number;
  text: string;
};

// Function to find sentence boundaries in text
function findSentenceBoundaries(text: string): SentenceBoundary[] {
  const boundaries: SentenceBoundary[] = [];
  // Match sentences ending with . ! ? followed by space, newline, or end of string
  // Also handle cases where punctuation might be followed by quotes or other punctuation
  const sentenceRegex = /[^.!?\n]*[.!?]+[\s"')]*/g;
  let match;
  let lastEnd = 0;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;
    const sentenceText = text.slice(start, end).trim();

    if (sentenceText.length > 0) {
      boundaries.push({
        start: start,
        end: end,
        text: sentenceText,
      });
    }
    lastEnd = end;
  }

  // Handle remaining text that doesn't end with sentence punctuation
  if (lastEnd < text.length) {
    const remaining = text.slice(lastEnd).trim();
    if (remaining.length > 0) {
      boundaries.push({
        start: lastEnd,
        end: text.length,
        text: remaining,
      });
    }
  }

  // If no sentences found (e.g., text without punctuation), return the whole text
  if (boundaries.length === 0) {
    return [
      {
        start: 0,
        end: text.length,
        text: text.trim(),
      },
    ];
  }

  return boundaries;
}

// Function to find which sentence a word belongs to
function findSentenceForWord(
  wordIndex: number,
  boundaries: SentenceBoundary[],
): string {
  for (const boundary of boundaries) {
    if (wordIndex >= boundary.start && wordIndex < boundary.end) {
      return boundary.text;
    }
  }
  // Fallback: return the first sentence or empty string
  return boundaries[0]?.text || '';
}

// Function to tokenize text into words and non-words with sentence information
function tokenizeText(text: string): Token[] {
  const tokens: Token[] = [];
  const wordRegex = /\p{L}+/gu; // Unicode letters (including accented characters)
  const sentenceBoundaries = findSentenceBoundaries(text);
  let lastIndex = 0;

  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    // Add non-word token before the word (if any)
    if (match.index > lastIndex) {
      tokens.push({
        type: 'non-word',
        text: text.slice(lastIndex, match.index),
      });
    }

    // Find the sentence containing this word
    const sentence = findSentenceForWord(match.index, sentenceBoundaries);

    // Add word token with sentence information
    tokens.push({
      type: 'word',
      text: match[0],
      sentence: sentence,
    });

    lastIndex = wordRegex.lastIndex;
  }

  // Add remaining non-word token at the end (if any)
  if (lastIndex < text.length) {
    tokens.push({
      type: 'non-word',
      text: text.slice(lastIndex),
    });
  }

  return tokens;
}

function ClickableWord({
  word,
  sentence,
  onWordClick,
}: {
  word: string;
  sentence?: string;
  onWordClick: (word: string, sentence: string) => void;
}) {
  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onWordClick(word, sentence || '');
  };

  return (
      <span
        onClick={handleClick}
        className='cursor-pointer transition-colors hover:text-primary hover:underline hover:decoration-dotted hover:underline-offset-2 focus-visible:underline focus-visible:decoration-dotted focus-visible:underline-offset-2'
        role='button'
        tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      {word}
    </span>
  );
}

// Clickable text renderer component
function ClickableTextRenderer({
  text,
  onWordClick,
}: {
  text: string;
  onWordClick: (word: string, sentence: string) => void;
}) {
  const tokens = useMemo(() => tokenizeText(text), [text]);

  return (
    <>
      {tokens.map((token, index) =>
        token.type === 'word' ? (
          <ClickableWord
            key={index}
            word={token.text}
            sentence={token.sentence}
            onWordClick={onWordClick}
          />
        ) : (
          <span key={index}>{token.text}</span>
        ),
      )}
    </>
  );
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
  children,
}: MessageBubbleProps) {
  const [isTranslated, setIsTranslated] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    sentence: string;
  } | null>(null);

  const isUserMessage = message.isUserMessage;
  const isHostMessage = message?.message?.senderType === 'host';
  const isProtagonistMessage = message?.message?.senderType === 'protagonist';

  // Get the first letter of the sender's name for the avatar
  const avatarInitial = (message?.message?.sender || '?')
    .charAt(0)
    .toUpperCase();

  // Consistent random-ish color for protagonist background
  const protagonistBgColor = useMemo(() => {
    if (isProtagonistMessage && message?.message?.sender)
      return stringToPastelColor(message.message.sender);
    return undefined;
  }, [message?.message?.sender, isProtagonistMessage]);

  // Consistent random-ish color for protagonist avatar
  const protagonistAvatarColor = useMemo(() => {
    if (isProtagonistMessage && message?.message?.sender)
      return stringToDarkColor(message.message.sender);
    return undefined;
  }, [message?.message?.sender, isProtagonistMessage]);

  // Avatar colors based on sender type
  const avatarClasses = cn(
    'w-8 h-8 rounded-[6px] border-2 border-border flex items-center justify-center text-white font-bold text-xs flex-shrink-0',
    isUserMessage && 'bg-foreground',
    isHostMessage && 'bg-primary',
    // Protagonist uses inline style for custom color
  );

  const bubbleClasses = cn(
    'break-words relative group/bubble', // Added group/bubble for hover effects if needed
    'w-full',
    isUserMessage
      ? 'bg-secondary text-secondary-foreground rounded-[10px] border-2 border-border px-5 py-3 shadow-[4px_4px_0_0_var(--color-border)]' // User: Pill
      : isProtagonistMessage
        ? 'text-gray-900 px-5 py-3 rounded-[10px] border-2 border-border shadow-[4px_4px_0_0_var(--color-border)]' // Protagonist: Pill (color applied via style)
        : 'bg-white text-gray-900 rounded-[10px] border-2 border-border px-5 py-3 shadow-[4px_4px_0_0_var(--color-border)]', // Host: Card style
  );

  const containerClasses = cn(
    'flex gap-3 items-start mb-4',
    isUserMessage && 'flex-row-reverse justify-start md:ml-auto',
    // In mobile, make messages full width
    'w-full',
  );

  const hasTranslation = !!message?.message?.officialTranslation;

  return (
    <div
      className={containerClasses}
      role='article'
      aria-label={`Mensaje de ${message?.message?.sender || 'Desconocido'}`}
    >
      {/* Avatar - Hidden on mobile */}
      <div
        className={cn(
          avatarClasses,
          isProtagonistMessage && 'text-white',
          'hidden md:flex',
        )}
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
          isUserMessage ? 'items-end' : 'items-start',
          'w-full',
        )}
      >
        {/* Sender Name - Show for all except User to identify Protagonists */}
        {!isUserMessage && (
          <div
            className='text-xs font-bold text-gray-700 dark:text-gray-300 ml-1'
            id={`sender-${message.id}`}
          >
            {message.sender || 'Desconocido'}
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
                className='p-1.5 rounded-[6px] border border-border bg-card hover:bg-secondary text-foreground transition-colors'
                title={isTranslated ? 'Ver original' : 'Ver traducción'}
              >
                <Languages size={14} />
              </button>
            </div>
          )}

          {/* Render Markdown Content */}
          <div className='text-base leading-relaxed [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>a]:underline [&>strong]:font-bold [&>em]:italic pr-6'>
            {isProtagonistMessage && !isTranslated ? (
              <ClickableTextRenderer
                text={
                  message?.message?.contentMarkdown ||
                  message?.message?.content ||
                  message.translationFeedback?.userTranslation ||
                  message.content ||
                  ''
                }
                onWordClick={(word, sentence) =>
                  setSelectedWord({ word, sentence })
                }
              />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {isTranslated
                  ? message?.message?.officialTranslation || ''
                  : message?.message?.contentMarkdown ||
                    message?.message?.content ||
                    message.translationFeedback?.userTranslation ||
                    message.content ||
                    ''}
              </ReactMarkdown>
            )}
          </div>

          {children ? (
            <div className='mt-3 border-t-2 border-border/20 pt-3'>{children}</div>
          ) : null}

          {/* Key Points Display - NOW INSIDE BUBBLE */}
          {message?.message?.keyPoints &&
            message?.message?.keyPoints?.length > 0 &&
            !isTranslated && (
              <div className='text-xs text-muted-foreground mt-3 pt-3 border-t-2 border-border/30'>
                <details className='cursor-pointer group/details'>
                    <summary className='font-bold uppercase focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring rounded-[4px] px-1 -ml-1 inline-flex items-center gap-1 hover:text-foreground transition-colors'>
                    Puntos clave
                  </summary>
                  <div className='mt-2 space-y-2'>
                    {message.message.keyPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className='text-xs border-l-2 border-primary/70 pl-2'
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
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <>{children}</>,
                              }}
                            >
                              {point.example}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          {/* Feedback Button & Score */}
          {message.isValidating && (
            <div className='mt-3 flex items-center gap-2 text-sm font-bold text-primary animate-pulse'>
              <Sparkles className='w-4 h-4' />
              <span>Validando traduccion...</span>
            </div>
          )}

          {showFeedbackButton && !message.isValidating && (
            <div className='flex items-center gap-2 mt-2'>
                <button
                  onClick={() => onFeedbackClick?.(message.id)}
                  className='text-xs font-bold uppercase text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-[4px] px-2 py-1'
                  aria-label={`Ver retroalimentación para el mensaje ${message.id}`}
                >
                  Ver feedback
                </button>
                {message.translationFeedback?.score !== undefined && (
                  <span className='text-xs font-bold text-muted-foreground select-none'>
                    {message.translationFeedback.score}/100
                  </span>
                )}
            </div>
          )}
        </div>
      </div>
      {selectedWord && (
        <WordDefinitionModal
          isOpen={!!selectedWord}
          onClose={() => setSelectedWord(null)}
          word={selectedWord.word}
          sentence={selectedWord.sentence}
        />
      )}
    </div>
  );
}
