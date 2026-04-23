import { Suspense } from 'react'
import { Hero } from '@/components/primitives/Hero'
import { InterviewPageClient } from '@/components/interview/InterviewPageClient'
import styles from './interview.module.css'

export default function InterviewPage() {
  return (
    <main className={styles.page}>
      <Hero
        title={<>Ready when they call, <em>Ahmed</em>.</>}
        subtitle={<>Sharpen your answers — tailored to the roles you&apos;re chasing.</>}
      />
      <Suspense fallback={null}>
        <InterviewPageClient />
      </Suspense>
    </main>
  )
}
