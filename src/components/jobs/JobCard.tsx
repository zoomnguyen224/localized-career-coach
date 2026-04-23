import { Job } from '@/types/jobs'

interface JobCardProps {
  job: Job
  isSelected: boolean
  onClick: () => void
}

const LOGO_COLORS: Record<string, string> = {
  STC: 'bg-[var(--brand-severity-info-soft)] text-[var(--brand-accent)]',
  Talabat: 'bg-[var(--brand-severity-ok-soft)] text-[var(--brand-severity-ok)]',
  Careem: 'bg-[var(--brand-severity-med-soft)] text-[var(--brand-severity-med)]',
  NEOM: 'bg-[var(--brand-bg-2)] text-[var(--brand-ink-2)]',
  Geidea: 'bg-[var(--brand-severity-info-soft)] text-[var(--brand-accent)]',
  'Emirates NBD': 'bg-[var(--brand-severity-info-soft)] text-[var(--brand-accent)]',
}

function scoreColor(score?: number): string {
  if (!score) return 'text-[var(--brand-ink-3)]'
  if (score >= 4.0) return 'text-[var(--brand-severity-ok)]'
  if (score >= 3.5) return 'text-[var(--brand-severity-med)]'
  return 'text-[var(--brand-severity-high)]'
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const logoColor = LOGO_COLORS[job.company] ?? 'bg-[var(--brand-bg-2)] text-[var(--brand-ink-2)]'
  const initial = job.company[0].toUpperCase()

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-[10px] p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-[var(--brand-accent)] bg-[var(--brand-severity-info-soft)] shadow-[0_2px_20px_rgba(69,132,255,0.15)]'
          : 'border-[var(--brand-line)] hover:border-[var(--brand-accent)] hover:shadow-[0_2px_16px_rgba(69,132,255,0.1)]'
      }`}
    >
      <div className="flex items-start gap-2.5 mb-2.5">
        {job.isNew && (
          <div className="w-2 h-2 rounded-full bg-[var(--brand-accent)] flex-shrink-0 mt-1" />
        )}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-extrabold flex-shrink-0 ${logoColor}`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-[var(--brand-ink-0)] truncate">{job.title}</div>
          <div className="text-[11px] text-[var(--brand-ink-2)] mt-0.5">{job.company} · {job.location}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-[13px] font-extrabold ${scoreColor(job.matchScore)}`}>
            {job.matchScore?.toFixed(1) ?? '—'}
          </div>
          <div className="text-[10px] text-[var(--brand-ink-3)]">match</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.isNew && (
          <span className="bg-[var(--brand-severity-info-soft)] text-[var(--brand-accent)] text-[10px] font-semibold px-2 py-0.5 rounded-full">New</span>
        )}
        {job.isVision2030 && (
          <span className="bg-[var(--brand-severity-ok-soft)] text-[var(--brand-severity-ok)] text-[10px] font-semibold px-2 py-0.5 rounded-full">Vision 2030</span>
        )}
        <span className="bg-[var(--brand-bg-2)] text-[var(--brand-ink-2)] text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
          {job.remoteType}
        </span>
        <span className="bg-[var(--brand-bg-2)] text-[var(--brand-ink-2)] text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {job.roleCategory.toUpperCase().replace('-', ' / ')}
        </span>
      </div>
    </div>
  )
}
