// src/lib/career-map/recompute-score.ts
//
// `recomputeMatchScore(graph)` — shared helper that reruns the seed's match-%
// formula against a CareerGraph's current node statuses. Factored out of
// `seed.ts` so `applyWriteMapNodePatch` (Task 4b) can re-score the graph
// after the interview agent updates a node without drifting from the value
// the seed produced at CV-parse time.
//
// The formula mirrors `skillGapAnalysisTool` / `seedFromProfile` so the
// score on /home, the score in the agent's tool output, and the score after
// a live write-back all agree. The 65% demo-optimism floor is preserved.
//
// How it works:
//   - Each `skill` node carries `requiredLevel` (the JD requirement) populated
//     by the seed, plus `currentLevel` (the learner's effective level).
//   - Sum `requiredLevel` over skill nodes for the denominator, and
//     `min(currentLevel, requiredLevel)` for the numerator — identical to the
//     seed's arithmetic before Task 4b.
//   - If `currentLevel` is absent (legacy payloads), fall back to a
//     status-based proxy: confirmed -> requiredLevel, weak -> requiredLevel/2,
//     gap -> 0, unknown -> requiredLevel/2.
//   - Round, clamp [0, 100], apply the 65% floor, return.
//
// Nodes without `requiredLevel` (milestones, role nodes, ad-hoc nodes) are
// excluded from both numerator and denominator — exactly matching `seed.ts`.

import type { CareerGraph, CareerNode } from './types'

/** The 65% optimism floor used by seed.ts / skillGapAnalysisTool. Keeping it
 *  named so a future refactor can lift it from magic number to config knob. */
export const MATCH_SCORE_FLOOR = 65

/**
 * Map a node's status to an effective-level proxy when `currentLevel` is
 * absent. Only used as a fallback for legacy payloads — the seed now writes
 * `currentLevel` directly onto every skill node.
 */
export function statusToEffectiveLevel(
  status: CareerNode['status'],
  requiredLevel: number
): number {
  switch (status) {
    case 'confirmed':
      return requiredLevel
    case 'weak':
      return Math.max(0, Math.round(requiredLevel / 2))
    case 'gap':
      return 0
    case 'unknown':
      // 'unknown' means we've never observed the learner on this skill; keep
      // near the seed baseline to avoid match-score whiplash on brand-new
      // nodes added by Radar signals.
      return Math.max(0, Math.round(requiredLevel / 2))
  }
}

/**
 * Recompute the match-% (0..100) from a graph's current node state. Pure: does
 * NOT mutate the input graph. Callers that want to persist the new score must
 * spread it back themselves (see `applyWriteMapNodePatch`).
 */
export function recomputeMatchScore(graph: CareerGraph): number {
  let totalRequiredLevel = 0
  let totalCurrentLevel = 0

  for (const node of graph.nodes) {
    if (node.kind !== 'skill') continue
    if (node.requiredLevel === undefined || node.requiredLevel <= 0) continue
    const current =
      node.currentLevel !== undefined
        ? node.currentLevel
        : statusToEffectiveLevel(node.status, node.requiredLevel)
    totalRequiredLevel += node.requiredLevel
    totalCurrentLevel += Math.min(current, node.requiredLevel)
  }

  if (totalRequiredLevel === 0) return 0
  const rawPercent = Math.round((totalCurrentLevel / totalRequiredLevel) * 100)
  return Math.max(MATCH_SCORE_FLOOR, rawPercent)
}
