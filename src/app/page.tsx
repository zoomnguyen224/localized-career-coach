'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { UserProfile, SkillGapResult, CVAttachment, ChatMessage } from '@/types'
import {
  getConversations,
  createConversation,
  updateTitle,
  deleteConversation,
  setActiveThreadId,
  getActiveThreadId,
  ConversationMeta,
} from '@/lib/conversation-store'

function deriveSkillGapResult(messages: ChatMessage[]): SkillGapResult | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    for (const tr of messages[i].toolResults ?? []) {
      if (tr.toolName === 'skill_gap_analysis' && tr.status === 'done') {
        return tr.result as SkillGapResult
      }
    }
  }
  return null
}

function deriveCVAttachment(messages: ChatMessage[]): CVAttachment | null {
  for (const msg of messages) {
    if (msg.cvAttachment) return msg.cvAttachment
  }
  return null
}

function loadMessages(threadId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`localized_messages_${threadId}`)
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
  } catch {
    return []
  }
}

export default function Home() {
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const [activeThreadId, setActiveThreadIdState] = useState('')
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [skillGapResult, setSkillGapResult] = useState<SkillGapResult | null>(null)
  const [cvAttachment, setCvAttachment] = useState<CVAttachment | null>(null)

  useEffect(() => {
    let convs = getConversations()
    if (convs.length === 0) {
      convs = [createConversation()]
    }
    setConversations(convs)

    const storedActive = getActiveThreadId()
    const activeId =
      storedActive && convs.find(c => c.id === storedActive) ? storedActive : convs[0].id

    setActiveThreadId(activeId)
    setActiveThreadIdState(activeId) // cannot use syncActiveThread here (defined after useEffect)

    const msgs = loadMessages(activeId)
    setSkillGapResult(deriveSkillGapResult(msgs))
    setCvAttachment(deriveCVAttachment(msgs))
  }, [])

  const syncActiveThread = useCallback((id: string) => {
    setActiveThreadId(id)
    setActiveThreadIdState(id)
  }, [])

  const handleProfileUpdate = useCallback((update: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...update }))
  }, [])

  const handleSkillGapResult = useCallback((result: SkillGapResult) => {
    setSkillGapResult(result)
  }, [])

  const handleCVUploaded = useCallback((attachment: CVAttachment) => {
    setCvAttachment(attachment)
  }, [])

  const handleTitleGenerated = useCallback((id: string, title: string) => {
    updateTitle(id, title)
    setConversations(getConversations())
  }, [])

  const handleNewConversation = useCallback(() => {
    const conv = createConversation()
    syncActiveThread(conv.id)
    setConversations(getConversations())
    setUserProfile({})
    setSkillGapResult(null)
    setCvAttachment(null)
  }, [syncActiveThread])

  const handleSwitchConversation = useCallback((id: string) => {
    syncActiveThread(id)
    setUserProfile({})
    const msgs = loadMessages(id)
    setSkillGapResult(deriveSkillGapResult(msgs))
    setCvAttachment(deriveCVAttachment(msgs))
  }, [syncActiveThread])

  const handleDeleteConversation = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this conversation?')) return
      deleteConversation(id)
      const remaining = getConversations()
      if (remaining.length === 0) {
        const fresh = createConversation()
        syncActiveThread(fresh.id)
        setConversations([fresh])
        setUserProfile({})
        setSkillGapResult(null)
        setCvAttachment(null)
      } else {
        setConversations(remaining)
        setActiveThreadIdState(prev => {
          if (id === prev) {
            const next = remaining[0].id
            setActiveThreadId(next)
            setUserProfile({})
            const msgs = loadMessages(next)
            setSkillGapResult(deriveSkillGapResult(msgs))
            setCvAttachment(deriveCVAttachment(msgs))
            return next
          }
          return prev
        })
      }
    },
    [syncActiveThread]
  )

  if (!activeThreadId) return null

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          profile={userProfile}
          conversations={conversations}
          activeThreadId={activeThreadId}
          skillGapResult={skillGapResult}
          cvAttachment={cvAttachment}
          onNew={handleNewConversation}
          onSwitch={handleSwitchConversation}
          onDelete={handleDeleteConversation}
          onRename={handleTitleGenerated}
        />
        <ChatInterface
          key={activeThreadId}
          threadId={activeThreadId}
          onProfileUpdate={handleProfileUpdate}
          onSkillGapResult={handleSkillGapResult}
          onCVUploaded={handleCVUploaded}
          onTitleGenerated={handleTitleGenerated}
        />
      </div>
    </div>
  )
}
