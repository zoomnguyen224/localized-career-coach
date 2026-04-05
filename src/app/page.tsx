'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { UserProfile } from '@/types'

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [threadId, setThreadId] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('localized_thread_id')
    const id = stored ?? crypto.randomUUID()
    if (!stored) localStorage.setItem('localized_thread_id', id)
    setThreadId(id)
  }, [])

  const handleProfileUpdate = (update: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...update }))
  }

  if (!threadId) return null

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar profile={userProfile} />
        <ChatInterface
          threadId={threadId}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  )
}
