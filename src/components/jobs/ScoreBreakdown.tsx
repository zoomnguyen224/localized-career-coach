import { ScoreBreakdown as ScoreBreakdownType, SkillMatch } from '@/types/jobs'

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType & { skillsMatch: SkillMatch[] }
}

const BARS: Array<{ key: keyof ScoreBreakdownType; label: string }> = [
  { key: 'cvMatch', label: 'CV match' },
  { key: 'roleAlignment', label: 'Role alignment' },
  { key: 'compensation', label: 'Compensation' },
  { key: 'culturalSignals', label: 'Culture signals' },
]

function barColor(val: number): string {
  if (val >= 4.0) return 'bg-[var(--brand-severity-ok)]'
  if (val >= 3.0) return 'bg-[var(--brand-severity-med)]'
  return 'bg-[var(--brand-severity-high)]'
}

function scoreColor(val: number): string {
  if (val >= 4.0) return 'text-[var(--brand-severity-ok)]'
  if (val >= 3.0) return 'text-[var(--brand-severity-med)]'
  return 'text-[var(--brand-severity-high)]'
}

function dotColor(status: SkillMatch['status']): string {
  if (status === 'strong') return 'bg-[var(--brand-severity-ok)]'
  if (status === 'partial') return 'bg-[var(--brand-severity-med)]'
  return 'bg-[var(--brand-severity-high)]'
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Overall */}
      <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 shadow-[0_5px_40px_rgba(151,155,192,0.1)]">
        <div className="text-[11px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em] mb-3">
          Agent Match Analysis
        </div>
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[var(--brand-bg-2)]">
          <div className={`text-4xl font-extrabold ${scoreColor(breakdown.overall)}`}>
            {breakdown.overall.toFixed(1)}
          </div>
          <div>
            <div className="text-[11px] text-[var(--brand-ink-2)]">Overall match score</div>
            <div className="text-[13px] font-semibold text-[var(--brand-ink-0)] mt-0.5">{breakdown.recommendation}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {BARS.map(({ key, label }) => {
            const val = breakdown[key] as number
            return (
              <div key={key} className="flex items-center gap-2.5">
                <div className="text-[12px] font-semibold text-[var(--brand-ink-0)] w-[110px] flex-shrink-0">{label}</div>
                <div className="flex-1 h-1.5 bg-[var(--brand-bg-2)] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(val)}`} style={{ width: `${(val / 5) * 100}%` }} />
                </div>
                <div className={`text-[12px] font-bold w-7 text-right flex-shrink-0 ${scoreColor(val)}`}>
                  {val.toFixed(1)}
                </div>
              </div>
            )
          })}
          {breakdown.redFlags && (
            <div className="mt-1 text-[12px] text-[var(--brand-severity-high)] font-semibold">
              ⚠️ {breakdown.redFlags}
            </div>
          )}
        </div>
      </div>

      {/* Skills match */}
      {breakdown.skillsMatch.length > 0 && (
        <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 shadow-[0_5px_40px_rgba(151,155,192,0.1)]">
          <div className="text-[11px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em] mb-3">
            Skills Match
          </div>
          <div className="flex flex-col gap-2">
            {breakdown.skillsMatch.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(s.status)}`} />
                <div className="text-[12px] font-semibold text-[var(--brand-ink-0)] flex-1">{s.skill}</div>
                <div className="text-[11px] text-[var(--brand-ink-2)]">{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
