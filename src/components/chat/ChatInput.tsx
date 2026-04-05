'use client'

import { useRef, useState, useCallback, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

export interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isLoading, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)

    // Auto-resize: reset then grow up to 4 rows
    const textarea = e.target
    textarea.style.height = 'auto'
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
    const maxHeight = lineHeight * 4
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px'
  }

  const isDisabled = isLoading || !value.trim()

  return (
    <div className="bg-white border-t px-4 py-3 flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder="Tell me about your background and career goals..."
        rows={1}
        className="flex-1 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 border border-gray-200 rounded-lg px-3 py-2 text-sm leading-6"
        style={{ minHeight: '40px', maxHeight: '96px', overflowY: 'auto' }}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={isDisabled}
        className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
          isDisabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-teal-500 text-white hover:bg-teal-600'
        }`}
        aria-label="Send message"
      >
        {isLoading ? (
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
