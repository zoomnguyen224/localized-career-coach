'use client'

import { useState, useMemo } from 'react'
import { Job, FilterState } from '@/types/jobs'
import { FilterBar } from './FilterBar'
import { JobList } from './JobList'
import { JobDetail } from './JobDetail'

const DEFAULT_FILTERS: FilterState = {
  category: 'all',
  minScore: null,
  remoteOnly: false,
  countries: [],
}

// Placeholder CV — in Plan 2 this comes from the real parsed CV
const DEMO_CV = `# Ahmed Nasser
Senior AI Engineer with 6+ years experience in LLM pipelines, RAG systems, and Generative AI.
Skills: Python, LangChain, RAG, LLM fine-tuning, FastAPI, Docker, AWS, Arabic NLP.
Experience: Careem (AI Platform Lead), Souq/Amazon (ML Engineer).`

interface JobsPageClientProps {
  initialJobs: Job[]
}

export function JobsPageClient({ initialJobs }: JobsPageClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selectedJob, setSelectedJob] = useState<Job | null>(initialJobs[0] ?? null)
  const [isScanning, setIsScanning] = useState(false)

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filters.category !== 'all' && job.roleCategory !== filters.category) return false
      if (filters.minScore && (job.matchScore ?? 0) < filters.minScore) return false
      if (filters.remoteOnly && job.remoteType !== 'remote') return false
      if (filters.countries.length > 0 && !filters.countries.includes(job.country as typeof filters.countries[number])) return false
      return true
    })
  }, [jobs, filters])

  async function refreshJobs() {
    setIsScanning(true)
    try {
      const res = await fetch('/api/jobs/scan')
      const data = await res.json()
      if (data.jobs) setJobs(data.jobs)
    } catch {
      // keep existing jobs
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--brand-ink-0)]">Job Matches</h1>
          <p className="text-[12px] text-[var(--brand-ink-2)] mt-0.5">
            Agent-scanned from Greenhouse, Lever, Ashby · MENA companies
          </p>
        </div>
        <button
          onClick={refreshJobs}
          disabled={isScanning}
          className="flex items-center gap-2 bg-[var(--brand-severity-info-soft)] border border-[var(--brand-severity-info-soft)] text-[var(--brand-accent)] text-[12px] font-semibold px-3.5 py-1.5 rounded-full"
        >
          {isScanning ? (
            <><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-severity-ok)] animate-pulse" /> Scanning…</>
          ) : (
            'Scan for new jobs'
          )}
        </button>
      </div>

      {/* Filter bar */}
      <FilterBar filters={filters} totalCount={filteredJobs.length} onChange={setFilters} />

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Job list */}
        <div className="w-[360px] flex-shrink-0 overflow-y-auto border-r border-[var(--brand-line)] bg-[var(--brand-bg-1)]">
          <JobList jobs={filteredJobs} selectedJobId={selectedJob?.id ?? null} onSelect={setSelectedJob} />
        </div>

        {/* Job detail */}
        {selectedJob ? (
          <JobDetail job={selectedJob} cvMarkdown={DEMO_CV} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--brand-ink-3)] text-sm font-semibold">
            Select a job to see details
          </div>
        )}
      </div>
    </div>
  )
}
