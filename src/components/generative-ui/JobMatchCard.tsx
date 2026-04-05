import type { JobMarketScanResult, JobMatch } from '@/types'

function MatchScorePill({ score }: { score: number }) {
  if (score >= 70) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green/15 text-green">
        {score}% match
      </span>
    )
  }
  if (score >= 50) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue/10 text-blue">
        {score}% match
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      {score}% match
    </span>
  )
}

function JobMatchItem({ job }: { job: JobMatch }) {
  const visibleGaps = job.keyGaps.slice(0, 3)

  return (
    <div className="bg-white rounded-[10px] border border-border p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-navy text-sm leading-snug">{job.company}</p>
          <p className="text-sm text-navy/80">{job.title}</p>
        </div>
        <MatchScorePill score={job.matchScore} />
      </div>

      <p className="text-xs text-muted flex items-center gap-1">
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {job.location}
      </p>

      <p className="text-sm font-semibold text-green">{job.salaryRange}</p>

      {visibleGaps.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleGaps.map((gap) => (
            <span
              key={gap}
              className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-500 border border-red-100"
            >
              {gap}
            </span>
          ))}
          {job.keyGaps.length > 3 && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-400 border border-gray-100">
              +{job.keyGaps.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function JobMatchCard({ result }: { result: JobMarketScanResult }) {
  return (
    <div className="rounded-[10px] shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] bg-white p-5 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-navy">Job Market Scan</h2>
        <p className="text-sm text-muted mt-0.5">
          {result.totalOpportunities}+ opportunities in MENA
        </p>
      </div>

      {/* Two sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Apply Now */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green shrink-0" />
            <h3 className="text-sm font-semibold text-navy">Apply Now</h3>
          </div>
          {result.immediateMatches.length === 0 ? (
            <p className="text-xs text-muted italic">No immediate matches found.</p>
          ) : (
            result.immediateMatches.map((job, i) => (
              <JobMatchItem key={`immediate-${i}`} job={job} />
            ))
          )}
        </div>

        {/* After Learning Path */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue shrink-0" />
            <h3 className="text-sm font-semibold text-navy">After Learning Path</h3>
          </div>
          {result.futureMatches.length === 0 ? (
            <p className="text-xs text-muted italic">No future matches found.</p>
          ) : (
            result.futureMatches.map((job, i) => (
              <JobMatchItem key={`future-${i}`} job={job} />
            ))
          )}
        </div>
      </div>

      {/* Market Insight */}
      <div className="bg-blue/5 border border-blue/20 rounded-[10px] p-3">
        <p className="text-xs font-semibold text-blue mb-1">Market Insight</p>
        <p className="text-xs text-navy/80 leading-relaxed">{result.marketInsight}</p>
      </div>
    </div>
  )
}
