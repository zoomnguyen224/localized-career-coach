import { scanAllMENAPortals } from '@/lib/agents/job-scanner'
import { JobsPageClient } from '@/components/jobs/JobsPageClient'

export default async function JobsPage() {
  // Server-side initial data fetch — fast first load
  const jobs = await scanAllMENAPortals()

  return <JobsPageClient initialJobs={jobs} />
}
