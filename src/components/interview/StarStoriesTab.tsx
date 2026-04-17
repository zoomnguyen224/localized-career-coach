'use client'

import { useState } from 'react'
import type { StarStory } from '@/types/interview'

interface StarStoriesTabProps {
  stories: StarStory[]
}

export function StarStoriesTab({ stories }: StarStoriesTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <div className="text-2xl">📖</div>
        <div className="text-[12px] text-[#727998]">No STAR stories yet</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {stories.map(story => (
        <div
          key={story.id}
          className="bg-white border border-[#d8dbe4] rounded-[10px] overflow-hidden shadow-[0_2px_12px_rgba(151,155,192,0.1)]"
        >
          <button
            onClick={() => setExpanded(prev => prev === story.id ? null : story.id)}
            className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
          >
            <div>
              <div className="text-[12px] font-bold text-[#0a0b0d]">{story.title}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {story.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-semibold text-[#0052ff] bg-[#e8f0fe] px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
            <span className="text-[#727998] text-[14px] flex-shrink-0 mt-0.5">
              {expanded === story.id ? '▲' : '▼'}
            </span>
          </button>

          {expanded === story.id && (
            <div className="px-4 pb-4 border-t border-[#eef0f3] pt-3 flex flex-col gap-2.5">
              {(['situation', 'task', 'action', 'result'] as const).map(key => (
                <div key={key}>
                  <div className="text-[9px] font-bold text-[#8D96B4] uppercase tracking-wide mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                  <div className="text-[11px] text-[#0a0b0d] leading-relaxed">{story[key]}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
