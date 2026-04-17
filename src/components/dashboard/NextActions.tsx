// src/components/dashboard/NextActions.tsx

interface NextAction {
  label: string
  description: string
  type: 'follow-up' | 'interview' | 'offer' | 'apply'
  href?: string
}

interface NextActionsProps {
  actions: NextAction[]
}

const ACTION_COLORS: Record<NextAction['type'], { bg: string; text: string; dot: string }> = {
  'follow-up': { bg: '#FFF8EC', text: '#FAA82C', dot: '#FAA82C' },
  'interview':  { bg: '#ECF3FF', text: '#4584FF', dot: '#4584FF' },
  'offer':      { bg: '#E6FAF4', text: '#03BA82', dot: '#03BA82' },
  'apply':      { bg: '#F2F3F6', text: '#727998', dot: '#727998' },
}

export function NextActions({ actions }: NextActionsProps) {
  return (
    <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
      <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-4">Next Actions</div>
      <div className="flex flex-col gap-2.5">
        {actions.map((action, i) => {
          const colors = ACTION_COLORS[action.type]
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-[10px] cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: colors.bg }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: colors.dot }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate" style={{ color: colors.text }}>{action.label}</div>
                <div className="text-[10px] text-[#727998] mt-0.5 leading-relaxed">{action.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
