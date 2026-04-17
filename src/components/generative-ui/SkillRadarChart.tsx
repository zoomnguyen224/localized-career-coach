'use client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend, ResponsiveContainer } from 'recharts'
import type { SkillGapResult } from '@/types'

interface Props {
  result: SkillGapResult
  compact?: boolean
}

export function SkillRadarChart({ result, compact = false }: Props) {
  const { role, gaps, overallReadiness } = result
  const maxSkills = compact ? 6 : 8
  const chartHeight = compact ? 200 : 280

  const chartData = gaps.slice(0, maxSkills).map(gap => ({
    skill: gap.skill.length > 12 ? gap.skill.slice(0, 12) + '…' : gap.skill,
    current: gap.currentLevel,
    required: gap.requiredLevel,
  }))

  const readinessBadgeClass =
    overallReadiness >= 70
      ? 'bg-green/10 text-green font-bold'
      : overallReadiness >= 50
      ? 'bg-amber-50 text-amber-600'
      : 'bg-red-50 text-red-600'

  return (
    <div className="rounded-[10px] shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] bg-white p-4 my-3 w-full max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-navy">{role.title}</p>
          <p className="text-sm text-muted">{role.company} · {role.location}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold rounded-full px-3 py-1 ${readinessBadgeClass}`}>{overallReadiness}%</p>
          <p className="text-xs text-muted">readiness</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#374151', fontSize: compact ? 9 : 11 }} />
          <Radar name="Your Level" dataKey="current" stroke="#0052ff" fill="#0052ff" fillOpacity={0.3} isAnimationActive />
          <Radar name="Role Required" dataKey="required" stroke="#0a0b0d" fill="#0a0b0d" fillOpacity={0.15} isAnimationActive />
          {!compact && <Legend wrapperStyle={{ fontSize: 12 }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
