import type { SkillGap } from '@/types'

const severityConfig = {
  high: { label: 'High', className: 'bg-red-50 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 text-xs font-medium' },
  low: { label: 'Low', className: 'bg-green/10 text-green rounded-full px-2 py-0.5 text-xs font-medium' },
}

interface Props {
  gaps: SkillGap[]
}

export function SkillGapTable({ gaps }: Props) {
  return (
    <div className="rounded-[10px] shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] bg-white my-3 w-full max-w-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            <th className="text-left px-4 py-2 text-muted text-xs uppercase tracking-wide font-medium">Skill</th>
            <th className="text-center px-3 py-2 text-muted text-xs uppercase tracking-wide font-medium">Level</th>
            <th className="text-center px-3 py-2 text-muted text-xs uppercase tracking-wide font-medium">Priority</th>
            <th className="text-left px-4 py-2 text-muted text-xs uppercase tracking-wide font-medium hidden md:table-cell">Action</th>
          </tr>
        </thead>
        <tbody>
          {gaps.map((gap, i) => {
            const config = severityConfig[gap.severity]
            return (
              <tr key={gap.skill} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy text-sm">{gap.skill}</p>
                  <span className="bg-blue/10 text-blue rounded-full px-2 py-0.5 text-xs capitalize">{gap.category}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue h-1.5 rounded-full" style={{ width: `${(gap.currentLevel / 10) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted">{gap.currentLevel}/{gap.requiredLevel}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block ${config.className}`}>
                    {config.label}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-muted">{gap.recommendedAction}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
