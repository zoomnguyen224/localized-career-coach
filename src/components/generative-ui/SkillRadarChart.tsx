'use client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend, ResponsiveContainer } from 'recharts'
import type { SkillGapResult } from '@/types'

interface Props {
  result: SkillGapResult
}

export function SkillRadarChart({ result }: Props) {
  const { role, gaps, overallReadiness } = result

  const chartData = gaps.slice(0, 8).map(gap => ({
    skill: gap.skill.length > 12 ? gap.skill.slice(0, 12) + '…' : gap.skill,
    current: gap.currentLevel,
    required: gap.requiredLevel,
  }))

  const readinessColor = overallReadiness >= 70 ? 'text-green-600' : overallReadiness >= 40 ? 'text-amber-600' : 'text-red-500'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 my-3 w-full max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-navy">{role.title}</p>
          <p className="text-sm text-gray-500">{role.company} · {role.location}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${readinessColor}`}>{overallReadiness}%</p>
          <p className="text-xs text-gray-400">readiness</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#374151', fontSize: 11 }} />
          <Radar name="Your Level" dataKey="current" stroke="#0EA5A0" fill="#0EA5A0" fillOpacity={0.4} isAnimationActive />
          <Radar name="Role Required" dataKey="required" stroke="#0F2137" fill="#0F2137" fillOpacity={0.15} isAnimationActive />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
