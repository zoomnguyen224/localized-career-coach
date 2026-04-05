'use client'

import { useState } from 'react'
import type { InterviewEvaluation } from '@/types'

function VerdictBadge({ verdict }: { verdict: InterviewEvaluation['verdict'] }) {
  if (verdict === 'strong') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green/15 text-green">
        Strong
      </span>
    )
  }
  if (verdict === 'good') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue/10 text-blue">
        Good
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-600">
      Needs Work
    </span>
  )
}

export function InterviewScoreCard({ result }: { result: InterviewEvaluation }) {
  const [showModelAnswer, setShowModelAnswer] = useState(false)

  return (
    <div className="rounded-[10px] shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] bg-white p-5 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-navy">Interview Readiness</h2>
      </div>

      {/* Question */}
      <div className="bg-gray-50 rounded-[10px] p-3 text-sm italic text-navy">
        &ldquo;{result.question}&rdquo;
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <p className="text-5xl font-bold text-navy tabular-nums">
          {result.score}
          <span className="text-xl font-normal text-muted">/100</span>
        </p>
        <VerdictBadge verdict={result.verdict} />
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-navy flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Strengths
          </h3>
          <ul className="flex flex-col gap-1.5">
            {result.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy/80">
                <svg className="w-3.5 h-3.5 text-green mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to Improve */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-navy flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Areas to Improve
          </h3>
          <ul className="flex flex-col gap-1.5">
            {result.improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy/80">
                <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Model Answer toggle */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowModelAnswer((prev) => !prev)}
          className="self-start flex items-center gap-1.5 text-xs font-semibold text-blue hover:text-blue/80 transition-colors"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${showModelAnswer ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {showModelAnswer ? 'Hide guidance' : 'Show guidance'}
        </button>

        {showModelAnswer && (
          <div className="bg-gray-50 rounded-[10px] p-3 border border-border">
            <p className="text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Model Answer</p>
            <p className="text-sm text-muted leading-relaxed">{result.modelAnswer}</p>
          </div>
        )}
      </div>
    </div>
  )
}
