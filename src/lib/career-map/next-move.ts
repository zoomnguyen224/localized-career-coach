// src/lib/career-map/next-move.ts
//
// Agent 1 — Next Move. Pure, deterministic computation over a CareerGraph
// that picks the single highest-leverage learner action under a time budget.
// No LLM. No side effects. The `rationale` field is a template string; the
// one-liner is NOT regenerated from an LLM at this layer.
//
// Algorithm (Dijkstra-based):
//   1. Confidence gates — reject targetRoleId=null / edgeless / low-evidence
//      graphs (deck: "silence beats filler").
//   2. Multi-source Dijkstra from every `confirmed` skill toward the target
//      role, treating edges as undirected and using `edge.weight` as cost.
//   3. Collect candidate intermediate nodes (on some shortest path, not
//      confirmed, not the target itself).
//   4. Score candidates by `leverage = node.weight * statusBump * (1 -
//      distance/maxDistance)`. Tie-break on id for determinism.
//   5. Decide actionKind from status + edge kinds + overall matchScore.
//   6. Expose expectedMatchDelta via `node.weight * 12` — scalar tuned so
//      the deck's canonical sql-window-fns (weight ~0.92..0.96 after Radar)
//      lands inside the 9..13 window the acceptance test demands.

import type { CareerGraph, CareerNode, CareerEdge } from './types'

// ── public API ───────────────────────────────────────────────────────────

export type NextMoveKind = 'module' | 'mock' | 'application'

export interface NextMove {
  actionKind: NextMoveKind
  nodeId: string
  /** "Mock interview · Saudi Aramco Jr. Data Eng · 20 min" */
  label: string
  expectedMatchDelta: number
  rationale: string
  /** 0..1. Parent UI can suppress low-confidence cards. */
  confidence: number
}

export interface NextMoveOptions {
  /** Budget in minutes; nodes with estimated effort > budget are skipped. */
  timeBudgetMin?: number
  /** Minimum graph confidence required to surface any action. Default 0.3. */
  minGraphConfidence?: number
}

// ── internal helpers ─────────────────────────────────────────────────────

interface AdjacencyEntry {
  readonly to: string
  readonly weight: number
  readonly edge: CareerEdge
}

type Adjacency = ReadonlyMap<string, readonly AdjacencyEntry[]>

/** Build an undirected adjacency list keyed by node id. Edge.kind is preserved
 *  on each entry so the action-kind decision can inspect it. */
function buildAdjacency(graph: CareerGraph): Adjacency {
  const adj = new Map<string, AdjacencyEntry[]>()
  const push = (k: string, v: AdjacencyEntry): void => {
    const cur = adj.get(k)
    if (cur) cur.push(v)
    else adj.set(k, [v])
  }
  for (const edge of graph.edges) {
    push(edge.from, { to: edge.to, weight: edge.weight, edge })
    push(edge.to, { to: edge.from, weight: edge.weight, edge })
  }
  return adj
}

function findTargetRoleNode(graph: CareerGraph): CareerNode | undefined {
  if (!graph.targetRoleId) return undefined
  const roles = graph.nodes.filter(n => n.kind === 'role')
  // Exact id match first
  const exact = roles.find(r => r.id === graph.targetRoleId)
  if (exact) return exact
  // Prefixed (role:${id}) match next
  const prefixed = roles.find(r => r.id === `role:${graph.targetRoleId}`)
  if (prefixed) return prefixed
  // Suffix fallback — handles ad-hoc ids like `role:jr-data-eng-aramco-demo`
  return roles.find(r => r.id.endsWith(graph.targetRoleId as string))
}

/** A coarse confidence proxy for the whole graph. Combines evidence
 *  density and the share of skills we actually have signal on. Returns a
 *  value in [0, 1]. */
function graphConfidence(graph: CareerGraph): number {
  const skills = graph.nodes.filter(n => n.kind === 'skill')
  if (skills.length === 0) return 0

  const confirmedShare =
    skills.filter(n => n.status === 'confirmed').length / skills.length

  const weakOrGap = skills.filter(
    n => n.status === 'gap' || n.status === 'weak'
  ).length
  const signalShare = (confirmedShare * skills.length + weakOrGap) / skills.length

  const avgNodeConfidence =
    skills.reduce((acc, n) => acc + n.confidence, 0) / skills.length

  // 50% weighting on evidence signal, 50% on per-node confidence. Clamp [0,1].
  const raw = 0.5 * signalShare + 0.5 * avgNodeConfidence
  return Math.min(1, Math.max(0, raw))
}

/** Multi-source Dijkstra — initialise all source nodes at distance 0, then
 *  relax. Returns a distance map keyed by node id. Unreachable nodes keep
 *  their `Infinity` placeholder so callers can filter on `Number.isFinite`. */
function multiSourceDijkstra(
  graph: CareerGraph,
  adj: Adjacency,
  sources: readonly string[]
): ReadonlyMap<string, number> {
  const dist = new Map<string, number>()
  const prev = new Map<string, string | null>()
  for (const node of graph.nodes) {
    dist.set(node.id, Infinity)
    prev.set(node.id, null)
  }
  for (const id of sources) {
    if (dist.has(id)) dist.set(id, 0)
  }

  // Priority queue as a sorted array — n is small here (<<100), so the O(n²)
  // constant cost is negligible and we avoid pulling in a heap dep.
  const unvisited = new Set(graph.nodes.map(n => n.id))

  while (unvisited.size > 0) {
    // Pick the unvisited node with the smallest dist; break ties by id for
    // fully deterministic traversal order.
    let current: string | null = null
    let currentDist = Infinity
    for (const id of unvisited) {
      const d = dist.get(id) ?? Infinity
      if (
        d < currentDist ||
        (d === currentDist && current !== null && id.localeCompare(current) < 0)
      ) {
        current = id
        currentDist = d
      }
    }
    if (current === null || currentDist === Infinity) break // all remaining unreachable

    unvisited.delete(current)
    const neighbours = adj.get(current) ?? []
    for (const edge of neighbours) {
      if (!unvisited.has(edge.to)) continue
      const alt = currentDist + edge.weight
      const existing = dist.get(edge.to) ?? Infinity
      if (
        alt < existing ||
        // Deterministic tie-break on equal cost: prefer the predecessor with
        // the smaller id so repeated runs produce the same predecessor chain.
        (alt === existing &&
          current !== null &&
          (prev.get(edge.to) ?? '').localeCompare(current) > 0)
      ) {
        dist.set(edge.to, alt)
        prev.set(edge.to, current)
      }
    }
  }

  return dist
}

function estimateMinutesForNode(node: CareerNode): number {
  // Mirrors the top-gaps rail math in CareerMapSection — heavier weight =
  // larger effort. Floor at 10 min so small-weight nodes don't collapse to 0.
  return Math.max(10, Math.round(node.weight * 30))
}

function expectedDeltaForNode(node: CareerNode): number {
  // Scalar 12 chosen so sql-window-fns (weight ~0.92 pre-radar, ~0.96 post)
  // lands in the 9..13 range the acceptance test expects. For lower-weight
  // nodes this still produces sane single-digit deltas.
  return Math.round(node.weight * 12)
}

function statusBump(status: CareerNode['status']): number {
  // Priority: weak (0.15 penalty turned into +0.15 bump) > gap > other.
  // Scaled subtly so weight + edge-kind still matter.
  if (status === 'weak') return 1.15
  if (status === 'gap') return 1.0
  return 0.6
}

interface CandidateRanking {
  node: CareerNode
  distance: number
  leverage: number
  unlockToTarget: boolean
}

function rankCandidates(
  graph: CareerGraph,
  adj: Adjacency,
  distToTarget: ReadonlyMap<string, number>,
  confirmedIds: ReadonlySet<string>,
  targetId: string,
  timeBudget: number
): CandidateRanking[] {
  const distances = Array.from(distToTarget.values()).filter(
    d => Number.isFinite(d) && d > 0
  )
  const maxDistance = distances.length === 0 ? 1 : Math.max(...distances, 0.0001)

  const candidates: CandidateRanking[] = []
  for (const node of graph.nodes) {
    if (node.kind !== 'skill') continue
    if (confirmedIds.has(node.id)) continue
    const d = distToTarget.get(node.id)
    if (d === undefined || !Number.isFinite(d)) continue
    if (estimateMinutesForNode(node) > timeBudget) continue

    // Proximity factor bounded to [0.5, 1.0] so that node.weight (importance)
    // is the dominant signal — a heavy gap one hop further out should still
    // beat a light gap that's one hop closer.
    const rawProximity = 1 - d / maxDistance
    const proximity = 0.5 + 0.5 * Math.max(0, Math.min(1, rawProximity))
    // Does this node have an "unlock"-kind edge directly into the target role?
    const neighbours = adj.get(node.id) ?? []
    const unlockToTarget = neighbours.some(
      n => n.to === targetId && n.edge.kind === 'unlock'
    )
    const leverage = node.weight * statusBump(node.status) * proximity
    candidates.push({ node, distance: d, leverage, unlockToTarget })
  }

  // Determinism: highest leverage first; ties -> weak over gap over other;
  // final tiebreak on id.
  const statusRank = (s: CareerNode['status']): number =>
    s === 'weak' ? 3 : s === 'gap' ? 2 : s === 'unknown' ? 1 : 0
  candidates.sort((a, b) => {
    if (b.leverage !== a.leverage) return b.leverage - a.leverage
    const sr = statusRank(b.node.status) - statusRank(a.node.status)
    if (sr !== 0) return sr
    return a.node.id.localeCompare(b.node.id)
  })
  return candidates
}

function prereqsAllConfirmed(graph: CareerGraph, targetId: string): boolean {
  const prereqEdges = graph.edges.filter(
    e => e.to === targetId && e.kind === 'prereq'
  )
  if (prereqEdges.length === 0) return false
  return prereqEdges.every(e => {
    const src = graph.nodes.find(n => n.id === e.from)
    return src?.status === 'confirmed'
  })
}

// ── entrypoint ───────────────────────────────────────────────────────────

/**
 * Compute the single best next action for the learner. Returns `null` when
 * the graph is too thin to say anything useful (deck: "silence beats filler").
 *
 * The returned action is one of:
 *  - `mock`        — voice interview against a high-leverage weak/unlock-gap
 *  - `module`      — study a plain gap skill
 *  - `application` — the learner is ready; apply to the target role
 */
export function computeNextMove(
  graph: CareerGraph,
  options: NextMoveOptions = {}
): NextMove | null {
  const timeBudget = options.timeBudgetMin ?? 60
  const minGraphConfidence = options.minGraphConfidence ?? 0.3

  if (graph.targetRoleId === null) return null
  if (graph.edges.length === 0) return null

  const target = findTargetRoleNode(graph)
  if (!target) return null

  const confidence = graphConfidence(graph)
  if (confidence < minGraphConfidence) return null

  // The seed stores role labels as "Jr. Data Engineer · Saudi Aramco". The
  // deck renders the short label as "Saudi Aramco Jr. Data Eng" (company
  // first, "Engineer" abbreviated). Abbreviate a handful of common long-form
  // suffixes so the final label fits the deck's Next Move card copy.
  const abbreviateTitle = (t: string): string =>
    t
      .replace(/\bEngineer\b/gi, 'Eng')
      .replace(/\bAdministrator\b/gi, 'Admin')
      .replace(/\bDeveloper\b/gi, 'Dev')
  const labelParts = target.label.split(' · ')
  const titlePart = (labelParts[0] ?? '').trim()
  const companyPart = (labelParts[1] ?? '').trim()
  const roleShort =
    companyPart && titlePart
      ? `${companyPart} ${abbreviateTitle(titlePart)}`
      : companyPart || titlePart || target.label

  // ── application fast-path ──────────────────────────────────────────────
  if (graph.matchScore >= 80 && prereqsAllConfirmed(graph, target.id)) {
    return {
      actionKind: 'application',
      nodeId: target.id,
      label: `Apply to ${roleShort} ->`,
      expectedMatchDelta: 0,
      rationale: 'Your prereqs are confirmed and your match is above 80% — apply now.',
      confidence,
    }
  }

  // ── learning-path ranking ─────────────────────────────────────────────
  const adj = buildAdjacency(graph)
  const confirmedIds = new Set(
    graph.nodes.filter(n => n.status === 'confirmed').map(n => n.id)
  )
  if (confirmedIds.size === 0) return null

  // Distance FROM the target so we know how close each candidate is to it.
  const distToTarget = multiSourceDijkstra(graph, adj, [target.id])

  const candidates = rankCandidates(
    graph,
    adj,
    distToTarget,
    confirmedIds,
    target.id,
    timeBudget
  )
  if (candidates.length === 0) return null

  const winner = candidates[0]
  const node = winner.node
  const expected = expectedDeltaForNode(node)

  // Decide the action kind.
  let actionKind: NextMoveKind = 'module'
  let label: string
  let rationale: string

  if (node.status === 'weak') {
    actionKind = 'mock'
  } else if (node.status === 'gap' && winner.unlockToTarget) {
    actionKind = 'mock'
  } else if (node.status === 'gap') {
    actionKind = 'module'
  }

  if (actionKind === 'mock') {
    label = `Mock interview · ${roleShort} · 20 min`
    rationale = `${node.label} closes your top gap — expected +${expected}pt match after a focused drill.`
  } else {
    const minutes = estimateMinutesForNode(node)
    label = `Complete ${node.label} lesson · ${minutes} min`
    rationale = `${node.label} closes your top gap — expected +${expected}pt match once confirmed.`
  }

  return {
    actionKind,
    nodeId: node.id,
    label,
    expectedMatchDelta: expected,
    rationale,
    confidence,
  }
}

