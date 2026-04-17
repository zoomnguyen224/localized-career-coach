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
  if (level >= 8) return 'bg-[#0052ff]'
  if (level >= 6) return 'bg-[#FAA82C]'
  return 'bg-[#F84E4E]'
}

export function ProfileColumn({ profile }: ProfileColumnProps) {
  const initials = profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="w-[260px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
      {/* Profile card */}
      <div className="bg-white border border-[#d8dbe4] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#0052ff] to-[#03BA82] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[13px] font-extrabold text-[#0a0b0d]">{profile.name}</div>
            <div className="text-[11px] text-[#727998] mt-0.5">{profile.role}</div>
          </div>
        </div>
        <div className="text-[11px] text-[#727998] mb-3">{profile.location} · {profile.email}</div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-semibold text-[#727998]">CV completeness</div>
          <div className="text-[10px] font-bold text-[#0052ff]">{profile.completeness}%</div>
        </div>
        <div className="h-1.5 bg-[#eef0f3] rounded-full overflow-hidden">
          <div className="h-full bg-[#0052ff] rounded-full" style={{ width: `${profile.completeness}%` }} />
        </div>
      </div>

      {/* Skill bars */}
      <div className="bg-white border border-[#d8dbe4] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">Top Skills</div>
        <div className="flex flex-col gap-2.5">
          {profile.skills.map(skill => (
            <div key={skill.name}>
              <div className="flex justify-between mb-1">
                <div className="text-[11px] font-semibold text-[#0a0b0d]">{skill.name}</div>
                <div className="text-[11px] text-[#727998]">{skill.level}/10</div>
              </div>
              <div className="h-1.5 bg-[#eef0f3] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${skillColor(skill.level)}`} style={{ width: `${skill.level * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent suggestions */}
      <div className="bg-white border border-[#d8dbe4] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">Agent Suggestions</div>
        <div className="flex flex-col gap-2.5">
          {profile.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0052ff] flex-shrink-0 mt-1.5" />
              <div className="text-[11px] text-[#727998] leading-relaxed">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
