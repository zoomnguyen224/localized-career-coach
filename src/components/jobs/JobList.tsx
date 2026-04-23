import { Job } from '@/types/jobs'
import { JobCard } from './JobCard'

interface JobListProps {
  jobs: Job[]
  selectedJobId: string | null
  onSelect: (job: Job) => void
}

export function JobList({ jobs, selectedJobId, onSelect }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--brand-ink-3)] text-sm font-semibold">
        No jobs match your filters
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          isSelected={job.id === selectedJobId}
          onClick={() => onSelect(job)}
        />
      ))}
    </div>
  )
}
