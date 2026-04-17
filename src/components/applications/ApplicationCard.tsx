// src/components/applications/ApplicationCard.tsx
'use client'

import { Application } from '@/types/applications'
import { scoreColorClass, cardLeftBorderClass, timeSince } from '@/lib/applications'

interface ApplicationCardProps {
  application: Application
  onDragStart: (id: string) => void
}

export function ApplicationCard({ application, onDragStart }: ApplicationCardProps) {
  const initials = application.company
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      draggable
      onDragStart={() => onDragStart(application.id)}
      className={`bg-white border border-[#DCDFE8] border-l-4 ${cardLeftBorderClass(application.alertType, application.status)}
        rounded-[10px] p-3.5 cursor-grab active:cursor-grabbing select-none
        shadow-[0_2px_12px_rgba(151,155,192,0.12)] hover:shadow-[0_4px_20px_rgba(151,155,192,0.2)] transition-shadow`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4584FF] to-[#06123C] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-[#06123C] truncate">{application.company}</div>
          <div className="text-[10px] text-[#727998] truncate">{application.jobTitle}</div>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${scoreColorClass(application.matchScore)}`}>
          {application.matchScore.toFixed(1)}
        </span>
      </div>

      {/* Alert message */}
      {application.alertMessage && (
        <div className="text-[10px] text-[#FAA82C] font-semibold bg-[#FFF8EC] px-2 py-1 rounded-lg mb-2 leading-relaxed">
          {application.alertMessage}
        </div>
      )}

      {/* Offer banner */}
      {application.status === 'offer' && application.salaryOffer && (
        <div className="bg-[#E6FAF4] border border-[#03BA82]/20 rounded-lg px-2 py-1.5 mb-2">
          <div className="text-[11px] font-bold text-[#03BA82]">{application.salaryOffer}</div>
          {application.offerDeadline && (
            <div className="text-[9px] text-[#727998] mt-0.5">
              Deadline: {new Date(application.offerDeadline).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Last activity */}
      <div className="text-[9px] text-[#8D96B4]">{timeSince(application.lastActivity)}</div>
    </div>
  )
}
