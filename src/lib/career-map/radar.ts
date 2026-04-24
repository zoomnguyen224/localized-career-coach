// src/lib/career-map/radar.ts
//
// Agent 3 — Radar. Pure, deterministic functions that turn market signals
// into measurable deltas against a CareerGraph. No LLM calls; no side effects.
//
// Design notes:
// - Each signal is a self-contained record carrying its own `impact(graph)`
//   function. `applyRadarSignals` folds a list of signals into a new graph
//   and returns the subset that meet the deck's suppression rule
//   (|matchDelta| >= 0.5pt).
// - The three default signals are deck-literal MENA scenarios (deck page 4 +
//   page 8). They are module-level constants so tests and /home can share
//   exactly the same copy and math.
// - "72% -> 68%" in the Aramco body is deck copy, not computed arithmetic.
//   The Ahmed demo fixture ships at 68 already; applying the Aramco signal
//   drops it further by ~4pt. The literal "72 -> 68" stays as narrative
//   copy — it's what the Radar *observed* in the market, independent of
//   the learner's current score.

import type { CareerGraph, CareerNode, CareerEdge, NodeEvidence } from './types'

// ── types ────────────────────────────────────────────────────────────────

export type RadarSeverity = 'high' | 'med' | 'info'

export interface RadarSignal {
  id: string
  severity: RadarSeverity
  /** "Saudi Aramco updated Jr. Data Engineer JD" */
  headline: string
  /** "Your match 72% -> 68%. SQL window fns added to must-haves." */
  body: string
  /** Optional human time hint — "2d ago" / "this week" / "market trend". */
  when?: string
  /** Pure, immutable transform: returns a new graph. Must NOT mutate input. */
  impact: (g: CareerGraph) => CareerGraph
  /**
   * Pre-computed match-% delta used to both (a) update graph.matchScore and
   * (b) suppress near-zero signals from the cards array (|delta| >= 0.5pt).
   */
  matchDelta: number
}

export interface ApplyRadarResult {
  graph: CareerGraph
  cards: RadarSignal[]
}

// ── helpers (all pure, all private) ──────────────────────────────────────

/** Shallow+one-deep clone of a graph — enough to guarantee input immutability
 *  when we only touch node/edge arrays and top-level primitives. */
function cloneGraph(g: CareerGraph): CareerGraph {
  return {
    ...g,
    nodes: g.nodes.map(n => ({ ...n, evidence: n.evidence.map(e => ({ ...e })) })),
    edges: g.edges.map(e => ({ ...e })),
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function clampWeight(n: number): number {
  return clamp(n, 0, 1)
}

/** Does this graph target an Aramco-owned role (real MENA id OR demo id)? */
function targetsAramco(g: CareerGraph): boolean {
  if (!g.targetRoleId) return false
  return g.targetRoleId.toLowerCase().includes('aramco')
}

function appendEvidence(
  node: CareerNode,
  ev: NodeEvidence
): CareerNode {
  return { ...node, evidence: [...node.evidence, ev] }
}

/** Find a node by its base id, optionally prefixed. Accepts both `sql-window-fns`
 *  and `skill:sql-window-fns` style lookups. */
function findSkillNodeIndex(g: CareerGraph, idOrSlug: string): number {
  const normalized = idOrSlug.startsWith('skill:') ? idOrSlug : `skill:${idOrSlug}`
  const idx = g.nodes.findIndex(n => n.id === normalized)
  if (idx !== -1) return idx
  // Fallback: some seeds may have stored the raw slug as id.
  return g.nodes.findIndex(n => n.id === idOrSlug)
}

/** Looks for any role node whose id or label matches "remote" (case-insensitive). */
function isRemoteRole(node: CareerNode): boolean {
  if (node.kind !== 'role') return false
  return (
    node.id.toLowerCase().includes('remote') ||
    node.label.toLowerCase().includes('remote')
  )
}

// ── default MENA signals (deck-literal) ──────────────────────────────────

const ARAMCO_SIGNAL: RadarSignal = {
  id: 'signal:aramco-jd-update',
  severity: 'high',
  when: '2d ago',
  headline: 'Saudi Aramco updated Jr. Data Engineer JD',
  body: 'Your match 72% -> 68%. SQL window fns added to must-haves. Airflow version bumped to 2.x.',
  matchDelta: -4,
  impact: (g) => {
    const next = cloneGraph(g)
    if (!targetsAramco(next)) {
      // Not targeting Aramco -> structural no-op beyond the clone.
      return next
    }

    const now = next.updatedAt // respect caller-provided timestamp
    const evidence: NodeEvidence = {
      source: 'radar:aramco-jd',
      at: now,
      detail: 'SQL window fns added to must-haves 2d ago',
    }

    const idx = findSkillNodeIndex(next, 'sql-window-fns')
    if (idx !== -1) {
      const current = next.nodes[idx]
      const boosted: CareerNode = appendEvidence(
        {
          ...current,
          // Elevate weight even if already a gap; clamp to [0,1].
          weight: clampWeight(Math.max(current.weight, 0.85) + 0.06),
          // If somehow not yet a gap, flag it as one.
          status: current.status === 'confirmed' ? current.status : 'gap',
        },
        evidence
      )
      next.nodes = next.nodes.map((n, i) => (i === idx ? boosted : n))
    } else {
      // Node doesn't exist in this graph — we can't invent a new skill node
      // without knowing the target-role's required-skills set, but we still
      // record the signal on the role node for traceability.
      const targetRoleIdx = next.nodes.findIndex(n => n.kind === 'role' && n.id.includes(next.targetRoleId ?? ''))
      if (targetRoleIdx !== -1) {
        next.nodes = next.nodes.map((n, i) => (i === targetRoleIdx ? appendEvidence(n, evidence) : n))
      }
    }

    return next
  },
}

const GULF_REMOTE_SIGNAL: RadarSignal = {
  id: 'signal:gulf-remote-uptick',
  severity: 'med',
  when: 'this week',
  headline: 'Egypt -> Gulf remote Data roles up 34%',
  body: '3 new roles match your profile. 1 is above your current match threshold.',
  // Small but non-trivial positive delta — new matches increase your addressable
  // market without changing any single role's fit dramatically.
  matchDelta: +1,
  impact: (g) => {
    const next = cloneGraph(g)
    const now = next.updatedAt
    const evidence: NodeEvidence = {
      source: 'radar:gulf-remote',
      at: now,
      detail: 'Gulf remote Data roles up 34% this week',
    }
    next.nodes = next.nodes.map(n => {
      if (!isRemoteRole(n)) return n
      return appendEvidence(
        {
          ...n,
          weight: clampWeight(n.weight + 0.05),
        },
        evidence
      )
    })
    return next
  },
}

const SQL_WINDOW_MARKET_SIGNAL: RadarSignal = {
  id: 'signal:sql-window-market',
  severity: 'info',
  when: 'market trend',
  headline: 'SQL window fns required in 78% of Data Eng JDs (was 52%)',
  body: 'This one skill now unlocks 26% more of the market for you.',
  // Positive: closing the gap unlocks more of the addressable market,
  // so the expected-value of learning it goes up.
  matchDelta: +0.6,
  impact: (g) => {
    const next = cloneGraph(g)
    const now = next.updatedAt
    const evidence: NodeEvidence = {
      source: 'radar:sql-window-market',
      at: now,
      detail: 'SQL window fns in 78% of Data Eng JDs (was 52%)',
    }
    const idx = findSkillNodeIndex(next, 'sql-window-fns')
    if (idx !== -1) {
      const current = next.nodes[idx]
      next.nodes = next.nodes.map((n, i) =>
        i === idx
          ? appendEvidence(
              {
                ...current,
                weight: clampWeight(current.weight + 0.04),
              },
              evidence
            )
          : n
      )
    }
    return next
  },
}

/**
 * The three default signals, matching deck page 4 + page 8 copy. Exported so
 * tests and /home can share the same canonical set.
 */
export const DEFAULT_MENA_SIGNALS: RadarSignal[] = [
  ARAMCO_SIGNAL,
  GULF_REMOTE_SIGNAL,
  SQL_WINDOW_MARKET_SIGNAL,
]

// ── main entry ───────────────────────────────────────────────────────────

export interface ApplyRadarOptions {
  /** Suppression threshold in percentage points; deck rule is 0.5. */
  suppressBelow?: number
  /** Override for `updatedAt`. Defaults to the input graph's `updatedAt`. */
  now?: string
}

/**
 * Fold a list of signals into a new CareerGraph. Pure: the input graph is
 * never mutated — all writes go through fresh copies.
 *
 * Returns:
 *  - `graph`  — the input with every signal's `impact` applied in order,
 *               `matchScore` adjusted by the cumulative matchDelta
 *               (rounded, clamped [0,100]) and `updatedAt` refreshed.
 *  - `cards`  — only signals meeting the deck's suppression rule
 *               (|matchDelta| >= suppressBelow). Preserves input order.
 */
export function applyRadarSignals(
  graph: CareerGraph,
  signals: RadarSignal[],
  options: ApplyRadarOptions = {}
): ApplyRadarResult {
  const suppressBelow = options.suppressBelow ?? 0.5
  const now = options.now ?? graph.updatedAt

  // Each impact() returns a new graph; reduce builds up immutably.
  const transformed = signals.reduce<CareerGraph>((acc, signal) => {
    return signal.impact(acc)
  }, cloneGraph(graph))

  const totalDelta = signals.reduce((acc, s) => acc + s.matchDelta, 0)
  const nextScore = Math.round(clamp(transformed.matchScore + totalDelta, 0, 100))

  const cards = signals.filter(s => Math.abs(s.matchDelta) >= suppressBelow)

  return {
    graph: {
      ...transformed,
      matchScore: nextScore,
      updatedAt: now,
    },
    cards,
  }
}
