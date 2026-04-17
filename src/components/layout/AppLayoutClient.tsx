// src/components/layout/AppLayoutClient.tsx
'use client'

import { useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { ChatDrawer } from './ChatDrawer'

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] relative">
      <AppSidebar onOpenChat={() => setIsChatOpen(true)} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
