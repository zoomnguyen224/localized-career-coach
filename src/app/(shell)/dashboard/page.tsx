import { Hero } from '@/components/primitives/Hero'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  return (
    <main className={styles.page}>
      <Hero
        title={<>Your pipeline, <em>at a glance</em>.</>}
        subtitle={<>What changed since yesterday.</>}
      />
      <DashboardClient />
    </main>
  )
}
