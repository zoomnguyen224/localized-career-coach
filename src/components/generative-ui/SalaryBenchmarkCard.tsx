import type { SalaryBenchmarkResult, SalaryRange } from '@/types'

const BAR_WIDTHS: Record<SalaryRange['level'], string> = {
  entry: 'w-[40%]',
  mid: 'w-[65%]',
  senior: 'w-full',
}

const LEVEL_LABELS: Record<SalaryRange['level'], string> = {
  entry: 'Entry',
  mid: 'Mid',
  senior: 'Senior',
}

function SalaryRow({ range }: { range: SalaryRange }) {
  const barWidth = BAR_WIDTHS[range.level]
  const label = LEVEL_LABELS[range.level]

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-navy">{label}</span>
        <span className="text-xs text-muted">
          {range.currency} {range.min.toLocaleString()} &ndash; {range.max.toLocaleString()}/mo
        </span>
      </div>
      <div className="w-full h-2 bg-blue/10 rounded-full overflow-hidden">
        <div className={`h-full bg-blue rounded-full ${barWidth}`} />
      </div>
    </div>
  )
}

export function SalaryBenchmarkCard({ result }: { result: SalaryBenchmarkResult }) {
  return (
    <div className="rounded-[10px] shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] bg-white p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h2 className="text-base font-bold text-navy">{result.role}</h2>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue/10 text-blue">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {result.location}
        </span>
      </div>

      {/* Salary ranges */}
      <div className="flex flex-col gap-3">
        {result.ranges.map((range) => (
          <SalaryRow key={range.level} range={range} />
        ))}
      </div>

      {/* Certification Premiums */}
      {result.certificationPremiums.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-navy">Certification Premiums</h3>
          <div className="flex flex-col gap-2">
            {result.certificationPremiums.map((cert, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-navy">{cert.certification}</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-green/15 text-green">
                      +{cert.premiumPercent}%
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{cert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-3">
        <p className="text-xs text-amber-800 leading-relaxed">{result.insight}</p>
        <p className="text-[10px] text-muted mt-1.5">Source: {result.source}</p>
      </div>
    </div>
  )
}
