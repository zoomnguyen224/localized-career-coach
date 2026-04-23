// src/components/home/HomePageClient.tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import styles from '@/app/(shell)/home/home.module.css'
import { SectionLabel } from '@/components/primitives/SectionLabel'
import { SeverityCard } from '@/components/primitives/SeverityCard'
import { DataRow } from '@/components/primitives/DataRow'
import { loadGraph, type CareerGraph, type CareerNode } from '@/lib/career-map'
import { DEMO_AHMED_LAYOUT } from '@/lib/career-map/demo-ahmed'
import { getActiveThreadId } from '@/lib/conversation-store'
import { CareerMapSection } from './CareerMapSection'

interface HomePageClientProps {
  /** Deck fixture used as the first-load / unauthenticated fallback. */
  demoFallback: CareerGraph
  /** Learner-name headline for the "You are here" badge. */
  learnerName: string
  /** Muted sub-line under the learner name. */
  learnerTagline: string
}

function topGap(graph: CareerGraph): CareerNode | undefined {
  return graph.nodes
    .filter(n => n.kind === 'skill' && (n.status === 'gap' || n.status === 'weak'))
    .sort((a, b) => b.weight - a.weight)[0]
}

function primaryRoleLabel(graph: CareerGraph): string {
  const roles = graph.nodes.filter(n => n.kind === 'role')
  return roles[0]?.label ?? 'your target role'
}

export function HomePageClient({
  demoFallback,
  learnerName,
  learnerTagline,
}: HomePageClientProps) {
  // Start with the demo fallback. `useEffect` swaps in the learner's map if
  // one is persisted for the active thread. Starting with the same value
  // the server rendered avoids a hydration mismatch.
  const [graph, setGraph] = useState<CareerGraph>(demoFallback)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const learnerId = getActiveThreadId()
    if (!learnerId) {
      setHydrated(true)
      return
    }
    const stored = loadGraph(learnerId)
    if (stored) setGraph(stored)
    setHydrated(true)
  }, [])

  const isDemo = graph === demoFallback
  const layoutOverride = isDemo ? DEMO_AHMED_LAYOUT : undefined

  const primaryLabel = primaryRoleLabel(graph)
  const primaryCompany = primaryLabel.split(' · ')[1] ?? primaryLabel
  const gap = useMemo(() => topGap(graph), [graph])

  return (
    <>
      <MarketRadarSection matchScore={graph.matchScore} primaryCompany={primaryCompany} />
      <CareerMapSection
        graph={graph}
        layoutOverride={layoutOverride}
        learnerName={learnerName}
        learnerTagline={learnerTagline}
      />
      <NextMoveSection graph={graph} />
      {/* NotHereSection is rendered by the server shell — it's static. */}

      {!hydrated ? (
        // An invisible marker lets us assert hydration state in tests
        // without shifting layout.
        <span data-testid="home-hydrating" className="sr-only">
          loading your map…
        </span>
      ) : null}
      {hydrated && isDemo ? (
        <span data-testid="home-demo-fallback" className="sr-only">
          demo fallback active
        </span>
      ) : null}
      {hydrated && !isDemo ? (
        <span data-testid="home-user-graph" className="sr-only">
          user graph loaded
        </span>
      ) : null}
    </>
  )

  // Section components defined inside the default export are also fine, but
  // keeping them at module scope below makes them easier to test and lint.
}

/* ── Market Radar — three hardcoded signals per Task 2 spec. Task 3 will
      replace these with computed signals. Only the role name + match % are
      derived from the loaded graph. ─────────────────────────────────────── */
function MarketRadarSection({
  matchScore,
  primaryCompany,
}: {
  matchScore: number
  primaryCompany: string
}) {
  return (
    <section className={styles.radar}>
      <SectionLabel number="01" title="Market Radar" meta="Updated for you · 08:14 local" />

      <div className={styles.radarGrid}>
        <SeverityCard
          tone="high"
          label="High signal"
          when="2 days ago"
          title={`${primaryCompany} rewrote the Junior Data Engineer JD.`}
          forYou={{
            label: 'What it means for you',
            body: (
              <>
                Current match <span className={styles.delta}>{matchScore}%</span>. They now require{' '}
                <b>SQL window functions</b> — a skill worth shoring up.
              </>
            ),
          }}
          eventsHeader="The job itself"
        >
          <DataRow
            href="#"
            logo={<span className={`${styles.evLogo} ${styles.nb}`}>SA</span>}
            title={`Jr. Data Engineer · ${primaryCompany}`}
            sub="Dhahran / Remote · updated 2d ago"
            tail={{ text: `${matchScore}%`, tone: matchScore >= 70 ? 'up' : 'down' }}
          />
        </SeverityCard>

        <SeverityCard
          tone="med"
          label="Medium signal"
          when="this month"
          title="Gulf employers are hiring remote workers from Egypt."
          forYou={{
            label: 'What it means for you',
            body: (
              <>
                Remote Gulf postings <span className={`${styles.delta} ${styles.up}`}>+34%</span>.{' '}
                <b>3 new roles</b> match your profile — two strong, one worth a look.
              </>
            ),
          }}
          eventsHeader="Top 2 matches · of 3"
        >
          <DataRow
            href="#"
            logo={<span className={`${styles.evLogo} ${styles.vl}`}>VL</span>}
            title="Data Ops Engineer · Jr. · Veolia"
            sub="Remote → Riyadh · posted 4d ago"
            tail={{ text: '81%', tone: 'up' }}
          />
          <DataRow
            href="#"
            logo={<span className={`${styles.evLogo} ${styles.tr}`}>TM</span>}
            title="Applied Data Engineer · Trend Micro"
            sub="Remote → Dubai · posted 1w ago"
            tail={{ text: '74%', tone: 'up' }}
          />
        </SeverityCard>

        <SeverityCard
          tone="info"
          label="Informational"
          when="12-week drift"
          title="SQL window functions went from nice-to-have to required."
          forYou={{
            label: 'What it means for you',
            body: (
              <>
                Now in <span className={`${styles.delta} ${styles.neutral}`}>78%</span> of Data Eng
                postings (was 52%). Learning <b>this one skill</b> recovers match.
              </>
            ),
          }}
          eventsHeader="Event that closes the gap"
        >
          <DataRow
            href="#"
            logo={
              <span className={`${styles.evLogo} ${styles.evt}`}>
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 9h18M8 3v4M16 3v4" />
                </svg>
              </span>
            }
            title="Workshop · SQL Window Functions in Practice"
            sub="Localized · Live · 90 min"
            tail={{ text: 'May 14', tone: 'neutral' }}
          />
        </SeverityCard>
      </div>
    </section>
  )
}

/* ── Next Move — derived from the graph's highest-weight gap (placeholder
      for Task 3's shortest-path computation). ──────────────────────────── */
function NextMoveSection({ graph }: { graph: CareerGraph }) {
  const gap = topGap(graph)
  const primary = primaryRoleLabel(graph)
  const roleShort = primary.split(' · ')[1] ?? primary
  const gapLabel = gap?.label ?? 'your top priority skill'
  const expectedLift = gap ? Math.max(2, Math.round(gap.weight * 5)) : 3

  return (
    <section className={styles.move}>
      <SectionLabel number="03" title="Your Next Move" meta="One action · chosen by your agent" />

      <div className={styles.moveCard}>
        <div>
          <div className={styles.moveEyebrow}>
            <svg
              className={styles.sparkle}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
            </svg>
            Your one move this week
          </div>

          <h2>
            Mock interview — <em>{roleShort}</em>.<br />
            20&nbsp;min, today.
          </h2>

          <p className={styles.moveWhy}>
            Agent detected <b>{gapLabel} is your top gap</b>. This mock will stress-test it in a
            live interview flow — then auto-suggest a 25-min lesson based on where you stumble.
          </p>

          <div className={styles.moveCta}>
            <button type="button" className={styles.btnPrimary}>
              Start Interview Studio
              <svg className={styles.ic} viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <Link href="#" className={styles.btnGhostLink}>
              Not now — show me 2 alternatives
            </Link>
          </div>

          <div className={styles.moveMeta}>
            <span>
              Your coach <b>scheduled this</b> from your Career Map
            </span>
            <span className={styles.dot} />
            <span>
              Agent confidence: <span className={styles.conf}>HIGH</span>
            </span>
            <span className={styles.dot} />
            <span>
              Expected lift: <b>+{expectedLift}% match</b>
            </span>
          </div>
        </div>

        <aside className={styles.session}>
          <div className={styles.sTop}>
            <span>Interview Studio</span>
            <span className={styles.live}>
              <span className={styles.dot} /> Voice · Live
            </span>
          </div>
          <div className={styles.sTitle}>
            4 questions · weighted toward {gapLabel}.
          </div>
          <div className={styles.sKv}>
            <div>
              <div className={styles.k}>Duration</div>
              <div className={styles.v}>20 min</div>
            </div>
            <div>
              <div className={styles.k}>Mode</div>
              <div className={styles.v}>Voice</div>
            </div>
            <div>
              <div className={styles.k}>Focus</div>
              <div className={styles.v}>{gapLabel.split(' · ')[0].slice(0, 10)}</div>
            </div>
            <div>
              <div className={styles.k}>Difficulty</div>
              <div className={styles.v}>Junior+</div>
            </div>
          </div>
          <div className={styles.sFooter}>Tailored from JD · updated 2d ago</div>
        </aside>
      </div>
    </section>
  )
}
