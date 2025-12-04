"use client"

import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: Message
  showFeedbackButton?: boolean
  onFeedbackClick?: (messageId: number) => void
}

export function MessageBubble({ message, showFeedbackButton = false, onFeedbackClick }: MessageBubbleProps) {
  const isUserMessage = message.senderType === "user"
  const isHostMessage = message.senderType === "host"
  const isProtagonistMessage = message.senderType === "protagonist"

  const bubbleClasses = cn(
    "rounded-lg px-4 py-3 max-w-2xl break-words",
    isUserMessage && "bg-orange-100 dark:bg-orange-900 text-gray-900 dark:text-white",
    isHostMessage && "bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-white",
    isProtagonistMessage && "bg-green-100 dark:bg-green-900 text-gray-900 dark:text-white",
  )

  const containerClasses = cn("flex gap-3", isUserMessage && "justify-end")

  return (
    <div className={containerClasses} role="article" aria-label={`Mensaje de ${message.sender}`}>
      <div className="flex flex-col gap-1 flex-1">
        {/* Sender Name */}
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400" id={`sender-${message.id}`}>
          {message.sender}
        </div>

        {/* Message Bubble */}
        <div className={bubbleClasses} role="region" aria-labelledby={`sender-${message.id}`}>
          <p className="text-sm leading-relaxed">{message.content}</p>

          {/* Feedback Button */}
          {showFeedbackButton && (
            <button
              onClick={() => onFeedbackClick?.(message.id)}
              className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              aria-label={`Ver retroalimentación para el mensaje ${message.id}`}
            >
              Ver feedback
            </button>
          )}
        </div>

        {/* Key Terms Display */}
        {message.keyTerms && message.keyTerms.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <details className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 group">
              <summary className="font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1">
                Términos clave
              </summary>
              <div className="ml-2 mt-1 space-y-1">
                {message.keyTerms.map((term, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-medium">{term.spanish}</span>
                    {" → "}
                    <span lang="en">{term.english}</span>
                    {term.explanation && (
                      <p className="text-gray-500 dark:text-gray-600 text-xs mt-0.5">{term.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
