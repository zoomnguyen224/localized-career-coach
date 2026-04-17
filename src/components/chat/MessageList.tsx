'use client'

import React from 'react'
import { ChatMessage } from '@/types'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import { SkillGapTable } from '@/components/generative-ui/SkillGapTable'
import { LearningPathTimeline } from '@/components/generative-ui/LearningPathTimeline'
import { ExpertCard } from '@/components/generative-ui/ExpertCard'
import { CareerInsightCard } from '@/components/generative-ui/CareerInsightCard'

interface MessageListProps {
  messages: ChatMessage[]
}

const TOOL_LOADING_MESSAGES: Record<string, string> = {
  skill_gap_analysis: 'Analyzing skill gaps...',
  learning_path: 'Building learning path...',
  expert_match: 'Finding mentors...',
  career_insight: 'Loading insight...',
  update_profile: 'Updating profile...',
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-white to-blue/2">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-[16px] ${
              message.role === 'user'
                ? 'bg-blue text-white rounded-br-[4px]'
                : 'bg-gray-100 text-navy rounded-bl-[4px]'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue rounded-full flex items-center justify-center text-white text-xs font-bold">
                  L
                </div>
                <span className="text-xs font-semibold">Localized Coach</span>
              </div>
            )}

            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

            {/* Tool results */}
            {message.toolResults && message.toolResults.length > 0 && (
              <div className="mt-4 space-y-3">
                {message.toolResults.map((toolResult) => {
                  if (toolResult.status === 'loading') {
                    return (
                      <div
                        key={toolResult.id}
                        data-testid={`tool-loading-${toolResult.toolName}`}
                        className="bg-white/50 p-3 rounded-lg animate-pulse"
                      >
                        <p className="text-xs text-muted">
                          {TOOL_LOADING_MESSAGES[toolResult.toolName] || 'Loading...'}
                        </p>
                      </div>
                    )
                  }

                  if (toolResult.status === 'done' && toolResult.result) {
                    switch (toolResult.toolName) {
                      case 'skill_gap_analysis':
                        return (
                          <div key={toolResult.id}>
                            <SkillRadarChart result={toolResult.result as any} />
                            <SkillGapTable gaps={(toolResult.result as any)?.gaps || []} />
                          </div>
                        )
                      case 'learning_path':
                        return (
                          <div key={toolResult.id}>
                            <LearningPathTimeline {...(toolResult.result as any)} />
                          </div>
                        )
                      case 'expert_match':
                        return (
                          <div key={toolResult.id}>
                            <ExpertCard {...(toolResult.result as any)} />
                          </div>
                        )
                      case 'career_insight':
                        return (
                          <div key={toolResult.id}>
                            <CareerInsightCard insight={(toolResult.result as any)?.insight || (toolResult.result as any)} />
                          </div>
                        )
                      case 'update_profile':
                        return null
                      default:
                        return null
                    }
                  }

                  return null
                })}
              </div>
            )}
          </div>
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  )
}
