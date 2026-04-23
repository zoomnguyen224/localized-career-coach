import type { CompanyProcess } from '@/types/interview'

interface CompanyIntelBannerProps {
  company: string
  role: string
  process?: CompanyProcess
}

export function CompanyIntelBanner({ company, role, process }: CompanyIntelBannerProps) {
  const stats = [
    { label: 'Rounds', value: process ? `${process.rounds}` : '—' },
    { label: 'Duration', value: process?.duration ?? '—' },
    { label: 'Offer Rate', value: process?.offerRate ?? '—' },
    { label: 'Language', value: process?.language ?? '—' },
  ]

  return (
    <div className="bg-[var(--brand-ink-0)] rounded-[10px] p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/20 flex items-center justify-center text-[11px] font-bold text-white">
          {company.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-[13px] font-extrabold text-white">{company}</div>
          <div className="text-[10px] text-[var(--brand-ink-3)]">{role}</div>
        </div>
        <div className="ml-auto bg-[var(--brand-accent)]/20 px-2 py-1 rounded-full">
          <span className="text-[9px] font-bold text-[var(--brand-accent)]">MENA Intel</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white/5 rounded-lg px-2.5 py-2">
            <div className="text-[9px] text-[var(--brand-ink-3)] font-semibold uppercase tracking-wide">{stat.label}</div>
            <div className="text-[11px] font-bold text-white mt-0.5">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
