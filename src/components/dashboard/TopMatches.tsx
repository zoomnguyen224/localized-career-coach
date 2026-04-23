// src/components/dashboard/TopMatches.tsx

interface TopMatch {
  company: string
  jobTitle: string
  location: string
  matchScore: number
  isNew?: boolean
}

interface TopMatchesProps {
  matches: TopMatch[]
}

const LOGO_COLORS: Record<string, string> = {
  NEOM: 'var(--brand-ink-0)', STC: '#00B14F', EMIR: '#D71921',
  CARE: '#00A651', TALA: '#FF6600', GEID: '#7B2D8B',
}

function logoColor(company: string): string {
  const key = company.slice(0, 4).toUpperCase()
  return LOGO_COLORS[key] ?? 'var(--brand-accent)'
}

function scoreColor(score: number): string {
  if (score >= 4.0) return 'text-[var(--brand-severity-ok)] bg-[var(--brand-severity-ok-soft)]'
  if (score >= 3.5) return 'text-[var(--brand-severity-med)] bg-[var(--brand-severity-med-soft)]'
  return 'text-[var(--brand-severity-high)] bg-[var(--brand-severity-high-soft)]'
}

export function TopMatches({ matches }: TopMatchesProps) {
  return (
    <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em]">Agents surfaced for you</div>
        <a href="/jobs" className="text-[11px] text-[var(--brand-accent)] font-semibold hover:underline">View all →</a>
      </div>
      <div className="flex flex-col gap-3">
        {matches.map((match, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: logoColor(match.company) }}
            >
              {match.company.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-[var(--brand-ink-0)] truncate">{match.jobTitle}</div>
              <div className="text-[10px] text-[var(--brand-ink-2)]">{match.company} · {match.location}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {match.isNew && (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />
              )}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${scoreColor(match.matchScore)}`}>
                {match.matchScore.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
