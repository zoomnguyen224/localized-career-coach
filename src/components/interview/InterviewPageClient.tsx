// src/components/interview/InterviewPageClient.tsx
'use client'

import { useState } from 'react'
import type { InterviewSession } from '@/types/interview'
import { DEMO_SESSIONS, DEMO_QUESTIONS, DEMO_STAR_STORIES, DEMO_COMPANY_PROCESS } from '@/lib/interview'
import { InterviewSessionPanel } from './InterviewSessionPanel'

export function InterviewPageClient() {
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(
    DEMO_SESSIONS[0] ?? null
  )

  return (
    <div className="flex h-full">
      {/* Left column — session list */}
      <div className="w-[280px] flex-shrink-0 border-r border-[#DCDFE8] flex flex-col">
        <div className="px-5 pt-6 pb-4 border-b border-[#DCDFE8] flex-shrink-0">
          <h1 className="text-[15px] font-extrabold text-[#06123C]">Interview Prep</h1>
          <p className="text-[11px] text-[#727998] mt-0.5">{DEMO_SESSIONS.length} upcoming</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="text-[9px] font-bold text-[#8D96B4] uppercase tracking-wide px-2 mb-2">Upcoming</div>
          {DEMO_SESSIONS.map(session => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={`w-full text-left px-3 py-3 rounded-[10px] mb-1.5 transition-colors ${
                activeSession?.id === session.id
                  ? 'bg-[#ECF3FF]'
                  : 'hover:bg-[#F2F3F6]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FAA82C] to-[#F84E4E] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {session.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[12px] font-bold truncate ${activeSession?.id === session.id ? 'text-[#4584FF]' : 'text-[#06123C]'}`}>
                    {session.company}
                  </div>
                  <div className="text-[10px] text-[#727998] truncate">{session.role}</div>
                </div>
              </div>
              {session.alertMessage && (
                <div className="text-[9px] text-[#FAA82C] font-semibold mt-1.5 bg-[#FFF8EC] px-2 py-0.5 rounded-lg">
                  {session.alertMessage}
                </div>
              )}
            </button>
          ))}

          {DEMO_SESSIONS.length === 0 && (
            <div className="text-center py-8 text-[11px] text-[#727998]">
              No interviews scheduled.<br />Move an application to Interview status.
            </div>
          )}

          <div className="h-px bg-[#DCDFE8] my-3" />

          <button className="w-full text-[11px] font-semibold text-[#4584FF] text-center py-2 hover:underline">
            + Prep for a new role
          </button>
        </div>
      </div>

      {/* Right column — session panel */}
      <InterviewSessionPanel
        session={activeSession}
        demoQuestions={activeSession ? (DEMO_QUESTIONS[activeSession.company] ?? []) : []}
        starStories={DEMO_STAR_STORIES}
        process={activeSession ? DEMO_COMPANY_PROCESS[activeSession.company] : undefined}
      />
    </div>
  )
}
