'use client'

import { useState, useRef } from 'react'
import { ChatMessage, UserProfile } from '@/types'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { StarterCards } from '@/components/chat/StarterCards'
import { extractTextFromFile } from '@/lib/pdf-utils'

interface ChatInterfaceProps {
  threadId: string
  onProfileUpdate: (profile: Partial<UserProfile>) => void
}

const initialWelcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `مرحباً! I'm your **Localized AI Career Coach**, specialized in MENA job markets and career opportunities across the GCC.\n\nUpload your CV for instant analysis, or tell me about your background and goals — I'll map your skill gaps, build a learning path, and connect you with expert mentors.`,
  toolResults: []
}

export function ChatInterface({ threadId, onProfileUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage])
  const [isLoading, setIsLoading] = useState(false)
  const [showStarterCards, setShowStarterCards] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const text = await extractTextFromFile(file)
      if (text.trim()) handleCVUpload(text, file.name)
    } catch {
      handleCVUpload(`[Could not extract text from ${file.name}. Please paste your CV text directly.]`, file.name)
    }
  }

  const sendMessage = async (content: string) => {
    setShowStarterCards(false)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      toolResults: []
    }
    const updatedMessages = [...messages, userMessage]
    setIsLoading(true)
    const assistantId = (Date.now() + 1).toString()
    const emptyAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolResults: []
    }
    setMessages([...updatedMessages, emptyAssistant])

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMessages, threadId })
    })

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
        if (trimmed === 'data: [DONE]') { setIsLoading(false); continue }
        if (!trimmed.startsWith('data: ')) continue
        let event: { type: string; content?: string; name?: string; id?: string; result?: unknown; message?: string }
        try { event = JSON.parse(trimmed.slice('data: '.length)) } catch { continue }
        setMessages(prev => {
          const next = [...prev]
          const last = { ...next[next.length - 1] }
          next[next.length - 1] = last
          if (event.type === 'text' && event.content) {
            last.content = last.content + event.content
          } else if (event.type === 'tool_call' && event.id && event.name) {
            last.toolResults = [...last.toolResults, { id: event.id, toolName: event.name, status: 'loading', result: null }]
          } else if (event.type === 'tool_result' && event.id) {
            last.toolResults = last.toolResults.map(tr =>
              tr.id === event.id ? { ...tr, status: 'done', result: event.result ?? null } : tr
            )
            if (event.name === 'update_profile') onProfileUpdate(event.result as Partial<UserProfile>)
            if (event.name === 'parse_resume') {
              const r = event.result as { profile?: Partial<UserProfile> }
              if (r?.profile) onProfileUpdate(r.profile)
            }
          } else if (event.type === 'error' && event.message) {
            last.content = last.content + event.message
          }
          return next
        })
      }
    }
    if (buffer.trim() === 'data: [DONE]') setIsLoading(false)
  }

  const handleCVUpload = async (text: string, fileName: string) => {
    setShowStarterCards(false)
    const cvMessage = `I've uploaded my CV (${fileName}). Here is the content:\n\n${text.slice(0, 3000)}\n\nPlease analyze my background, extract my profile, then run a skill gap analysis for my target role.`
    await sendMessage(cvMessage)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bg">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      <MessageList messages={messages} />
      {showStarterCards && (
        <StarterCards
          onSend={sendMessage}
          onCVUpload={triggerFileUpload}
        />
      )}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        onCVUpload={handleCVUpload}
      />
    </div>
  )
}
