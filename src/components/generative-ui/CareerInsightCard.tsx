import type { CareerInsight } from '@/types'

interface Props {
  insight: CareerInsight
}

export function CareerInsightCard({ insight }: Props) {
  return (
    <div className="border-l-4 border-teal bg-teal/5 rounded-r-xl p-4 my-2">
      <p className="text-lg font-bold text-navy leading-tight">{insight.stat}</p>
      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
      <p className="text-xs text-gray-400 mt-2">Source: {insight.source}</p>
    </div>
  )
}
