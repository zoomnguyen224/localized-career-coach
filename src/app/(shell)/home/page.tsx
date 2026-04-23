import { Suspense } from 'react'
import styles from './home.module.css'
import { Hero } from '@/components/primitives/Hero'
import { HomePageClient } from '@/components/home/HomePageClient'
import { DEMO_AHMED_GRAPH } from '@/lib/career-map'

export default function HomePage() {
  return (
    <main className={styles.page}>
      <Hero
        title={<>Good morning, Ahmed.</>}
        subtitle={
          <>
            The world moved overnight — here&apos;s what it means for <em>you</em>.
          </>
        }
        byline={[
          { label: 'Cairo', value: '08:14 local' },
          { label: 'Map synced', value: '2m ago', dotColor: 'var(--brand-emerald)' },
        ]}
      />
      <Suspense fallback={null}>
        <HomePageClient
          demoFallback={DEMO_AHMED_GRAPH}
          learnerName="Ahmed · Final year, CS"
          learnerTagline="Cairo University · 3w on map"
        />
      </Suspense>
      <NotHere />
    </main>
  )
}

/* ── 'not on this page' — static server content ─────────────────────────── */
function NotHere() {
  const items = [
    'Course catalog grid',
    'Search-bar CTA',
    'Community feed',
    'Streaks · XP · badges',
    '"Recommended for you" carousels',
    'Announcements widget',
    'Calendar block',
    'Chatbot input',
    'Every pixel → placement.',
  ]
  return (
    <div className={styles.notHere}>
      <h5>
        What we chose not to build
        <small>The homepage is an opinion, not a menu.</small>
      </h5>
      <ul>
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
