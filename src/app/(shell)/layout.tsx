'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { TopBar } from '@/components/shell/TopBar'
import { WorkStrip, type WorkNavKey } from '@/components/shell/WorkStrip'
import { ChatDrawer } from '@/components/layout/ChatDrawer'

type NavKey = 'home' | 'jobs' | 'events'

function resolveNav(pathname: string): { top: NavKey; work: WorkNavKey } {
  if (pathname.startsWith('/jobs')) return { top: 'jobs', work: null }
  if (pathname.startsWith('/events')) return { top: 'events', work: null }
  if (pathname.startsWith('/dashboard')) return { top: 'home', work: 'dashboard' }
  if (pathname.startsWith('/applications')) return { top: 'home', work: 'applications' }
  if (pathname.startsWith('/cv')) return { top: 'home', work: 'cv' }
  if (pathname.startsWith('/interview')) return { top: 'home', work: 'interview' }
  return { top: 'home', work: null }
}

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { top, work } = resolveNav(pathname)
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <TopBar activeNav={top} onOpenChat={() => setIsChatOpen(true)} />
      <WorkStrip activeNav={work} />
      {children}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  )
}
