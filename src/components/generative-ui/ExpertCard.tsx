import type { ExpertMatchResult, ExpertMatch } from '@/types'

function getAvatarBg(industries: string[]): string {
  const lower = industries.map((i) => i.toLowerCase())
  if (lower.some((i) => ['tech', 'ai', 'cloud', 'data'].includes(i))) {
    return 'bg-teal'
  }
  if (lower.some((i) => ['finance', 'fintech', 'banking'].includes(i))) {
    return 'bg-navy'
  }
  return 'bg-gray-500'
}

function getMatchBadgeClass(score: number): string {
  if (score >= 80) return 'bg-teal text-white'
  if (score >= 60) return 'bg-amber-500 text-white'
  return 'bg-gray-300 text-gray-700'
}

interface ExpertItemProps {
  expert: ExpertMatch
}

function ExpertItem({ expert }: ExpertItemProps) {
  const avatarBg = getAvatarBg(expert.industries)
  const badgeClass = getMatchBadgeClass(expert.matchScore)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3 shadow-sm">
      {/* Avatar + Name + Title */}
      <div className="flex items-center gap-3">
        <div
          className={`${avatarBg} w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
        >
          {expert.initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-navy leading-tight truncate">{expert.name}</p>
          <p className="text-sm text-gray-500 truncate">{expert.title}</p>
          <p className="text-sm text-gray-500 truncate">{expert.company}</p>
        </div>
      </div>

      {/* Location badge */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <span className="inline-block bg-gray-100 rounded px-2 py-0.5">{expert.location}</span>
      </div>

      {/* Match score badge */}
      <span
        className={`${badgeClass} text-xs font-semibold rounded-full px-3 py-1 self-start`}
      >
        {expert.matchScore}% match
      </span>

      {/* Match reason */}
      <p className="text-xs text-gray-400 italic">{expert.matchReason}</p>

      {/* Request Session button */}
      <button
        disabled
        title="Available in full product"
        className="mt-auto w-full rounded-lg border border-teal text-teal text-sm font-medium py-2 opacity-50 cursor-not-allowed"
      >
        Request Session
      </button>
    </div>
  )
}

export function ExpertCard({ experts }: ExpertMatchResult) {
  const displayExperts = experts.slice(0, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3">
      {displayExperts.map((expert) => (
        <ExpertItem key={expert.id} expert={expert} />
      ))}
    </div>
  )
}
