'use client'

import { useState } from 'react'
import { ChatMessage, UserProfile } from '@/types'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'

interface ChatInterfaceProps {
  threadId: string
  onProfileUpdate: (profile: Partial<UserProfile>) => void
}

const initialWelcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `مرحباً! I'm your Localized AI Career Coach, specialized in MENA job markets and emerging career opportunities across the GCC.\n\nTo get started, tell me about yourself:\n• What's your educational background or current field?\n• Which country are you based in?\n• What role or industry are you targeting?\n\nI'll map your skill gaps, build a personalized learning path, and connect you with the right mentors from our expert network.`,
  toolResults: []
}

export function ChatInterface({ threadId, onProfileUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (content: string) => {
    // 1. Build updated messages array with the new user message appended
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      toolResults: []
    }
    const updatedMessages = [...messages, userMessage]

    // 2. Set isLoading = true
    setIsLoading(true)

    // 3. Add user message to state
    // 4. Add empty assistant message with id = Date.now().toString()
    const assistantId = (Date.now() + 1).toString()
    const emptyAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolResults: []
    }
    setMessages([...updatedMessages, emptyAssistant])

    // 5. POST to /api/chat with { messages: updatedMessages, threadId }
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMessages, threadId })
    })

    // 6. Read response as a ReadableStream
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        // 7. For each SSE line:
        if (trimmed === 'data: [DONE]') {
          setIsLoading(false)
          continue
        }

        if (!trimmed.startsWith('data: ')) continue

        let event: { type: string; content?: string; name?: string; id?: string; result?: unknown; message?: string }
        try {
          event = JSON.parse(trimmed.slice('data: '.length))
        } catch {
          continue
        }

        setMessages(prev => {
          const next = [...prev]
          const last = { ...next[next.length - 1] }
          next[next.length - 1] = last

          if (event.type === 'text' && event.content) {
            last.content = last.content + event.content
          } else if (event.type === 'tool_call' && event.id && event.name) {
            last.toolResults = [
              ...last.toolResults,
              { id: event.id, toolName: event.name, status: 'loading', result: null }
            ]
          } else if (event.type === 'tool_result' && event.id) {
            last.toolResults = last.toolResults.map(tr =>
              tr.id === event.id
                ? { ...tr, status: 'done', result: event.result ?? null }
                : tr
            )
            if (event.name === 'update_profile') {
              onProfileUpdate(event.result as Partial<UserProfile>)
            }
          } else if (event.type === 'error' && event.message) {
            last.content = last.content + event.message
          }

          return next
        })
      }
    }

    // Handle any remaining buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim()
      if (trimmed === 'data: [DONE]') {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
      <MessageList messages={messages} />
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  )
}
