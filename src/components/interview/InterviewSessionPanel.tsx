'use client'

import { useState } from 'react'
import type { InterviewSession, PracticeQuestion, StarStory, CompanyProcess } from '@/types/interview'
import { CompanyIntelBanner } from './CompanyIntelBanner'
import { PracticeTab } from './PracticeTab'
import { StarStoriesTab } from './StarStoriesTab'
import { IntelTab } from './IntelTab'

type Tab = 'practice' | 'stories' | 'intel'

interface InterviewSessionPanelProps {
  session: InterviewSession | null
  demoQuestions: PracticeQuestion[]
  starStories: StarStory[]
  process?: CompanyProcess
}

export function InterviewSessionPanel({
  session,
  demoQuestions,
  starStories,
  process,
}: InterviewSessionPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('practice')

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
        <div className="text-4xl">🎯</div>
        <div className="text-[14px] font-bold text-[#0a0b0d]">Select an interview to prepare</div>
        <div className="text-[12px] text-[#727998]">Choose a company from your upcoming interviews</div>
      </div>
    )
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'practice', label: 'Practice' },
    { id: 'stories', label: 'STAR Stories' },
    { id: 'intel', label: 'Company Intel' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5">
      <CompanyIntelBanner company={session.company} role={session.role} process={process} />

      <div className="flex gap-1 bg-[#eef0f3] rounded-[10px] p-1 mb-5 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-[11px] font-bold py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-[#0052ff] shadow-sm'
                : 'text-[#727998] hover:text-[#0a0b0d]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'practice' && (
        <PracticeTab session={session} demoQuestions={demoQuestions} />
      )}
      {activeTab === 'stories' && (
        <StarStoriesTab stories={starStories} />
      )}
      {activeTab === 'intel' && (
        <IntelTab company={session.company} />
      )}
    </div>
  )
}
