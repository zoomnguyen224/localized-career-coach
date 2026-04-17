// src/components/dashboard/DashboardClient.tsx
'use client'

import { computeStats, DEMO_APPLICATIONS } from '@/lib/applications'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import type { SkillGapResult } from '@/types'
import { StatCard } from './StatCard'
import { PipelineSummary } from './PipelineSummary'
import { TopMatches } from './TopMatches'
import { NextActions } from './NextActions'

const DEMO_SKILL_GAP: SkillGapResult = {
  role: {
    id: 'mena-ai-engineer',
    title: 'Senior AI Engineer',
    company: 'MENA Tech',
    location: 'Dubai, UAE',
    requiredSkills: [],
  },
  overallReadiness: 87,
  gaps: [
    { skill: 'LLM / RAG',    category: 'technical', currentLevel: 9, requiredLevel: 9, gap: 0, severity: 'low',    recommendedAction: '' },
    { skill: 'Python',       category: 'technical', currentLevel: 9, requiredLevel: 9, gap: 0, severity: 'low',    recommendedAction: '' },
    { skill: 'MLOps',        category: 'technical', currentLevel: 7, requiredLevel: 8, gap: 1, severity: 'medium', recommendedAction: '' },
    { skill: 'Arabic NLP',   category: 'technical', currentLevel: 6, requiredLevel: 8, gap: 2, severity: 'medium', recommendedAction: '' },
    { skill: 'System Design',category: 'technical', currentLevel: 7, requiredLevel: 9, gap: 2, severity: 'high',   recommendedAction: '' },
    { skill: 'LangChain',    category: 'technical', currentLevel: 8, requiredLevel: 8, gap: 0, severity: 'low',    recommendedAction: '' },
  ],
}

const TOP_MATCHES = [
  { company: 'NEOM', jobTitle: 'AI Platform Engineer', location: 'Riyadh, KSA', matchScore: 4.7, isNew: true },
  { company: 'Emirates NBD', jobTitle: 'Head of AI', location: 'Dubai, UAE', matchScore: 4.8, isNew: true },
  { company: 'STC', jobTitle: 'LLM Engineer', location: 'Riyadh, KSA', matchScore: 4.5, isNew: false },
]

const NEXT_ACTIONS = [
  {
    label: 'Follow up with STC — LLM Engineer',
    description: 'No response in 8 days. Send a polite check-in.',
    type: 'follow-up' as const,
  },
  {
    label: 'Prepare for Emirates NBD interview',
    description: 'Technical interview tomorrow at 2pm. Review system design.',
    type: 'interview' as const,
  },
  {
    label: 'Review NEOM Tech offer',
    description: 'AED 45,000/mo offer. Decision deadline in 2 days.',
    type: 'offer' as const,
  },
]

export function DashboardClient() {
  const { sent, avgScore, pipelineCounts } = computeStats(DEMO_APPLICATIONS)
  const total = DEMO_APPLICATIONS.length

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#06123C]">Dashboard</h1>
          <p className="text-[12px] text-[#727998] mt-0.5">Good morning, Ahmed — here&apos;s your job search summary</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F2F3F6] px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[#03BA82] animate-pulse" />
          <span className="text-[11px] text-[#727998] font-semibold">Agents active</span>
        </div>
      </div>

      <div className="px-7 pb-6 flex flex-col gap-5">
        {/* Stat cards row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Job Matches" value="12" subtitle="3 new today" valueColor="#4584FF" />
          <StatCard label="Applications Sent" value={sent} subtitle={`${total} total tracked`} />
          <StatCard label="Profile Readiness" value="87%" subtitle="2 improvements suggested" valueColor="#03BA82" />
          <StatCard label="Avg Match Score" value={`${avgScore}/5`} subtitle="Across all tracked" valueColor={avgScore >= 4.0 ? '#03BA82' : '#FAA82C'} />
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-[1fr_340px] gap-5">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            <TopMatches matches={TOP_MATCHES} />
            <PipelineSummary pipelineCounts={pipelineCounts} total={total} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <NextActions actions={NEXT_ACTIONS} />
            <div>
              <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-2">Skill Readiness</div>
              <SkillRadarChart result={DEMO_SKILL_GAP} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
