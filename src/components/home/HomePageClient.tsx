// src/components/home/HomePageClient.tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import styles from '@/app/(shell)/home/home.module.css'
import { SectionLabel } from '@/components/primitives/SectionLabel'
import { SeverityCard } from '@/components/primitives/SeverityCard'
import { DataRow } from '@/components/primitives/DataRow'
import {
  applyRadarSignals,
  computeNextMove,
  DEFAULT_MENA_SIGNALS,
  loadGraph,
  type CareerGraph,
  type NextMove,
  type RadarSignal,
} from '@/lib/career-map'
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

function primaryRoleLabel(graph: CareerGraph): string {
  const roles = graph.nodes.filter(n => n.kind === 'role')
  const target = roles.find(r => r.id === `role:${graph.targetRoleId}`) ?? roles[0]
  return target?.label ?? 'your target role'
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

  // Radar + Next Move are pure functions of the graph. `useMemo` keeps them
  // stable across re-renders that don't actually change the graph reference.
  const { radarGraph, cards } = useMemo(() => {
    const { graph: g, cards: c } = applyRadarSignals(graph, DEFAULT_MENA_SIGNALS)
    return { radarGraph: g, cards: c }
  }, [graph])

  const nextMove = useMemo(() => computeNextMove(radarGraph), [radarGraph])

  return (
    <>
      <MarketRadarSection cards={cards} primaryRoleLabel={primaryRoleLabel(radarGraph)} />
      <CareerMapSection
        graph={radarGraph}
        layoutOverride={layoutOverride}
        learnerName={learnerName}
        learnerTagline={learnerTagline}
      />
      <NextMoveSection
        nextMove={nextMove}
        primaryRoleLabel={primaryRoleLabel(radarGraph)}
        targetRoleId={radarGraph.targetRoleId}
      />
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
}

/* ── Market Radar — rendered from the RadarSignal cards returned by
      applyRadarSignals. Each card gets a SeverityCard; the contextual
      footer rows are a small deck-literal mapping keyed on signal id so
      we preserve the visual richness without coupling business logic to
      the copy. ───────────────────────────────────────────────────────── */

interface MarketRadarSectionProps {
  cards: RadarSignal[]
  primaryRoleLabel: string
}

function MarketRadarSection({ cards, primaryRoleLabel }: MarketRadarSectionProps) {
  return (
    <section className={styles.radar}>
      <SectionLabel number="01" title="Market Radar" meta="Updated for you · 08:14 local" />

      <div className={styles.radarGrid}>
        {cards.map(card => (
          <SeverityCard
            key={card.id}
            tone={card.severity}
            label={severityLabel(card.severity)}
            when={card.when ?? ''}
            title={card.headline}
            forYou={{
              label: 'What it means for you',
              body: card.body,
            }}
            eventsHeader={eventsHeaderFor(card)}
          >
            {radarFooterRowsFor(card, primaryRoleLabel)}
          </SeverityCard>
        ))}
      </div>
    </section>
  )
}

function severityLabel(s: RadarSignal['severity']): string {
  if (s === 'high') return 'High signal'
  if (s === 'med') return 'Medium signal'
  return 'Informational'
}

function eventsHeaderFor(card: RadarSignal): string | undefined {
  switch (card.id) {
    case 'signal:aramco-jd-update':
      return 'The job itself'
    case 'signal:gulf-remote-uptick':
      return 'Top 2 matches · of 3'
    case 'signal:sql-window-market':
      return 'Event that closes the gap'
    default:
      return undefined
  }
}

/** Footer rows under each radar card — decorative, deck-literal DataRows
 *  keyed by signal id. Kept as a switch so adding a new signal produces a
 *  TypeScript-visible hole to fill in. */
function radarFooterRowsFor(
  card: RadarSignal,
  primaryRoleLabel: string
): React.ReactNode {
  const primaryCompany = primaryRoleLabel.split(' · ')[1] ?? primaryRoleLabel
  switch (card.id) {
    case 'signal:aramco-jd-update':
      return (
        <DataRow
          href="#"
          logo={<span className={`${styles.evLogo} ${styles.nb}`}>SA</span>}
          title={`Jr. Data Engineer · ${primaryCompany}`}
          sub="Dhahran / Remote · updated 2d ago"
          tail={{ text: '68%', tone: 'down' }}
        />
      )
    case 'signal:gulf-remote-uptick':
      return (
        <>
          <DataRow
            href="#"
            logo={<span className={`${styles.evLogo} ${styles.vl}`}>VL</span>}
            title="Data Ops Engineer · Jr. · Veolia"
            sub="Remote -> Riyadh · posted 4d ago"
            tail={{ text: '81%', tone: 'up' }}
          />
          <DataRow
            href="#"
            logo={<span className={`${styles.evLogo} ${styles.tr}`}>TM</span>}
            title="Applied Data Engineer · Trend Micro"
            sub="Remote -> Dubai · posted 1w ago"
            tail={{ text: '74%', tone: 'up' }}
          />
        </>
      )
    case 'signal:sql-window-market':
      return (
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
      )
    default:
      return null
  }
}

/* ── Next Move — rendered from computeNextMove. When the compute returns
      null we show a silence-beats-filler fallback. ─────────────────────── */

interface NextMoveSectionProps {
  nextMove: NextMove | null
  primaryRoleLabel: string
  targetRoleId: string | null
}

function NextMoveSection({
  nextMove,
  primaryRoleLabel,
  targetRoleId,
}: NextMoveSectionProps) {
  const roleShort = primaryRoleLabel.split(' · ')[1] ?? primaryRoleLabel

  if (!nextMove) {
    return (
      <section className={styles.move}>
        <SectionLabel number="03" title="Your Next Move" meta="One action · chosen by your agent" />
        <div className={styles.moveCard}>
          <div>
            <div className={styles.moveEyebrow}>Your one move this week</div>
            <h2>Not here yet.</h2>
            <p className={styles.moveWhy}>
              Your agent doesn&apos;t have enough signal to recommend a move with confidence.
              Complete a CV parse or run a mock interview to give it more context.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const confidencePct = Math.round(nextMove.confidence * 100)
  const confidenceLabel =
    nextMove.confidence >= 0.75 ? 'HIGH' : nextMove.confidence >= 0.5 ? 'MED' : 'LOW'

  // The interview route accepts a target-role hint in the query string so the
  // agent's first turn can ground itself against the right JD.
  const interviewHref =
    targetRoleId != null
      ? `/interview?targetRoleId=${encodeURIComponent(targetRoleId)}`
      : '/interview'

  // Only `mock` actions actually wire up to /interview in Task 3. `module`
  // and `application` stay as placeholder buttons pending Tasks 4/5.
  const primaryIsLink = nextMove.actionKind === 'mock'
  const ctaLabel =
    nextMove.actionKind === 'mock'
      ? 'Start Interview Studio'
      : nextMove.actionKind === 'application'
      ? 'Open application'
      : 'Start lesson'

  const h2 = headlineFor(nextMove, roleShort)

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

          <h2>{h2}</h2>

          <p className={styles.moveWhy}>{nextMove.rationale}</p>

          <div className={styles.moveCta}>
            {primaryIsLink ? (
              <Link href={interviewHref} className={styles.btnPrimary}>
                {ctaLabel}
                <svg className={styles.ic} viewBox="0 0 24 24">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            ) : (
              <button type="button" className={styles.btnPrimary}>
                {ctaLabel}
                <svg className={styles.ic} viewBox="0 0 24 24">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            )}
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
              Agent confidence: <span className={styles.conf}>{confidenceLabel}</span>
              <span className={styles.dot} style={{ marginLeft: 8 }} />
              <span style={{ marginLeft: 8 }}>({confidencePct}%)</span>
            </span>
            <span className={styles.dot} />
            <span>
              Expected lift:{' '}
              <b>
                {nextMove.expectedMatchDelta > 0 ? '+' : ''}
                {nextMove.expectedMatchDelta}% match
              </b>
            </span>
          </div>
        </div>

        <aside className={styles.session}>
          <div className={styles.sTop}>
            <span>{sessionLabelFor(nextMove)}</span>
            {nextMove.actionKind === 'mock' ? (
              <span className={styles.live}>
                <span className={styles.dot} /> Voice · Live
              </span>
            ) : null}
          </div>
          <div className={styles.sTitle}>{nextMove.label}</div>
          <div className={styles.sKv}>
            <div>
              <div className={styles.k}>Duration</div>
              <div className={styles.v}>{durationFor(nextMove)}</div>
            </div>
            <div>
              <div className={styles.k}>Mode</div>
              <div className={styles.v}>{modeFor(nextMove)}</div>
            </div>
            <div>
              <div className={styles.k}>Focus</div>
              <div className={styles.v}>{focusFor(nextMove)}</div>
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

function headlineFor(move: NextMove, roleShort: string): React.ReactNode {
  if (move.actionKind === 'mock') {
    return (
      <>
        Mock interview — <em>{roleShort}</em>.<br />
        20&nbsp;min, today.
      </>
    )
  }
  if (move.actionKind === 'application') {
    return (
      <>
        Ready to apply to <em>{roleShort}</em>.<br />
        Prereqs confirmed.
      </>
    )
  }
  // module
  return (
    <>
      Complete today&apos;s lesson.<br />
      25&nbsp;min, focused.
    </>
  )
}

function sessionLabelFor(move: NextMove): string {
  if (move.actionKind === 'mock') return 'Interview Studio'
  if (move.actionKind === 'application') return 'Application'
  return 'Lesson'
}

function durationFor(move: NextMove): string {
  // Try to pull the "· N min" suffix from the computed label; fall back to
  // sensible defaults per action kind.
  const m = move.label.match(/(\d+)\s*min/)
  if (m) return `${m[1]} min`
  if (move.actionKind === 'mock') return '20 min'
  if (move.actionKind === 'application') return '—'
  return '25 min'
}

function modeFor(move: NextMove): string {
  if (move.actionKind === 'mock') return 'Voice'
  if (move.actionKind === 'application') return 'Apply'
  return 'Self-paced'
}

function focusFor(move: NextMove): string {
  // nodeId is a slug like `skill:sql-window-fns` — trim the prefix and
  // the kebab case for a compact display.
  const bare = move.nodeId.replace(/^skill:|^role:/, '').replace(/-/g, ' ')
  return bare.length > 12 ? bare.slice(0, 10) + '…' : bare
}
