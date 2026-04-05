'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { UserProfile } from '@/types'

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [threadId] = useState(() => crypto.randomUUID())

  const handleProfileUpdate = (update: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...update }))
  }

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
