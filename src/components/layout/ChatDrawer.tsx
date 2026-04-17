// src/components/layout/ChatDrawer.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const threadIdRef = useRef(uuidv4())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text }
    const assistantId = uuidv4()

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ])
    setInput('')
    setIsLoading(true)

    const historyForApi = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi, threadId: threadIdRef.current }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') continue
          try {
            const event = JSON.parse(payload)
            if (event.type === 'text') {
              accumulated += event.content
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
              )
            }
          } catch {}
        }
      }
    } finally {
      setIsLoading(false)
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m)
      )
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/10 z-30" onClick={onClose} />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-[380px] bg-white border-l border-[#d8dbe4] shadow-2xl z-40 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#d8dbe4] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0052ff] to-[#03BA82] flex items-center justify-center text-xs">
              🌍
            </div>
            <div>
              <div className="text-[12px] font-extrabold text-[#0a0b0d]">Career Agent</div>
              <div className="text-[10px] text-[#03BA82] font-semibold">● Online</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#727998] hover:text-[#0a0b0d] transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">👋</div>
              <div className="text-[13px] font-bold text-[#0a0b0d]">Hi Ahmed!</div>
              <div className="text-[11px] text-[#727998] mt-1.5 leading-relaxed">
                Ask me anything about your job search — I can evaluate roles, draft outreach, and more.
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] text-[12px] leading-relaxed px-3 py-2 rounded-[10px] ${
                  msg.role === 'user'
                    ? 'bg-[#0052ff] text-white rounded-br-sm'
                    : 'bg-[#eef0f3] text-[#0a0b0d] rounded-bl-sm'
                }`}
              >
                {msg.content || (msg.isStreaming
                  ? <span className="inline-block w-4 text-center animate-pulse">●</span>
                  : ''
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#d8dbe4] flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask about your job search…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              disabled={isLoading}
              className="flex-1 border border-[#d8dbe4] rounded-[10px] px-3 py-2 text-[12px] text-[#0a0b0d] placeholder:text-[#8D96B4] outline-none focus:border-[#0052ff] disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-[#0052ff] text-white px-3 py-2 rounded-[10px] disabled:opacity-40 transition-opacity hover:bg-[#3a70e0]"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
