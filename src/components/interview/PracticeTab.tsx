'use client'

import { useState } from 'react'
import type { InterviewSession, PracticeQuestion, AnswerResult } from '@/types/interview'

interface PracticeTabProps {
  session: InterviewSession
  demoQuestions: PracticeQuestion[]
}

type PracticePhase =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'question'; question: PracticeQuestion; answer: string }
  | { phase: 'evaluating'; question: PracticeQuestion; answer: string }
  | { phase: 'result'; question: PracticeQuestion; result: AnswerResult }

const TYPE_COLORS: Record<string, string> = {
  behavioral: 'bg-[#e8f0fe] text-[#0052ff]',
  technical: 'bg-[#E6FAF4] text-[#03BA82]',
  'system-design': 'bg-[#FFF8EC] text-[#FAA82C]',
  culture: 'bg-[#eef0f3] text-[#727998]',
}

const VERDICT_COLORS: Record<string, string> = {
  'Excellent Answer': '#03BA82',
  'Strong Answer': '#0052ff',
  'Good Start': '#FAA82C',
  'Needs Work': '#F84E4E',
}

export function PracticeTab({ session, demoQuestions }: PracticeTabProps) {
  const [state, setState] = useState<PracticePhase>({ phase: 'idle' })
  const [demoIndex, setDemoIndex] = useState(0)

  async function loadQuestion() {
    setState({ phase: 'loading' })
    if (demoIndex < demoQuestions.length) {
      const q = demoQuestions[demoIndex]
      setDemoIndex(i => i + 1)
      setState({ phase: 'question', question: q, answer: '' })
    } else {
      try {
        const res = await fetch('/api/interview/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: session.company, role: session.role, questionType: 'behavioral' }),
        })
        const q = await res.json()
        setState({ phase: 'question', question: { ...q, id: String(Date.now()) }, answer: '' })
      } catch {
        setState({ phase: 'idle' })
      }
    }
  }

  async function submitAnswer() {
    if (state.phase !== 'question' || !state.answer.trim()) return
    const { question, answer } = state
    setState({ phase: 'evaluating', question, answer })
    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: session.company, role: session.role, question: question.text, answer }),
      })
      const result = await res.json()
      setState({ phase: 'result', question, result })
    } catch {
      setState({ phase: 'question', question, answer })
    }
  }

  if (state.phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="text-3xl">🎯</div>
        <div className="text-[13px] font-bold text-[#0a0b0d]">Ready to practice?</div>
        <div className="text-[11px] text-[#727998] text-center max-w-[240px]">
          Questions sourced from real candidates at {session.company}. Your answers are evaluated by AI.
        </div>
        <button
          onClick={loadQuestion}
          className="bg-[#0052ff] text-white text-[12px] font-bold px-6 py-2.5 rounded-[14px]"
        >
          Start Practice
        </button>
      </div>
    )
  }

  if (state.phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-[12px] text-[#727998] animate-pulse">Loading question…</div>
      </div>
    )
  }

  if (state.phase === 'evaluating') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-[12px] text-[#727998] animate-pulse">Evaluating your answer…</div>
      </div>
    )
  }

  if (state.phase === 'question') {
    const { question, answer } = state
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white border border-[#d8dbe4] rounded-[10px] p-4 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${TYPE_COLORS[question.questionType] ?? 'bg-[#eef0f3] text-[#727998]'}`}>
              {question.questionType.charAt(0).toUpperCase() + question.questionType.slice(1)}
            </span>
            {question.source && (
              <span className="text-[9px] text-[#8D96B4]">{question.source}</span>
            )}
          </div>
          <p className="text-[13px] font-semibold text-[#0a0b0d] leading-relaxed mb-3">{question.text}</p>
          <div className="flex flex-wrap gap-1.5">
            {question.evaluationCriteria.map(c => (
              <span key={c} className="text-[9px] text-[#727998] bg-[#eef0f3] px-2 py-0.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>

        <textarea
          value={answer}
          onChange={e => setState({ ...state, answer: e.target.value })}
          placeholder="Type your answer here… Use the STAR framework: Situation → Task → Action → Result"
          rows={6}
          className="border border-[#d8dbe4] rounded-[10px] px-3 py-2.5 text-[12px] text-[#0a0b0d] placeholder:text-[#8D96B4] outline-none focus:border-[#0052ff] resize-none leading-relaxed"
        />

        <div className="flex gap-3">
          <button
            onClick={submitAnswer}
            disabled={!answer.trim()}
            className="bg-[#0052ff] text-white text-[12px] font-bold px-5 py-2 rounded-[14px] disabled:opacity-40"
          >
            Submit Answer
          </button>
          <button
            onClick={loadQuestion}
            className="border border-[#d8dbe4] text-[#727998] text-[12px] font-semibold px-4 py-2 rounded-[14px] hover:border-[#0052ff] hover:text-[#0052ff] transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    )
  }

  // result phase
  const { result, question } = state
  const verdictColor = VERDICT_COLORS[result.verdict] ?? '#727998'
  const scorePercent = (result.score / 10) * 100

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-[#d8dbe4] rounded-[10px] p-4 shadow-[0_5px_60px_rgba(151,155,192,0.2)] flex items-center gap-4">
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#eef0f3" strokeWidth="5" />
            <circle
              cx="28" cy="28" r="22" fill="none"
              stroke={verdictColor} strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - scorePercent / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[14px] font-extrabold text-[#0a0b0d]">{result.score}</span>
          </div>
        </div>
        <div>
          <div className="text-[14px] font-extrabold" style={{ color: verdictColor }}>{result.verdict}</div>
          <div className="text-[10px] text-[#727998] mt-0.5">{question.text.slice(0, 60)}…</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#E6FAF4] rounded-[10px] p-3">
          <div className="text-[10px] font-bold text-[#03BA82] mb-2 uppercase tracking-wide">Strengths</div>
          {result.strengths.map((s, i) => (
            <div key={i} className="text-[11px] text-[#0a0b0d] leading-relaxed mb-1">✓ {s}</div>
          ))}
        </div>
        <div className="bg-[#FFF8EC] rounded-[10px] p-3">
          <div className="text-[10px] font-bold text-[#FAA82C] mb-2 uppercase tracking-wide">Improve</div>
          {result.improvements.map((s, i) => (
            <div key={i} className="text-[11px] text-[#0a0b0d] leading-relaxed mb-1">→ {s}</div>
          ))}
        </div>
      </div>

      <div className="bg-[#eef0f3] rounded-[10px] p-3">
        <div className="text-[10px] font-bold text-[#727998] mb-2 uppercase tracking-wide">Model Answer</div>
        <div className="text-[11px] text-[#0a0b0d] leading-relaxed">{result.modelAnswer}</div>
      </div>

      <button
        onClick={loadQuestion}
        className="bg-[#0052ff] text-white text-[12px] font-bold px-5 py-2.5 rounded-[14px] self-start"
      >
        Next Question →
      </button>
    </div>
  )
}
