import type { CareerInsight } from '@/types'

interface Props {
  insight: CareerInsight
}

export function CareerInsightCard({ insight }: Props) {
  return (
    <div className="flex items-start gap-2 my-2 px-3 py-2 rounded-[8px] bg-gray-50 border border-border">
      {/* Small chart icon */}
      <svg className="w-3.5 h-3.5 text-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-blue uppercase tracking-wide">Market Insight</span>
        </div>
        <p className="text-sm font-semibold text-navy leading-snug">{insight.stat}</p>
        <p className="text-xs text-muted mt-0.5 leading-relaxed">{insight.description}</p>
        <p className="text-xs text-muted/70 mt-1">— {insight.source}</p>
      </div>
    </div>
  )
}
