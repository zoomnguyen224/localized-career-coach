import type { SkillGap } from '@/types'

const severityConfig = {
  high: { label: 'High', className: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  low: { label: 'Low', className: 'bg-green-100 text-green-700' },
}

interface Props {
  gaps: SkillGap[]
}

export function SkillGapTable({ gaps }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm my-3 w-full max-w-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-2 text-gray-600 font-medium">Skill</th>
            <th className="text-center px-3 py-2 text-gray-600 font-medium">Level</th>
            <th className="text-center px-3 py-2 text-gray-600 font-medium">Priority</th>
            <th className="text-left px-4 py-2 text-gray-600 font-medium hidden md:table-cell">Action</th>
          </tr>
        </thead>
        <tbody>
          {gaps.map((gap, i) => {
            const config = severityConfig[gap.severity]
            return (
              <tr key={gap.skill} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{gap.skill}</p>
                  <p className="text-xs text-gray-400 capitalize">{gap.category}</p>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-teal h-1.5 rounded-full" style={{ width: `${(gap.currentLevel / 10) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{gap.currentLevel}/{gap.requiredLevel}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                    {config.label}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">{gap.recommendedAction}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
