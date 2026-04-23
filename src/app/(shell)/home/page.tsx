import Link from 'next/link'
import styles from './home.module.css'
import { Hero } from '@/components/primitives/Hero'
import { SectionLabel } from '@/components/primitives/SectionLabel'
import { SeverityCard } from '@/components/primitives/SeverityCard'
import { DataRow } from '@/components/primitives/DataRow'

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
      <MarketRadar />
      <CareerMap />
      <NextMove />
      <NotHere />
    </main>
  )
}

/* ── 1. MARKET RADAR ─────────────── */
function MarketRadar() {
  return (
    <section className={styles.radar}>
      <SectionLabel number="01" title="Market Radar" meta="Updated for Ahmed · 08:14 Cairo" />

      <div className={styles.radarGrid}>
        <SeverityCard
          tone="high"
          label="High signal"
          when="2 days ago"
          title="Northbay Energy rewrote the Junior Data Engineer JD."
          forYou={{
            label: 'What it means for you',
            body: (
              <>
                Match dropped <span className={styles.delta}>72 → 68%</span>. They now require{' '}
                <b>SQL window functions</b> — a skill you don&apos;t have yet.
              </>
            ),
          }}
          eventsHeader="The job itself"
        >
          <DataRow
            href="#"
            logo={<span className={`${styles.evLogo} ${styles.nb}`}>NB</span>}
            title="Jr. Data Engineer · Northbay Energy"
            sub="Dhahran / Remote · updated 2d ago"
            tail={{ text: '68%', tone: 'down' }}
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
                postings (was 52%). Learning <b>this one skill</b> recovers your Northbay match.
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

/* ── 2. CAREER MAP ─────────────────────────── */
function CareerMap() {
  return (
    <section className={styles.map}>
      <SectionLabel
        number="02"
        title="Your Career Map, responding"
        meta={
          <span className={styles.vstrip}>
            <span className={styles.vlbl}>Enrolled · 2 of 4</span>
            <span className={`${styles.vchip} ${styles.on} ${styles.ai}`}>
              <span className={styles.vdot} />
              AI &amp; Data
            </span>
            <span className={`${styles.vchip} ${styles.on} ${styles.virt}`}>
              <span className={styles.vdot} />
              Virtual Intelligence
            </span>
            <span className={`${styles.vchip} ${styles.green}`}>
              <span className={styles.vdot} />
              Green Skills
            </span>
            <span className={`${styles.vchip} ${styles.ready}`}>
              <span className={styles.vdot} />
              Career Readiness
            </span>
          </span>
        }
      />

      <div className={styles.mapWrap}>
        <div className={styles.mapCanvas}>
          <div className={styles.mapLegend}>
            <span>
              <span className={`${styles.sw} ${styles.confirmed}`} /> Confirmed
            </span>
            <span>
              <span className={`${styles.sw} ${styles.inprog}`} /> In progress
            </span>
            <span>
              <span className={`${styles.sw} ${styles.gap}`} /> Gap
            </span>
            <span>
              <span className={`${styles.sw} ${styles.target}`} /> Target
            </span>
          </div>

          <svg viewBox="0 0 900 520" preserveAspectRatio="xMidYMid meet">
            {/* edges */}
            <path className={`${styles.edge} ${styles.confirmed}`} d="M 170 300 Q 230 260 300 240" />
            <path className={`${styles.edge} ${styles.confirmed}`} d="M 170 300 Q 220 330 290 360" />
            <path className={`${styles.edge} ${styles.confirmed}`} d="M 170 300 Q 260 270 330 170" />
            <path className={`${styles.edge} ${styles.inprog}`} d="M 170 300 Q 240 400 320 440" />
            <path className={`${styles.edge} ${styles.gap}`} d="M 330 170 Q 400 140 470 130" />
            <path className={`${styles.edge} ${styles.gap}`} d="M 300 240 Q 380 200 470 130" />
            <path className={`${styles.edge} ${styles.inprog}`} d="M 300 240 Q 400 260 500 270" />
            <path className={`${styles.edge} ${styles.confirmed}`} d="M 290 360 Q 380 380 490 400" />
            <path className={`${styles.edge} ${styles.inprog}`} d="M 500 270 Q 560 220 630 220" />
            <path className={`${styles.edge} ${styles.inprog}`} d="M 490 400 Q 560 380 640 380" />
            <path className={`${styles.edge} ${styles.target} ${styles.hot}`} d="M 470 130 Q 600 130 720 155" />
            <path className={`${styles.edge} ${styles.target}`} d="M 630 220 Q 690 200 720 180" />
            <path className={`${styles.edge} ${styles.target}`} d="M 640 380 Q 700 360 730 340" />
            <path className={`${styles.edge} ${styles.target}`} d="M 500 270 Q 630 310 730 360" />

            {/* You are here */}
            <g className={styles.youCard} transform="translate(60,266)">
              <rect className={styles.ycBg} x="0" y="0" width="220" height="68" rx="10" />
              <text className={styles.ycSub} x="18" y="22">◆ You are here</text>
              <text className={styles.ycTitle} x="18" y="42">Ahmed · Final year, CS</text>
              <text className={styles.ycSub} x="18" y="58" style={{ opacity: 0.55 }}>
                Cairo University · 3w on map
              </text>
            </g>

            {/* Python (confirmed) */}
            <g transform="translate(300,240)">
              <circle r="8" fill="#16a34a" stroke="#16a34a" strokeWidth="2" />
              <circle className={`${styles.vtag} ${styles.ai}`} cx="7" cy="7" />
              <text className={styles.nodeLabel} y="-16">Python</text>
              <text className={styles.nodeSub} y="-28">CONFIRMED</text>
            </g>
            {/* SQL (confirmed) */}
            <g transform="translate(330,170)">
              <circle r="8" fill="#16a34a" stroke="#16a34a" strokeWidth="2" />
              <circle className={`${styles.vtag} ${styles.ai}`} cx="7" cy="7" />
              <text className={styles.nodeLabel} y="-16">SQL · basics</text>
              <text className={styles.nodeSub} y="-28">CONFIRMED</text>
            </g>
            {/* Git (confirmed) */}
            <g transform="translate(290,360)">
              <circle r="8" fill="#16a34a" stroke="#16a34a" strokeWidth="2" />
              <circle className={`${styles.vtag} ${styles.virt}`} cx="7" cy="7" />
              <text className={styles.nodeLabel} y="24">Git · Workflow</text>
              <text className={styles.nodeSub} y="36">CONFIRMED</text>
            </g>
            {/* Linux (in-progress) */}
            <g transform="translate(320,440)">
              <circle r="8" fill="#fff" stroke="#16a34a" strokeWidth="2" />
              <circle className={`${styles.vtag} ${styles.virt}`} cx="7" cy="7" />
              <text className={styles.nodeLabel} y="24">Linux / Shell</text>
              <text className={styles.nodeSub} y="36">IN PROGRESS</text>
            </g>

            {/* SQL window functions — the critical gap (pulsed) */}
            <g transform="translate(470,130)">
              <circle className={styles.pulseRing} r="12" />
              <circle r="12" fill="#e05a6a" stroke="#e05a6a" strokeWidth="2" />
              <circle r="4" fill="#fff" />
              <circle className={`${styles.vtag} ${styles.ai}`} cx="10" cy="10" />
              <text className={styles.nodeLabel} y="-22" style={{ fontWeight: 600, fill: '#0a1330' }}>
                SQL · Window Functions
              </text>
              <text className={styles.nodeSub} y="-34" style={{ fill: '#e05a6a', fontWeight: 600 }}>
                CRITICAL GAP · NEW
              </text>
            </g>

            {/* ETL (in progress) */}
            <g transform="translate(500,270)">
              <circle r="9" fill="#fff" stroke="#16a34a" strokeWidth="2" />
              <circle r="3" fill="#16a34a" />
              <circle className={`${styles.vtag} ${styles.ai}`} cx="8" cy="8" />
              <text className={styles.nodeLabel} y="-18">ETL pipelines</text>
              <text className={styles.nodeSub} y="-30">IN PROGRESS</text>
            </g>
            {/* Airflow (in progress) */}
            <g transform="translate(630,220)">
              <circle r="7" fill="#fff" stroke="#16a34a" strokeWidth="2" />
              <circle className={`${styles.vtag} ${styles.ai}`} cx="6" cy="6" />
              <text className={styles.nodeLabel} y="-16">Airflow</text>
              <text className={styles.nodeSub} y="-28">IN PROGRESS</text>
            </g>
            {/* Docker (confirmed) */}
            <g transform="translate(490,400)">
              <circle r="8" fill="#16a34a" stroke="#16a34a" strokeWidth="2" />
              <circle className={`${styles.vtag} ${styles.virt}`} cx="7" cy="7" />
              <text className={styles.nodeLabel} y="24">Docker basics</text>
              <text className={styles.nodeSub} y="36">CONFIRMED</text>
            </g>
            {/* Cloud (in progress) */}
            <g transform="translate(640,380)">
              <circle r="7" fill="#fff" stroke="#16a34a" strokeWidth="2" />
              <circle className={`${styles.vtag} ${styles.virt}`} cx="6" cy="6" />
              <text className={styles.nodeLabel} y="24">Cloud · AWS</text>
              <text className={styles.nodeSub} y="36">IN PROGRESS</text>
            </g>

            {/* Target role 1 — Northbay (primary, dropped) */}
            <g className={styles.roleCard} transform="translate(740,100)">
              <rect className={styles.rcBg} x="0" y="0" width="150" height="108" rx="10" />
              <text className={styles.rcCo} x="12" y="20">◆ TARGET</text>
              <text className={styles.rcTitle} x="12" y="40">Jr. Data Engineer</text>
              <text className={styles.rcCo} x="12" y="56">Northbay Energy</text>
              <text className={`${styles.rcMatch} ${styles.down}`} x="12" y="88">
                68<tspan fontSize="14">%</tspan>
              </text>
              <text className={`${styles.rcDelta} ${styles.down}`} x="52" y="88">72% → 68%</text>
              <text className={`${styles.rcDelta} ${styles.down}`} x="12" y="100">↓ after JD update</text>
            </g>

            {/* Target role 2 — Saudi Remote Ops */}
            <g className={`${styles.roleCard} ${styles.sec}`} transform="translate(740,310)">
              <rect className={styles.rcBg} x="0" y="0" width="150" height="108" rx="10" />
              <text className={styles.rcCo} x="12" y="20" style={{ fill: '#16a34a' }}>◇ SECONDARY</text>
              <text className={styles.rcTitle} x="12" y="40">Jr. Data Engineer</text>
              <text className={styles.rcCo} x="12" y="56">Saudi Remote Ops</text>
              <text className={`${styles.rcMatch} ${styles.up}`} x="12" y="88">
                81<tspan fontSize="14">%</tspan>
              </text>
              <text className={`${styles.rcDelta} ${styles.up}`} x="52" y="88">+3 this wk</text>
              <text className={`${styles.rcDelta} ${styles.up}`} x="12" y="100">↑ trending</text>
            </g>
          </svg>

          <div className={styles.mapMeta}>
            <strong>10 nodes visible</strong> · 14 edges · 2 targets · re-weighted 08:14
          </div>
        </div>

        {/* Top 3 gaps rail */}
        <aside className={styles.gaps}>
          <h4>
            Top 3 gaps · this week <small>for Northbay</small>
          </h4>

          <div className={styles.gapRow}>
            <div className={`${styles.gapRank} ${styles.hot}`}>1</div>
            <div className={styles.gapBody}>
              <div className={styles.gapName}>
                <span className={styles.gapMarker} />
                SQL · Window functions
              </div>
              <div className={styles.gapMeta}>Recovers +4% match · 25 min</div>
            </div>
            <div
              className={`${styles.gapBar} ${styles.low}`}
              style={{ '--w': '8%' } as React.CSSProperties}
            />
          </div>

          <div className={styles.gapRow}>
            <div className={styles.gapRank}>2</div>
            <div className={styles.gapBody}>
              <div className={styles.gapName}>Airflow · DAG patterns</div>
              <div className={styles.gapMeta}>Unlocks 3 adjacent roles · 2h</div>
            </div>
            <div
              className={`${styles.gapBar} ${styles.mid}`}
              style={{ '--w': '42%' } as React.CSSProperties}
            />
          </div>

          <div className={styles.gapRow}>
            <div className={styles.gapRank}>3</div>
            <div className={styles.gapBody}>
              <div className={styles.gapName}>Cloud · S3 + IAM basics</div>
              <div className={styles.gapMeta}>Required in 62% of JDs · 3h</div>
            </div>
            <div
              className={`${styles.gapBar} ${styles.mid}`}
              style={{ '--w': '28%' } as React.CSSProperties}
            />
          </div>

          <div className={styles.gapsFooter}>
            <span>↓ feeds into Next Move</span>
            <Link href="#">Full map →</Link>
          </div>
        </aside>
      </div>
    </section>
  )
}

/* ── 3. NEXT MOVE ───────────────────────────── */
function NextMove() {
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
            Mock interview — Jr. Data Engineer, <em>Northbay Energy</em>.<br />
            20&nbsp;min, today.
          </h2>

          <p className={styles.moveWhy}>
            Agent detected <b>SQL is your top gap</b>. This mock will stress-test SQL window
            functions in a live interview flow — then auto-suggest a 25-min lesson based on where
            you stumble.
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
              Ahmed&apos;s coach <b>scheduled this</b> from your Career Map
            </span>
            <span className={styles.dot} />
            <span>
              Agent confidence: <span className={styles.conf}>HIGH</span>
            </span>
            <span className={styles.dot} />
            <span>
              Expected lift: <b>+4% Northbay match</b>
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
            4 questions · weighted toward window functions &amp; CTEs.
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
              <div className={styles.v}>SQL · Adv.</div>
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

/* ── 'not on this page' ─────────────────────── */
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
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
