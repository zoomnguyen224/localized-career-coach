'use client'

import { useState } from 'react'
import { Job, ScoreBreakdown as ScoreBreakdownType, SkillMatch } from '@/types/jobs'
import { ScoreBreakdown } from './ScoreBreakdown'

interface JobDetailProps {
  job: Job
  cvMarkdown: string
}

const LOGO_COLORS: Record<string, string> = {
  STC: 'bg-[#ECF3FF] text-[#4584FF]',
  Talabat: 'bg-[#E6FAF4] text-[#009C6C]',
  Careem: 'bg-[#FFF4E6] text-[#FAA82C]',
  NEOM: 'bg-[#F2F3F6] text-[#727998]',
  Geidea: 'bg-[#ECF3FF] text-[#4584FF]',
  'Emirates NBD': 'bg-[#F0F4FF] text-[#4584FF]',
}

type EvalState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: ScoreBreakdownType & { skillsMatch: SkillMatch[] } }
  | { status: 'error'; message: string }

export function JobDetail({ job, cvMarkdown }: JobDetailProps) {
  const [evalState, setEvalState] = useState<EvalState>({ status: 'idle' })
  const logoColor = LOGO_COLORS[job.company] ?? 'bg-[#F2F3F6] text-[#727998]'

  async function handleEvaluate() {
    setEvalState({ status: 'loading' })
    try {
      const res = await fetch('/api/jobs/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          jobDescription: job.description ?? `${job.title} at ${job.company} in ${job.location}`,
          company: job.company,
          cvMarkdown,
        }),
      })
      if (!res.ok) throw new Error('Evaluation failed')
      const result = await res.json()
      setEvalState({ status: 'done', result })
    } catch (e) {
      setEvalState({ status: 'error', message: 'Evaluation failed — please try again.' })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 pb-5 border-b border-[#DCDFE8]">
        <div className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center text-[22px] font-extrabold flex-shrink-0 ${logoColor}`}>
          {job.company[0]}
        </div>
        <div className="flex-1">
          <div className="text-xl font-extrabold text-[#06123C] tracking-tight">{job.title}</div>
          <div className="text-[14px] text-[#727998] mt-1">{job.company} · {job.location}</div>
          <div className="flex gap-2 flex-wrap mt-2.5">
            <span className="bg-[#F2F3F6] text-[#727998] text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize">
              {job.remoteType}
            </span>
            {job.salaryRange && (
              <span className="bg-[#F2F3F6] text-[#727998] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {job.salaryRange}
              </span>
            )}
            {job.isVision2030 && (
              <span className="bg-[#ECF3FF] text-[#4584FF] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                Vision 2030 role
              </span>
            )}
            <span className="bg-[#F2F3F6] text-[#727998] text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase">
              {job.atsSource}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#4584FF] text-white text-[13px] font-bold px-5 py-2.5 rounded-[14px] text-center"
          >
            Apply now
          </a>
          <button className="bg-white border border-[#DCDFE8] text-[#06123C] text-[12px] font-semibold px-4 py-2 rounded-[14px]">
            Save
          </button>
        </div>
      </div>

      {/* Evaluate CTA or result */}
      {evalState.status === 'idle' && (
        <div className="bg-[#ECF3FF] border border-[#DCE8FF] rounded-[10px] p-5 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold text-[#06123C]">Agent evaluation ready</div>
            <div className="text-[12px] text-[#727998] mt-1">
              Score this job against your CV using oferta.md scoring framework
            </div>
          </div>
          <button
            onClick={handleEvaluate}
            className="bg-[#4584FF] text-white text-[13px] font-bold px-5 py-2.5 rounded-[14px] flex-shrink-0 ml-4"
          >
            Evaluate with agent
          </button>
        </div>
      )}

      {evalState.status === 'loading' && (
        <div className="bg-[#ECF3FF] border border-[#DCE8FF] rounded-[10px] p-5 mb-4 text-[13px] font-semibold text-[#4584FF] flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#4584FF] animate-pulse" />
          Agent evaluating — reading your CV and job requirements…
        </div>
      )}

      {evalState.status === 'error' && (
        <div className="bg-[#FFF0F0] border border-[#F84E4E]/20 rounded-[10px] p-4 mb-4 text-[12px] text-[#F84E4E] font-semibold">
          {evalState.message}
        </div>
      )}

      {evalState.status === 'done' && (
        <ScoreBreakdown breakdown={evalState.result} />
      )}

      {/* Agent actions */}
      <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 mt-4 shadow-[0_5px_40px_rgba(151,155,192,0.1)]">
        <div className="text-[11px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">
          Agent Actions
        </div>
        {[
          { icon: '📄', label: 'Generate tailored CV', sub: 'Keyword-optimized · PDF download', active: true },
          { icon: '✉️', label: 'Draft LinkedIn outreach', sub: 'Find hiring manager · 3-sentence message', active: true },
          { icon: '🔍', label: 'Deep company research', sub: 'AI strategy, culture, recent news', active: true },
          { icon: '🎯', label: 'Interview prep', sub: 'Glassdoor intel + STAR stories', active: false },
        ].map((action, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg border mb-2 last:mb-0 transition-all ${
              action.active
                ? 'border-[#DCDFE8] cursor-pointer hover:border-[#4584FF] hover:bg-[#F8FBFF]'
                : 'border-[#DCDFE8] opacity-60'
            }`}
          >
            <div className="w-[30px] h-[30px] rounded-lg bg-[#ECF3FF] flex items-center justify-center text-sm flex-shrink-0">
              {action.icon}
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-bold text-[#06123C]">{action.label}</div>
              <div className="text-[11px] text-[#727998] mt-0.5">{action.sub}</div>
            </div>
            {action.active
              ? <span className="text-[#BFC5D6] text-sm">›</span>
              : <span className="bg-[#F2F3F6] text-[#8D96B4] text-[10px] font-semibold px-2 py-0.5 rounded-full">Coming soon</span>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
