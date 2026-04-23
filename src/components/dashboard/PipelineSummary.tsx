// src/components/dashboard/PipelineSummary.tsx
import type { ApplicationStatus } from '@/types/applications'
import { COLUMNS } from '@/lib/applications'

interface PipelineSummaryProps {
  pipelineCounts: Record<ApplicationStatus, number>
  total: number
}

export function PipelineSummary({ pipelineCounts, total }: PipelineSummaryProps) {
  return (
    <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
      <div className="text-[10px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em] mb-4">Pipeline</div>

      {/* Progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-4 gap-0.5">
        {COLUMNS.map(col => {
          const count = pipelineCounts[col.status]
          const pct = total > 0 ? (count / total) * 100 : 0
          if (pct === 0) return null
          return (
            <div
              key={col.status}
              className="h-full rounded-sm transition-all"
              style={{ width: `${pct}%`, backgroundColor: col.color }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {COLUMNS.map(col => (
          <div key={col.status} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
            <span className="text-[11px] text-[var(--brand-ink-2)]">{col.label}</span>
            <span className="text-[11px] font-bold text-[var(--brand-ink-0)]">{pipelineCounts[col.status]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
