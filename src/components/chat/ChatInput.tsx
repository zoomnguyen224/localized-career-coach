'use client'

import { useState } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isDisabled = isLoading || input.trim().length === 0

  return (
    <div className="p-4 border-t border-border bg-white">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Tell me about your background and career goals..."
          className="flex-1 px-3 py-2 border border-border rounded-[8px] text-sm focus:outline-none focus:ring-1 focus:ring-blue disabled:bg-gray-50 disabled:text-muted resize-none"
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={isDisabled}
          aria-label="Send message"
          className="px-4 py-2 bg-blue text-white rounded-[8px] font-semibold text-sm hover:bg-blue/90 disabled:bg-gray-200 disabled:text-muted transition-colors h-fit flex-shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  )
}
