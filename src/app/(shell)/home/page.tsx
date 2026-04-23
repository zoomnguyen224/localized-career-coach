import Link from 'next/link'
import styles from './home.module.css'

export default function HomePage() {
  return (
    <div className={styles.root}>
      <TopBar />
      <main className={styles.page}>
        <Hero />
        <MarketRadar />
        <CareerMap />
        <NextMove />
        <NotHere />
      </main>
    </div>
  )
}

/* ── TOP BAR ─────────────────────────── */
function TopBar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <span className={styles.brandMark} />
        <span>
          Localiz<em>ed</em>
        </span>
      </div>

      <nav className={styles.nav}>
        <Link href="/home" className={styles.on}>
          <svg className={styles.ic} viewBox="0 0 24 24">
            <path d="M3 12l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
          </svg>
          Home
        </Link>
        <Link href="#">
          <svg className={styles.ic} viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
          Events
        </Link>
        <Link href="/jobs">
          <svg className={styles.ic} viewBox="0 0 24 24">
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Jobs
        </Link>
        <Link href="#">
          <svg className={styles.ic} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          </svg>
          Career Map
        </Link>
      </nav>

      <div className={styles.topRight}>
        <button type="button" className={styles.iconBtn} aria-label="Search">
          <svg className={styles.ic} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Messages">
          <svg className={styles.ic} viewBox="0 0 24 24">
            <path d="M21 12a8 8 0 0 1-11.3 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12z" />
          </svg>
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <svg className={styles.ic} viewBox="0 0 24 24">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9zM10 21a2 2 0 0 0 4 0" />
          </svg>
        </button>
        <div className={styles.avatar}>AH</div>
      </div>
    </header>
  )
}

/* ── HERO ─────────────────────────── */
function Hero() {
  return (
    <div className={styles.hero}>
      <h1>
        Good morning, Ahmed.
        <br />
        <span className={styles.heroSub}>
          The world moved overnight — here&apos;s what it means for <em>you</em>.
        </span>
      </h1>
      <div className={styles.byline}>
        <div>
          Cairo · <strong>08:14 local</strong>
        </div>
        <div className={styles.bylineSync}>
          Map synced <span className={styles.bylineDot}>●</span> 2m ago
        </div>
      </div>
    </div>
  )
}

/* ── 1. MARKET RADAR ─────────────── */
function MarketRadar() {
  return (
    <section className={styles.radar}>
      <div className={styles.secLabel}>
        <span className={styles.num}>01</span>
        <span>Market Radar</span>
        <span className={styles.line} />
        <span className={styles.meta}>Updated for Ahmed · 08:14 Cairo</span>
      </div>

      <div className={styles.radarGrid}>
        {/* High severity */}
        <article className={`${styles.signal} ${styles.high}`}>
          <span className={styles.tick} />
          <div className={styles.sev}>
            <span className={styles.dot} /> High signal{' '}
            <span className={styles.sep}>·</span>{' '}
            <span className={styles.when}>2 days ago</span>
          </div>
          <h3>Northbay Energy rewrote the Junior Data Engineer JD.</h3>
          <div className={styles.forYou}>
            <div className={styles.forYouLbl}>What it means for you</div>
            <div className={styles.forYouBody}>
              Match dropped <span className={styles.delta}>72 → 68%</span>. They now require{' '}
              <b>SQL window functions</b> — a skill you don&apos;t have yet.
            </div>
          </div>
          <div className={styles.evList}>
            <div className={styles.evCtx}>The job itself</div>
            <a className={styles.ev} href="#">
              <span className={`${styles.evLogo} ${styles.nb}`}>NB</span>
              <span className={styles.evBody}>
                <span className={styles.evTitle}>Jr. Data Engineer · Northbay Energy</span>
                <span className={styles.evSub}>Dhahran / Remote · updated 2d ago</span>
              </span>
              <span className={`${styles.evTail} ${styles.down}`}>68%</span>
            </a>
          </div>
        </article>

        {/* Medium severity */}
        <article className={`${styles.signal} ${styles.med}`}>
          <span className={styles.tick} />
          <div className={styles.sev}>
            <span className={styles.dot} /> Medium signal{' '}
            <span className={styles.sep}>·</span>{' '}
            <span className={styles.when}>this month</span>
          </div>
          <h3>Gulf employers are hiring remote workers from Egypt.</h3>
          <div className={styles.forYou}>
            <div className={styles.forYouLbl}>What it means for you</div>
            <div className={styles.forYouBody}>
              Remote Gulf postings <span className={`${styles.delta} ${styles.up}`}>+34%</span>.{' '}
              <b>3 new roles</b> match your profile — two strong, one worth a look.
            </div>
          </div>
          <div className={styles.evList}>
            <div className={styles.evCtx}>Top 2 matches · of 3</div>
            <a className={styles.ev} href="#">
              <span className={`${styles.evLogo} ${styles.vl}`}>VL</span>
              <span className={styles.evBody}>
                <span className={styles.evTitle}>Data Ops Engineer · Jr. · Veolia</span>
                <span className={styles.evSub}>Remote → Riyadh · posted 4d ago</span>
              </span>
              <span className={`${styles.evTail} ${styles.up}`}>81%</span>
            </a>
            <a className={styles.ev} href="#">
              <span className={`${styles.evLogo} ${styles.tr}`}>TM</span>
              <span className={styles.evBody}>
                <span className={styles.evTitle}>Applied Data Engineer · Trend Micro</span>
                <span className={styles.evSub}>Remote → Dubai · posted 1w ago</span>
              </span>
              <span className={`${styles.evTail} ${styles.up}`}>74%</span>
            </a>
          </div>
        </article>

        {/* Info severity */}
        <article className={`${styles.signal} ${styles.info}`}>
          <span className={styles.tick} />
          <div className={styles.sev}>
            <span className={styles.dot} /> Informational{' '}
            <span className={styles.sep}>·</span>{' '}
            <span className={styles.when}>12-week drift</span>
          </div>
          <h3>SQL window functions went from nice-to-have to required.</h3>
          <div className={styles.forYou}>
            <div className={styles.forYouLbl}>What it means for you</div>
            <div className={styles.forYouBody}>
              Now in <span className={`${styles.delta} ${styles.neutral}`}>78%</span> of Data Eng
              postings (was 52%). Learning <b>this one skill</b> recovers your Northbay match.
            </div>
          </div>
          <div className={styles.evList}>
            <div className={styles.evCtx}>Event that closes the gap</div>
            <a className={styles.ev} href="#">
              <span className={`${styles.evLogo} ${styles.evt}`}>
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 9h18M8 3v4M16 3v4" />
                </svg>
              </span>
              <span className={styles.evBody}>
                <span className={styles.evTitle}>Workshop · SQL Window Functions in Practice</span>
                <span className={styles.evSub}>Localized · Live · 90 min</span>
              </span>
              <span className={`${styles.evTail} ${styles.neutral}`}>May 14</span>
            </a>
          </div>
        </article>
      </div>
    </section>
  )
}

/* ── 2. CAREER MAP ─────────────────────────── */
function CareerMap() {
  return (
    <section className={styles.map}>
      <div className={styles.secLabel}>
        <span className={styles.num}>02</span>
        <span>Your Career Map, responding</span>
        <span className={styles.line} />
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
      </div>

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
      <div className={styles.secLabel}>
        <span className={styles.num}>03</span>
        <span>Your Next Move</span>
        <span className={styles.line} />
        <span className={styles.meta}>One action · chosen by your agent</span>
      </div>

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
