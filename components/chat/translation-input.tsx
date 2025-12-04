"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Send, SkipForward, AlertCircle } from "lucide-react"
import { TranslationValidator } from "@/lib/translation-service"

interface TranslationInputProps {
  onSubmit: (translation: string) => void
  onSkip: () => void
  isLoading: boolean
  disabled?: boolean
}

export function TranslationInput({ onSubmit, onSkip, isLoading, disabled = false }: TranslationInputProps) {
  const [translation, setTranslation] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setTranslation(value)

    if (value.trim()) {
      const validation = TranslationValidator.validate(value)
      setValidationErrors(validation.errors)
      setValidationWarnings(validation.warnings)
    } else {
      setValidationErrors([])
      setValidationWarnings([])
    }
  }

  const handleSubmit = () => {
    const validation = TranslationValidator.validate(translation)

    if (validation.isValid) {
      onSubmit(translation)
      setTranslation("")
      setValidationErrors([])
      setValidationWarnings([])
      inputRef.current?.focus()
    } else {
      setValidationErrors(validation.errors)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (TranslationValidator.validate(translation).isValid) {
        handleSubmit()
      }
    }
  }

  return (
    <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
      <label htmlFor="translation-input" className="text-sm text-gray-600 dark:text-gray-400 block">
        Escribe tu traducción al inglés:
      </label>

      <textarea
        id="translation-input"
        ref={inputRef}
        value={translation}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu traducción aquí..."
        disabled={isLoading || disabled}
        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-vertical min-h-20"
        rows={3}
        aria-describedby={validationErrors.length > 0 ? "validation-errors" : undefined}
        aria-invalid={validationErrors.length > 0}
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div
          id="validation-errors"
          className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300 space-y-1"
          role="alert"
        >
          {validationErrors.map((error, idx) => (
            <div key={idx} className="flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && !validationErrors.length && (
        <div
          className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300 space-y-1"
          role="status"
        >
          {validationWarnings.map((warning, idx) => (
            <div key={idx} className="flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Presiona Ctrl+Enter (o Cmd+Enter en Mac) para enviar
      </div>

      {/* Buttons */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <Button
          onClick={handleSubmit}
          disabled={!translation.trim() || isLoading || disabled || validationErrors.length > 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
          aria-label="Enviar traducción"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              Procesando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" aria-hidden="true" />
              Enviar
            </>
          )}
        </Button>

        <Button
          onClick={onSkip}
          disabled={isLoading || disabled}
          variant="outline"
          className="flex-1 bg-transparent sm:flex-none"
          aria-label="Saltar esta traducción"
        >
          <SkipForward className="w-4 h-4 mr-2" aria-hidden="true" />
          Saltar
        </Button>
      </div>
    </div>
  )
}
