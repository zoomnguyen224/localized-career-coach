import { scanAllMENAPortals } from '@/lib/agents/job-scanner'
import { Hero } from '@/components/primitives/Hero'
import { SectionLabel } from '@/components/primitives/SectionLabel'
import { JobsPageClient } from '@/components/jobs/JobsPageClient'
import styles from './jobs.module.css'

export default async function JobsPage() {
  const jobs = await scanAllMENAPortals()
  const count = jobs.length

  return (
    <main className={styles.page}>
      <Hero
        title={<>Good jobs don&apos;t wait, <em>Ahmed</em>.</>}
        subtitle={<>The {count} that opened overnight, ranked for you.</>}
        byline={[
          { label: 'Scanned', value: 'just now', dotColor: 'var(--brand-emerald)' },
        ]}
      />
      <section>
        <SectionLabel number="01" title="Fresh matches" meta="Today's deltas" />
        <JobsPageClient initialJobs={jobs} />
      </section>
    </main>
  )
}
