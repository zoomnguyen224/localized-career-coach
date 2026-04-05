import type { CareerInsight } from '@/types'

interface Props {
  insight: CareerInsight
}

export function CareerInsightCard({ insight }: Props) {
  return (
    <div className="border-l-4 border-blue bg-blue/5 rounded-[10px] p-4 my-2">
      <p className="text-xl font-bold text-navy leading-tight">{insight.stat}</p>
      <p className="text-sm text-navy mt-1">{insight.description}</p>
      <p className="text-xs text-muted mt-2">Source: {insight.source}</p>
    </div>
  )
}
