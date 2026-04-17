'use client'

import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ChatMessage, SkillGapResult } from '@/types'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'

interface ChatInterfaceProps {
  threadId: string
  onProfileUpdate: (profile: unknown) => void
  onSkillGapResult: (result: SkillGapResult | null) => void
  onCVUploaded: (cv: unknown) => void
  onTitleGenerated: (title: string) => void
}

interface SSEEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'error'
  content?: string
  message?: string
  name?: string
  id?: string
  result?: unknown
}

export function ChatInterface({
  threadId,
  onProfileUpdate,
  onSkillGapResult,
  onCVUploaded,
  onTitleGenerated,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: 'مرحباً! I am your AI Career Coach. Tell me about your background, experience, and career goals, and I will help you find the perfect opportunity.',
      toolResults: [],
      segments: [
        {
          type: 'text',
          content:
            'مرحباً! I am your AI Career Coach. Tell me about your background, experience, and career goals, and I will help you find the perfect opportunity.',
        },
      ],
    },
  ])

  const [isLoading, setIsLoading] = useState(false)
  const toolResultsRef = useRef<Map<string, { toolName: string; status: string; result: unknown }>>(
    new Map()
  )

  const streamAgentResponse = async (messages: ChatMessage[]) => {
    setIsLoading(true)

    try {
      // Fire-and-forget title generation
      fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, messages }),
      }).catch(() => {
        // Silently fail
      })

      // Main chat response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, messages }),
      })

      if (!response.ok || !response.body) {
        setIsLoading(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessageId = uuidv4()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines[lines.length - 1]

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i]
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') {
              setIsLoading(false)
              continue
            }

            try {
              const event: SSEEvent = JSON.parse(dataStr)

              if (event.type === 'text' && event.content) {
                setMessages((prev) => {
                  const updated = [...prev]
                  let assistantMsg = updated.find((m) => m.id === assistantMessageId)

                  if (!assistantMsg) {
                    assistantMsg = {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: event.content || '',
                      toolResults: [],
                      segments: [{ type: 'text', content: event.content || '' }],
                    }
                    updated.push(assistantMsg)
                  } else {
                    assistantMsg.content += event.content
                    if (assistantMsg.segments[0].type === 'text') {
                      assistantMsg.segments[0].content += event.content
                    }
                  }

                  return updated
                })
              } else if (event.type === 'tool_call' && event.name && event.id) {
                toolResultsRef.current.set(event.id, {
                  toolName: event.name,
                  status: 'loading',
                  result: null,
                })

                setMessages((prev) => {
                  const updated = [...prev]
                  let assistantMsg = updated.find((m) => m.id === assistantMessageId)

                  if (!assistantMsg) {
                    assistantMsg = {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: '',
                      toolResults: [
                        {
                          id: event.id!,
                          toolName: event.name!,
                          status: 'loading',
                          result: null,
                        },
                      ],
                      segments: [{ type: 'tool', toolResultId: event.id! }],
                    }
                    updated.push(assistantMsg)
                  } else {
                    assistantMsg.toolResults = assistantMsg.toolResults || []
                    assistantMsg.toolResults.push({
                      id: event.id!,
                      toolName: event.name!,
                      status: 'loading',
                      result: null,
                    })
                    assistantMsg.segments.push({ type: 'tool', toolResultId: event.id! })
                  }

                  return updated
                })
              } else if (event.type === 'tool_result' && event.id && event.name) {
                toolResultsRef.current.set(event.id, {
                  toolName: event.name,
                  status: 'done',
                  result: event.result,
                })

                // Call appropriate handler
                if (event.name === 'update_profile' && event.result) {
                  onProfileUpdate(event.result)
                } else if (event.name === 'skill_gap_analysis' && event.result) {
                  onSkillGapResult(event.result as SkillGapResult)
                } else if (event.name === 'upload_cv' && event.result) {
                  onCVUploaded(event.result)
                } else if (event.name === 'generate_title' && event.result) {
                  onTitleGenerated((event.result as { title?: string }).title || '')
                }

                setMessages((prev) => {
                  const updated = [...prev]
                  const assistantMsg = updated.find((m) => m.id === assistantMessageId)

                  if (assistantMsg && assistantMsg.toolResults) {
                    const toolResult = assistantMsg.toolResults.find((tr) => tr.id === event.id)
                    if (toolResult) {
                      toolResult.status = 'done'
                      toolResult.result = event.result
                    }
                  }

                  return updated
                })
              } else if (event.type === 'error' && event.message) {
                setMessages((prev) => {
                  const updated = [...prev]
                  let assistantMsg = updated.find((m) => m.id === assistantMessageId)

                  if (!assistantMsg) {
                    assistantMsg = {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: event.message || '',
                      toolResults: [],
                      segments: [{ type: 'text', content: event.message || '' }],
                    }
                    updated.push(assistantMsg)
                  } else {
                    assistantMsg.content = event.message || ''
                  }

                  return updated
                })
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setIsLoading(false)
    }
  }

  const handleSendMessage = (text: string) => {
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      toolResults: [],
      segments: [{ type: 'text', content: text }],
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    streamAgentResponse(updatedMessages)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-[12px] shadow-sm">
      <MessageList messages={messages} />
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  )
}
