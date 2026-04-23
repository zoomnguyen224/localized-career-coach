import { Suspense } from 'react'
import { Hero } from '@/components/primitives/Hero'
import { CVPageClient } from '@/components/cv/CVPageClient'
import styles from './cv.module.css'

export default function CVPage() {
  return (
    <main className={styles.page}>
      <Hero
        title={<>Your CV, <em>alive</em>.</>}
        subtitle={<>Shaped by every job you chase.</>}
      />
      <Suspense fallback={null}>
        <CVPageClient />
      </Suspense>
    </main>
  )
}
