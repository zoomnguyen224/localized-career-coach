import { Job } from '@/types/jobs'

interface JobCardProps {
  job: Job
  isSelected: boolean
  onClick: () => void
}

const LOGO_COLORS: Record<string, string> = {
  STC: 'bg-[#ECF3FF] text-[#4584FF]',
  Talabat: 'bg-[#E6FAF4] text-[#009C6C]',
  Careem: 'bg-[#FFF4E6] text-[#FAA82C]',
  NEOM: 'bg-[#F2F3F6] text-[#727998]',
  Geidea: 'bg-[#ECF3FF] text-[#4584FF]',
  'Emirates NBD': 'bg-[#F0F4FF] text-[#4584FF]',
}

function scoreColor(score?: number): string {
  if (!score) return 'text-[#8D96B4]'
  if (score >= 4.0) return 'text-[#03BA82]'
  if (score >= 3.5) return 'text-[#FAA82C]'
  return 'text-[#F84E4E]'
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const logoColor = LOGO_COLORS[job.company] ?? 'bg-[#F2F3F6] text-[#727998]'
  const initial = job.company[0].toUpperCase()

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-[10px] p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-[#4584FF] bg-[#F8FBFF] shadow-[0_2px_20px_rgba(69,132,255,0.15)]'
          : 'border-[#DCDFE8] hover:border-[#4584FF] hover:shadow-[0_2px_16px_rgba(69,132,255,0.1)]'
      }`}
    >
      <div className="flex items-start gap-2.5 mb-2.5">
        {job.isNew && (
          <div className="w-2 h-2 rounded-full bg-[#4584FF] flex-shrink-0 mt-1" />
        )}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-extrabold flex-shrink-0 ${logoColor}`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-[#06123C] truncate">{job.title}</div>
          <div className="text-[11px] text-[#727998] mt-0.5">{job.company} · {job.location}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-[13px] font-extrabold ${scoreColor(job.matchScore)}`}>
            {job.matchScore?.toFixed(1) ?? '—'}
          </div>
          <div className="text-[10px] text-[#8D96B4]">match</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.isNew && (
          <span className="bg-[#ECF3FF] text-[#4584FF] text-[10px] font-semibold px-2 py-0.5 rounded-full">New</span>
        )}
        {job.isVision2030 && (
          <span className="bg-[#E6FAF4] text-[#009C6C] text-[10px] font-semibold px-2 py-0.5 rounded-full">Vision 2030</span>
        )}
        <span className="bg-[#F2F3F6] text-[#727998] text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
          {job.remoteType}
        </span>
        <span className="bg-[#F2F3F6] text-[#727998] text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {job.roleCategory.toUpperCase().replace('-', ' / ')}
        </span>
      </div>
    </div>
  )
}
