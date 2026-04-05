'use client'

import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMessage, MessageSegment, ToolResult, SkillGapResult, LearningPathResult, ExpertMatchResult, CareerInsight, JobMarketScanResult, InterviewEvaluation, SalaryBenchmarkResult } from '@/types'
import { CVPreviewCard } from '@/components/chat/CVPreviewCard'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import { SkillGapTable } from '@/components/generative-ui/SkillGapTable'
import { LearningPathTimeline } from '@/components/generative-ui/LearningPathTimeline'
import { ExpertCard } from '@/components/generative-ui/ExpertCard'
import { CareerInsightCard } from '@/components/generative-ui/CareerInsightCard'
import { JobMatchCard } from '@/components/generative-ui/JobMatchCard'
import { InterviewScoreCard } from '@/components/generative-ui/InterviewScoreCard'
import { SalaryBenchmarkCard } from '@/components/generative-ui/SalaryBenchmarkCard'

const LOADING_MESSAGES: Record<string, string> = {
  skill_gap_analysis: 'Analyzing skill gaps...',
  learning_path: 'Building learning path...',
  expert_match: 'Finding mentors...',
  career_insight: 'Loading insight...',
  update_profile: 'Updating profile...',
  parse_resume: 'Reading your CV...',
  job_market_scan: 'Scanning MENA job market...',
  generate_interview_question: 'Preparing interview question...',
  evaluate_interview_answer: 'Evaluating your answer...',
  salary_benchmark: 'Loading salary data...',
}

function ToolResultRenderer({ toolResult }: { toolResult: ToolResult }) {
  if (toolResult.status === 'loading') {
    const loadingText = LOADING_MESSAGES[toolResult.toolName] ?? 'Loading...'
    return (
      <div
        data-testid={`tool-loading-${toolResult.toolName}`}
        className="mt-2 animate-pulse rounded-[10px] bg-blue/5 border border-blue/20 px-4 py-3 text-sm text-blue"
      >
        {loadingText}
      </div>
    )
  }

  // status === 'done'
  switch (toolResult.toolName) {
    case 'skill_gap_analysis': {
      const result = toolResult.result as SkillGapResult
      return (
        <>
          <SkillRadarChart result={result} />
          <SkillGapTable gaps={result.gaps} />
        </>
      )
    }
    case 'learning_path': {
      const result = toolResult.result as LearningPathResult
      return <LearningPathTimeline targetRole={result.targetRole} phases={result.phases} totalDuration={result.totalDuration} />
    }
    case 'expert_match': {
      const result = toolResult.result as ExpertMatchResult
      return <ExpertCard experts={result.experts} />
    }
    case 'career_insight': {
      const raw = toolResult.result as Record<string, unknown> | null
      const insight = (raw && typeof raw === 'object' && 'insight' in raw
        ? raw.insight
        : raw) as CareerInsight
      return <CareerInsightCard insight={insight} />
    }
    case 'update_profile':
      return null

    case 'parse_resume':
      return null  // profile update handled in ChatInterface; no UI needed

    case 'job_market_scan': {
      const result = toolResult.result as JobMarketScanResult
      return <JobMatchCard result={result} />
    }

    case 'generate_interview_question': {
      // Show the question as a styled callout — the agent will ask the user to answer
      const result = toolResult.result as { question: string; type: string; evaluationCriteria: string[] }
      return (
        <div className="mt-3 rounded-[10px] border border-blue/20 bg-blue/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue mb-2">Interview Question</p>
          <p className="text-sm font-medium text-navy italic">&ldquo;{result.question}&rdquo;</p>
          {result.evaluationCriteria?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.evaluationCriteria.map((c: string) => (
                <span key={c} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-muted">{c}</span>
              ))}
            </div>
          )}
        </div>
      )
    }

    case 'evaluate_interview_answer': {
      const result = toolResult.result as InterviewEvaluation
      return <InterviewScoreCard result={result} />
    }

    case 'salary_benchmark': {
      const result = toolResult.result as SalaryBenchmarkResult
      return <SalaryBenchmarkCard result={result} />
    }

    default:
      return null
  }
}

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => {
        if (message.role === 'user') {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="bg-blue text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                {/* Only show text content if it's not a CV-only upload message */}
                {!message.cvAttachment && message.content}
                {message.cvAttachment && (
                  <CVPreviewCard attachment={message.cvAttachment} />
                )}
              </div>
            </div>
          )
        }

        // assistant
        const segments = message.segments?.length
          ? message.segments
          : message.content
            ? [{ type: 'text' as const, content: message.content }]
            : []

        return (
          <div key={message.id} className="flex justify-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue text-sm font-semibold text-white">
              L
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[85%]">
              {/* Vision scanning state */}
              {message.isScanning && (
                <div className="flex items-center gap-2.5 py-1 text-sm text-blue">
                  <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <div className="absolute h-5 w-5 animate-ping rounded-full bg-blue opacity-20" />
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue border-t-transparent" />
                  </div>
                  <span>Scanning your CV with AI vision...</span>
                </div>
              )}
              {segments.map((seg: MessageSegment, i: number) => {
                if (seg.type === 'text') {
                  return (
                    <ReactMarkdown
                      key={i}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-navy">{children}</strong>,
                        h3: ({ children }) => <h3 className="font-bold text-navy text-sm mt-3 mb-1">{children}</h3>,
                        code: ({ children }) => <code className="bg-gray-100 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                        hr: () => <hr className="border-border my-3" />,
                      }}
                    >
                      {seg.content}
                    </ReactMarkdown>
                  )
                }
                const toolResult = message.toolResults.find(t => t.id === seg.toolResultId)
                if (!toolResult) return null
                return <ToolResultRenderer key={seg.toolResultId} toolResult={toolResult} />
              })}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
