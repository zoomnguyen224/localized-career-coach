'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Job, ScoreBreakdown as ScoreBreakdownType, SkillMatch } from '@/types/jobs'
import { ScoreBreakdown } from './ScoreBreakdown'

interface JobDetailProps {
  job: Job
  cvMarkdown: string
}

const LOGO_COLORS: Record<string, string> = {
  STC: 'bg-[var(--brand-severity-info-soft)] text-[var(--brand-accent)]',
  Talabat: 'bg-[var(--brand-severity-ok-soft)] text-[var(--brand-severity-ok)]',
  Careem: 'bg-[var(--brand-severity-med-soft)] text-[var(--brand-severity-med)]',
  NEOM: 'bg-[var(--brand-bg-2)] text-[var(--brand-ink-2)]',
  Geidea: 'bg-[var(--brand-severity-info-soft)] text-[var(--brand-accent)]',
  'Emirates NBD': 'bg-[var(--brand-severity-info-soft)] text-[var(--brand-accent)]',
}

type EvalState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: ScoreBreakdownType & { skillsMatch: SkillMatch[] } }
  | { status: 'error'; message: string }

export function JobDetail({ job, cvMarkdown }: JobDetailProps) {
  const [evalState, setEvalState] = useState<EvalState>({ status: 'idle' })
  const router = useRouter()
  const [applyState, setApplyState] = useState<'idle' | 'loading' | 'done'>('idle')
  const logoColor = LOGO_COLORS[job.company] ?? 'bg-[var(--brand-bg-2)] text-[var(--brand-ink-2)]'

  async function handleMarkApplied() {
    if (applyState !== 'idle') return
    setApplyState('loading')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: job.company,
          jobTitle: job.title,
          matchScore: job.matchScore ?? 0,
        }),
      })
      // 409 means already tracked — still show as applied
      if (res.ok || res.status === 409) setApplyState('done')
      else setApplyState('idle')
    } catch {
      setApplyState('idle')
    }
  }

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
      <div className="flex items-start gap-4 mb-5 pb-5 border-b border-[var(--brand-line)]">
        <div className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center text-[22px] font-extrabold flex-shrink-0 ${logoColor}`}>
          {job.company[0]}
        </div>
        <div className="flex-1">
          <div className="text-xl font-extrabold text-[var(--brand-ink-0)] tracking-tight">{job.title}</div>
          <div className="text-[14px] text-[var(--brand-ink-2)] mt-1">{job.company} · {job.location}</div>
          <div className="flex gap-2 flex-wrap mt-2.5">
            <span className="bg-[var(--brand-bg-2)] text-[var(--brand-ink-2)] text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize">
              {job.remoteType}
            </span>
            {job.salaryRange && (
              <span className="bg-[var(--brand-bg-2)] text-[var(--brand-ink-2)] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {job.salaryRange}
              </span>
            )}
            {job.isVision2030 && (
              <span className="bg-[var(--brand-severity-info-soft)] text-[var(--brand-accent)] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                Vision 2030 role
              </span>
            )}
            <span className="bg-[var(--brand-bg-2)] text-[var(--brand-ink-2)] text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase">
              {job.atsSource}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[var(--brand-accent)] text-white text-[13px] font-bold px-5 py-2.5 rounded-[14px] text-center"
          >
            Apply now
          </a>
          <button className="bg-white border border-[var(--brand-line)] text-[var(--brand-ink-0)] text-[12px] font-semibold px-4 py-2 rounded-[14px]">
            Save
          </button>
        </div>
      </div>

      {/* Evaluate CTA or result */}
      {evalState.status === 'idle' && (
        <div className="bg-[var(--brand-severity-info-soft)] border border-[var(--brand-severity-info-soft)] rounded-[10px] p-5 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold text-[var(--brand-ink-0)]">Agent evaluation ready</div>
            <div className="text-[12px] text-[var(--brand-ink-2)] mt-1">
              Score this job against your CV using oferta.md scoring framework
            </div>
          </div>
          <button
            onClick={handleEvaluate}
            className="bg-[var(--brand-accent)] text-white text-[13px] font-bold px-5 py-2.5 rounded-[14px] flex-shrink-0 ml-4"
          >
            Evaluate with agent
          </button>
        </div>
      )}

      {evalState.status === 'loading' && (
        <div className="bg-[var(--brand-severity-info-soft)] border border-[var(--brand-severity-info-soft)] rounded-[10px] p-5 mb-4 text-[13px] font-semibold text-[var(--brand-accent)] flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[var(--brand-accent)] animate-pulse" />
          Agent evaluating — reading your CV and job requirements…
        </div>
      )}

      {evalState.status === 'error' && (
        <div className="bg-[var(--brand-severity-high-soft)] border border-[var(--brand-severity-high)]/20 rounded-[10px] p-4 mb-4 text-[12px] text-[var(--brand-severity-high)] font-semibold">
          {evalState.message}
        </div>
      )}

      {evalState.status === 'done' && (
        <ScoreBreakdown breakdown={evalState.result} />
      )}

      {/* Agent actions */}
      <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 mt-4 shadow-[0_5px_40px_rgba(151,155,192,0.1)]">
        <div className="text-[11px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em] mb-3">
          Agent Actions
        </div>

        {/* Generate tailored CV */}
        <button
          onClick={() => router.push(`/cv?jobTitle=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--brand-line)] mb-2 hover:border-[var(--brand-accent)] hover:bg-[var(--brand-severity-info-soft)] transition-all cursor-pointer text-left"
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-[var(--brand-severity-info-soft)] flex items-center justify-center flex-shrink-0">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-[var(--brand-ink-0)]">Generate tailored CV</div>
            <div className="text-[11px] text-[var(--brand-ink-2)] mt-0.5">Opens CV page with this job pre-filled</div>
          </div>
          <span aria-hidden="true" className="text-[var(--brand-line)] text-sm">›</span>
        </button>

        {/* Mark as applied */}
        <button
          onClick={handleMarkApplied}
          disabled={applyState !== 'idle'}
          className="w-full flex items-center gap-3 p-3 rounded-lg border mb-2 transition-all cursor-pointer text-left disabled:cursor-default border-[var(--brand-line)] hover:border-[var(--brand-severity-ok)] hover:bg-[var(--brand-severity-ok-soft)] disabled:hover:border-[var(--brand-line)] disabled:hover:bg-white"
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-[var(--brand-severity-ok-soft)] flex items-center justify-center flex-shrink-0">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-severity-ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-[var(--brand-ink-0)]">Mark as applied</div>
            <div className="text-[11px] text-[var(--brand-ink-2)] mt-0.5">Auto-adds to Applications tracker</div>
          </div>
          {applyState === 'done'
            ? <span className="bg-[var(--brand-severity-ok-soft)] text-[var(--brand-severity-ok)] text-[10px] font-bold px-2 py-0.5 rounded-full">Applied</span>
            : <span aria-hidden="true" className="text-[var(--brand-line)] text-sm">›</span>
          }
        </button>

        {/* Interview prep */}
        <button
          onClick={() => router.push(`/interview?company=${encodeURIComponent(job.company)}`)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--brand-line)] mb-2 hover:border-[var(--brand-accent)] hover:bg-[var(--brand-severity-info-soft)] transition-all cursor-pointer text-left"
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-[var(--brand-severity-med-soft)] flex items-center justify-center flex-shrink-0">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-severity-med)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-[var(--brand-ink-0)]">Interview prep</div>
            <div className="text-[11px] text-[var(--brand-ink-2)] mt-0.5">Opens Interview page for {job.company}</div>
          </div>
          <span aria-hidden="true" className="text-[var(--brand-line)] text-sm">›</span>
        </button>

        {/* Draft outreach */}
        <button
          disabled
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--brand-line)] opacity-60 cursor-not-allowed text-left"
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-[var(--brand-bg-2)] flex items-center justify-center flex-shrink-0">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-ink-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-[var(--brand-ink-0)]">Draft outreach message</div>
            <div className="text-[11px] text-[var(--brand-ink-2)] mt-0.5">Ask AI coach to write a LinkedIn message</div>
          </div>
          <span className="bg-[var(--brand-bg-2)] text-[var(--brand-ink-3)] text-[10px] font-semibold px-2 py-0.5 rounded-full">Soon</span>
        </button>
      </div>
    </div>
  )
}
