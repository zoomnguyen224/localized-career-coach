import { Hero } from '@/components/primitives/Hero'
import { SectionLabel } from '@/components/primitives/SectionLabel'
import { ApplicationsPageClient } from '@/components/applications/ApplicationsPageClient'
import styles from './applications.module.css'

export default function ApplicationsPage() {
  return (
    <main className={styles.page}>
      <Hero
        title={<>Applications, <em>in motion</em>.</>}
        subtitle={<>Waiting on them, waiting on you — tracked here.</>}
      />
      <section>
        <SectionLabel number="01" title="Pipeline" />
        <ApplicationsPageClient />
      </section>
    </main>
  )
}
