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
  'follow-up': { bg: 'var(--brand-severity-med-soft)', text: 'var(--brand-severity-med)', dot: 'var(--brand-severity-med)' },
  'interview':  { bg: 'var(--brand-severity-info-soft)', text: 'var(--brand-accent)', dot: 'var(--brand-accent)' },
  'offer':      { bg: 'var(--brand-severity-ok-soft)', text: 'var(--brand-severity-ok)', dot: 'var(--brand-severity-ok)' },
  'apply':      { bg: 'var(--brand-bg-2)', text: 'var(--brand-ink-2)', dot: 'var(--brand-ink-2)' },
}

export function NextActions({ actions }: NextActionsProps) {
  return (
    <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
      <div className="text-[10px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em] mb-4">Agents flagged for you</div>
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
                <div className="text-[10px] text-[var(--brand-ink-2)] mt-0.5 leading-relaxed">{action.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
