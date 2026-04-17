// src/components/dashboard/DashboardClient.tsx
'use client'

import { useState, useCallback } from 'react'
import { computeStats, DEMO_APPLICATIONS } from '@/lib/applications'
import { computeFollowUps } from '@/lib/followup'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import type { SkillGapResult } from '@/types'
import { StatCard } from './StatCard'
import { PipelineSummary } from './PipelineSummary'
import { TopMatches } from './TopMatches'
import { NextActions } from './NextActions'
import { ScannerStatus } from './ScannerStatus'

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
    { skill: 'LLM / RAG',     category: 'technical', currentLevel: 9, requiredLevel: 9, gap: 0, severity: 'low',    recommendedAction: '' },
    { skill: 'Python',        category: 'technical', currentLevel: 9, requiredLevel: 9, gap: 0, severity: 'low',    recommendedAction: '' },
    { skill: 'MLOps',         category: 'technical', currentLevel: 7, requiredLevel: 8, gap: 1, severity: 'medium', recommendedAction: '' },
    { skill: 'Arabic NLP',    category: 'technical', currentLevel: 6, requiredLevel: 8, gap: 2, severity: 'medium', recommendedAction: '' },
    { skill: 'System Design', category: 'technical', currentLevel: 7, requiredLevel: 9, gap: 2, severity: 'high',   recommendedAction: '' },
    { skill: 'LangChain',     category: 'technical', currentLevel: 8, requiredLevel: 8, gap: 0, severity: 'low',    recommendedAction: '' },
  ],
}

const TOP_MATCHES = [
  { company: 'NEOM',        jobTitle: 'AI Platform Engineer', location: 'Riyadh, KSA', matchScore: 4.7, isNew: true  },
  { company: 'Emirates NBD', jobTitle: 'Head of AI',          location: 'Dubai, UAE',   matchScore: 4.8, isNew: true  },
  { company: 'STC',          jobTitle: 'LLM Engineer',        location: 'Riyadh, KSA', matchScore: 4.5, isNew: false },
]

export function DashboardClient() {
  const { sent, avgScore, pipelineCounts } = computeStats(DEMO_APPLICATIONS)
  const total = DEMO_APPLICATIONS.length

  // Computed from real application state — no hardcoding
  const liveActions = computeFollowUps(DEMO_APPLICATIONS)

  // Updated by ScannerStatus after each scan
  const [jobMatchCount, setJobMatchCount] = useState(12)
  const [newTodayCount, setNewTodayCount] = useState(3)

  const handleScanComplete = useCallback((newJobs: number, totalJobs: number) => {
    if (totalJobs > 0) setJobMatchCount(totalJobs)
    setNewTodayCount(newJobs)
  }, [])

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0a0b0d]">Your AI Command Center</h1>
          <p className="text-[12px] text-[#727998] mt-0.5">
            Good morning, Ahmed — your agents worked overnight. Here&apos;s what they found.
          </p>
        </div>
        <ScannerStatus onScanComplete={handleScanComplete} />
      </div>

      <div className="px-7 pb-6 flex flex-col gap-5">
        {/* Stat cards row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Matches Found by Agents"
            value={jobMatchCount}
            subtitle={newTodayCount > 0 ? `${newTodayCount} new since last scan` : 'Run scan to refresh'}
            valueColor="#0052ff"
          />
          <StatCard
            label="Applications Sent"
            value={sent}
            subtitle={`${total} tracked in pipeline`}
          />
          <StatCard
            label="Profile Readiness"
            value="87%"
            subtitle="Agents found 2 improvements"
            valueColor="#03BA82"
          />
          <StatCard
            label="Avg Agent Score"
            value={`${avgScore}/5`}
            subtitle="Across all evaluated roles"
            valueColor={avgScore >= 4.0 ? '#03BA82' : '#FAA82C'}
          />
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
            <NextActions actions={liveActions} />
            <div>
              <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-2">
                Agent Skill Assessment
              </div>
              <SkillRadarChart result={DEMO_SKILL_GAP} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
