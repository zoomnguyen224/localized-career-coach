'use client'

import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMessage, ToolResult, SkillGapResult, LearningPathResult, ExpertMatchResult, CareerInsight } from '@/types'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import { SkillGapTable } from '@/components/generative-ui/SkillGapTable'
import { LearningPathTimeline } from '@/components/generative-ui/LearningPathTimeline'
import { ExpertCard } from '@/components/generative-ui/ExpertCard'
import { CareerInsightCard } from '@/components/generative-ui/CareerInsightCard'

const LOADING_MESSAGES: Record<string, string> = {
  skill_gap_analysis: 'Analyzing skill gaps...',
  learning_path: 'Building learning path...',
  expert_match: 'Finding mentors...',
  career_insight: 'Loading insight...',
  update_profile: 'Updating profile...',
}

function ToolResultRenderer({ toolResult }: { toolResult: ToolResult }) {
  if (toolResult.status === 'loading') {
    const loadingText = LOADING_MESSAGES[toolResult.toolName] ?? 'Loading...'
    return (
      <div
        data-testid={`tool-loading-${toolResult.toolName}`}
        className="mt-2 animate-pulse rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-500"
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
              <div className="bg-teal text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                {message.content}
              </div>
            </div>
          )
        }

        // assistant
        return (
          <div key={message.id} className="flex justify-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal text-sm font-semibold text-white">
              L
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[85%]">
              <ReactMarkdown
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
                {message.content}
              </ReactMarkdown>
              {message.toolResults.map((toolResult) => (
                <ToolResultRenderer key={toolResult.id} toolResult={toolResult} />
              ))}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
