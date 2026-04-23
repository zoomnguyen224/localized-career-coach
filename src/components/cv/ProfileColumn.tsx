// src/components/cv/ProfileColumn.tsx
interface DemoProfile {
  name: string
  role: string
  location: string
  email: string
  completeness: number
  skills: Array<{ name: string; level: number }>
  suggestions: string[]
}

interface ProfileColumnProps {
  profile: DemoProfile
}

function skillColor(level: number): string {
  if (level >= 8) return 'bg-[var(--brand-accent)]'
  if (level >= 6) return 'bg-[var(--brand-severity-med)]'
  return 'bg-[var(--brand-severity-high)]'
}

export function ProfileColumn({ profile }: ProfileColumnProps) {
  const initials = profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="w-[260px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
      {/* Profile card */}
      <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-severity-ok)] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[13px] font-extrabold text-[var(--brand-ink-0)]">{profile.name}</div>
            <div className="text-[11px] text-[var(--brand-ink-2)] mt-0.5">{profile.role}</div>
          </div>
        </div>
        <div className="text-[11px] text-[var(--brand-ink-2)] mb-3">{profile.location} · {profile.email}</div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-semibold text-[var(--brand-ink-2)]">CV completeness</div>
          <div className="text-[10px] font-bold text-[var(--brand-accent)]">{profile.completeness}%</div>
        </div>
        <div className="h-1.5 bg-[var(--brand-bg-2)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--brand-accent)] rounded-full" style={{ width: `${profile.completeness}%` }} />
        </div>
      </div>

      {/* Skill bars */}
      <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <div className="text-[10px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em] mb-3">Top Skills</div>
        <div className="flex flex-col gap-2.5">
          {profile.skills.map(skill => (
            <div key={skill.name}>
              <div className="flex justify-between mb-1">
                <div className="text-[11px] font-semibold text-[var(--brand-ink-0)]">{skill.name}</div>
                <div className="text-[11px] text-[var(--brand-ink-2)]">{skill.level}/10</div>
              </div>
              <div className="h-1.5 bg-[var(--brand-bg-2)] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${skillColor(skill.level)}`} style={{ width: `${skill.level * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent suggestions */}
      <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <div className="text-[10px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em] mb-3">Agent Suggestions</div>
        <div className="flex flex-col gap-2.5">
          {profile.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] flex-shrink-0 mt-1.5" />
              <div className="text-[11px] text-[var(--brand-ink-2)] leading-relaxed">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
