'use client'

import { useRef, useState, useCallback, KeyboardEvent, forwardRef, useImperativeHandle } from 'react'
import { Send } from 'lucide-react'
import { extractTextFromFile } from '@/lib/pdf-utils'

export interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  onCVUpload?: (text: string, fileName: string) => void
}

export interface ChatInputHandle {
  insertText: (text: string) => void
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({ onSend, isLoading, onCVUpload }, ref) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      setValue(text)
      setTimeout(() => textareaRef.current?.focus(), 0)
    },
  }))

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onCVUpload) return
    e.target.value = ''
    try {
      const text = await extractTextFromFile(file)
      if (text.trim()) onCVUpload(text, file.name)
    } catch {
      onCVUpload(`[Could not extract text from ${file.name}. Please paste your CV text directly.]`, file.name)
    }
  }

  const isDisabled = isLoading || !value.trim()

  return (
    <div className="bg-white border-t border-border px-4 py-3 flex items-end gap-2">
      {/* Hidden file input */}
      <input
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Paperclip button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-muted hover:text-blue transition-colors p-1.5 rounded-[8px] hover:bg-blue/10 flex-shrink-0"
        aria-label="Upload CV"
        title="Upload CV"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.414 6.586a6 6 0 008.485 8.485L20.5 13" />
        </svg>
      </button>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder="Tell me about your background and career goals..."
        rows={1}
        className="flex-1 resize-none focus:outline-none border border-border focus:border-blue focus:ring-1 focus:ring-blue/30 rounded-[10px] bg-white px-3 py-2 text-sm leading-6"
        style={{ minHeight: '40px', maxHeight: '96px', overflowY: 'auto' }}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={isDisabled}
        className={`flex-shrink-0 p-2 rounded-[14px] transition-colors ${
          isDisabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue hover:bg-blue/90 text-white'
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
})
