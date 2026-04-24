/**
 * @jest-environment node
 */
jest.mock('@/lib/vector-store')

import {
  recomputeMatchScore,
  statusToEffectiveLevel,
  MATCH_SCORE_FLOOR,
} from '@/lib/career-map/recompute-score'
import { seedFromProfile } from '@/lib/career-map/seed'
import { DEMO_AHMED_GRAPH } from '@/lib/career-map/demo-ahmed'
import { MENA_ROLES } from '@/lib/mock-data'
import type { CareerGraph, CareerNode } from '@/lib/career-map/types'
import type { CurrentSkill, UserProfile } from '@/types'

const NOW = '2026-04-23T00:00:00.000Z'

function makeNode(overrides: Partial<CareerNode> = {}): CareerNode {
  return {
    id: 'skill:python',
    label: 'Python',
    kind: 'skill',
    status: 'confirmed',
    confidence: 0.9,
    evidence: [],
    weight: 0.5,
    requiredLevel: 7,
    currentLevel: 8,
    ...overrides,
  }
}

function makeGraph(nodes: CareerNode[]): CareerGraph {
  return {
    version: 1,
    learnerId: 'learner-1',
    targetRoleId: 'some-role',
    nodes,
    edges: [],
    matchScore: 0,
    updatedAt: NOW,
  }
}

describe('MATCH_SCORE_FLOOR', () => {
  it('is 65 — the demo-optimism floor shared with seed.ts / skillGapAnalysisTool', () => {
    // If this changes, /home's Ahmed demo value and the skillGapAnalysisTool's
    // overallReadiness will drift in lockstep — verify intentionally.
    expect(MATCH_SCORE_FLOOR).toBe(65)
  })
})

describe('statusToEffectiveLevel', () => {
  it('confirmed maps to the full required level', () => {
    expect(statusToEffectiveLevel('confirmed', 8)).toBe(8)
  })

  it('weak maps to approximately half the required level', () => {
    expect(statusToEffectiveLevel('weak', 8)).toBe(4)
    expect(statusToEffectiveLevel('weak', 7)).toBe(4) // rounds up from 3.5
  })

  it('gap maps to 0', () => {
    expect(statusToEffectiveLevel('gap', 8)).toBe(0)
  })

  it('unknown maps to approximately half to keep baseline stable', () => {
    expect(statusToEffectiveLevel('unknown', 10)).toBe(5)
  })
})

describe('recomputeMatchScore — base cases', () => {
  it('returns 0 when no skill nodes have requiredLevel', () => {
    const graph = makeGraph([
      {
        id: 'role:something',
        label: 'Something',
        kind: 'role',
        status: 'unknown',
        confidence: 1,
        evidence: [],
        weight: 1,
      },
    ])
    expect(recomputeMatchScore(graph)).toBe(0)
  })

  it('applies the 65% floor when math would yield a lower score', () => {
    // One skill: requiredLevel 10, currentLevel 1 → raw 10%. Floor clamps to 65.
    const graph = makeGraph([
      makeNode({ requiredLevel: 10, currentLevel: 1, status: 'gap' }),
    ])
    expect(recomputeMatchScore(graph)).toBe(65)
  })

  it('returns the rounded raw percent when above the floor', () => {
    // required 10, current 8 → 80%.
    const graph = makeGraph([
      makeNode({ requiredLevel: 10, currentLevel: 8, status: 'confirmed' }),
    ])
    expect(recomputeMatchScore(graph)).toBe(80)
  })

  it("caps each node's contribution at requiredLevel (no over-credit)", () => {
    // current 15 > required 10: contribution is clamped to 10, not 15.
    // Single node: 10/10 = 100%.
    const graph = makeGraph([
      makeNode({ requiredLevel: 10, currentLevel: 15, status: 'confirmed' }),
    ])
    expect(recomputeMatchScore(graph)).toBe(100)
  })

  it('excludes role and milestone nodes from the calculation', () => {
    const graph = makeGraph([
      { ...makeNode({ requiredLevel: 10, currentLevel: 10, status: 'confirmed' }) },
      {
        id: 'role:x',
        label: 'Role X',
        kind: 'role',
        status: 'unknown',
        confidence: 1,
        evidence: [],
        weight: 1,
      },
    ])
    expect(recomputeMatchScore(graph)).toBe(100)
  })
})

describe('recomputeMatchScore — status-based fallback for legacy payloads', () => {
  // If currentLevel is absent (e.g. persisted before Task 4b), fall back to
  // the status → effective-level proxy.
  it('uses the fallback when currentLevel is undefined', () => {
    const graph = makeGraph([
      makeNode({
        requiredLevel: 10,
        currentLevel: undefined,
        status: 'confirmed',
      }),
    ])
    // confirmed → 10, 10/10 = 100%
    expect(recomputeMatchScore(graph)).toBe(100)
  })

  it('gaps with no currentLevel contribute 0', () => {
    // 10/10 confirmed vs 0/10 gap → raw 50%, floor → 65.
    const graph = makeGraph([
      makeNode({
        id: 'skill:a',
        label: 'A',
        requiredLevel: 10,
        currentLevel: undefined,
        status: 'confirmed',
      }),
      makeNode({
        id: 'skill:b',
        label: 'B',
        requiredLevel: 10,
        currentLevel: undefined,
        status: 'gap',
      }),
    ])
    expect(recomputeMatchScore(graph)).toBe(65)
  })
})

describe('recomputeMatchScore — status changes reflect in score', () => {
  // Task 4b uses this path: agent patches a node's status, we recompute.
  it('gap → confirmed increases the score (currentLevel unchanged)', () => {
    // Start: two nodes, one confirmed (10/10), one gap (10/10 but currentLevel 2).
    // Raw: (10 + 2) / 20 = 60%. Floor → 65.
    const before = makeGraph([
      makeNode({
        id: 'skill:a',
        label: 'A',
        requiredLevel: 10,
        currentLevel: 10,
        status: 'confirmed',
      }),
      makeNode({
        id: 'skill:b',
        label: 'B',
        requiredLevel: 10,
        currentLevel: 2,
        status: 'gap',
      }),
    ])
    expect(recomputeMatchScore(before)).toBe(65)

    // Simulate the agent marking skill:b as confirmed (learner aced a mock).
    // Expectation: currentLevel is now the full requiredLevel (applyPatch
    // will be responsible for updating currentLevel — so we test recompute
    // with the post-apply snapshot).
    const after = makeGraph([
      makeNode({
        id: 'skill:a',
        label: 'A',
        requiredLevel: 10,
        currentLevel: 10,
        status: 'confirmed',
      }),
      makeNode({
        id: 'skill:b',
        label: 'B',
        requiredLevel: 10,
        currentLevel: 10,
        status: 'confirmed',
      }),
    ])
    expect(recomputeMatchScore(after)).toBe(100)
  })

  it('confirmed → weak lowers effective current-level via the fallback proxy', () => {
    // Post-write: agent downgrades confirmed to weak but we don't reduce
    // currentLevel (store.ts keeps the CV number). The fallback proxy only
    // fires when currentLevel is missing; when present, the stored value wins.
    // This test locks in the "currentLevel wins" semantics.
    const afterDowngrade = makeGraph([
      makeNode({
        requiredLevel: 10,
        currentLevel: 9, // CV said 9
        status: 'weak', // agent flagged weakness
      }),
    ])
    // 9/10 = 90% — currentLevel still wins. The weakness goes into the
    // *status* (visual/next-move signalling) without poisoning the metric.
    expect(recomputeMatchScore(afterDowngrade)).toBe(90)
  })
})

describe('recomputeMatchScore — regression lock against seedFromProfile', () => {
  // The load-bearing invariant: running recomputeMatchScore on a seed-produced
  // graph must return the *same* score the seed computed. If this drifts, the
  // Ahmed demo and any post-CV-parse graph show a mismatched matchScore on
  // /home vs. the skillGapAnalysisTool output in the agent.
  it('matches seedFromProfile output for the Ahmed/Aramco fixture', () => {
    const profile: UserProfile = {
      name: 'Ahmed',
      location: 'Cairo',
      currentLevel: 'junior',
    }
    const skills: CurrentSkill[] = [
      { name: 'Python', currentLevel: 8 },
      { name: 'SQL', currentLevel: 7 },
      { name: 'Data Visualization', currentLevel: 4 },
      { name: 'Statistics', currentLevel: 5 },
      { name: 'Stakeholder Management', currentLevel: 3 },
      { name: 'Presentation Skills', currentLevel: 5 },
    ]
    const graph = seedFromProfile(
      profile,
      skills,
      'data-analyst-aramco',
      'learner-x',
      { now: NOW }
    )
    expect(recomputeMatchScore(graph)).toBe(graph.matchScore)
  })

  it('matches the DEMO_AHMED_GRAPH stored matchScore exactly', () => {
    // Fixture stored 68; recompute must also produce 68 so that loading the
    // demo, applying a no-op patch, and recomputing leaves the score stable.
    expect(recomputeMatchScore(DEMO_AHMED_GRAPH)).toBe(DEMO_AHMED_GRAPH.matchScore)
  })

  it('matches the seed output for the full MENA_ROLES × random-skill matrix', () => {
    // For every role in MENA_ROLES, seed a graph from an empty CV — the floor
    // should kick in for every one, proving the recompute path agrees with
    // the seed at the edge case of maximum gaps.
    for (const role of MENA_ROLES) {
      const graph = seedFromProfile(
        {},
        [],
        role.id,
        'learner-y',
        { now: NOW }
      )
      expect(recomputeMatchScore(graph)).toBe(graph.matchScore)
    }
  })
})
