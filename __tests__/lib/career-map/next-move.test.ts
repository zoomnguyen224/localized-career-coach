/**
 * @jest-environment node
 */
import { computeNextMove } from '@/lib/career-map/next-move'
import type { NextMoveKind } from '@/lib/career-map/next-move'
import { applyRadarSignals, DEFAULT_MENA_SIGNALS } from '@/lib/career-map/radar'
import { DEMO_AHMED_GRAPH } from '@/lib/career-map/demo-ahmed'
import type { CareerGraph, CareerNode, CareerEdge } from '@/lib/career-map/types'

// ── fixture helpers ──────────────────────────────────────────────────────

const NOW = '2026-04-23T09:00:00.000Z'

function makeGraph(overrides: Partial<CareerGraph> = {}): CareerGraph {
  return {
    version: 1,
    learnerId: 'learner-test',
    targetRoleId: 'the-target',
    nodes: [],
    edges: [],
    matchScore: 70,
    updatedAt: NOW,
    ...overrides,
  }
}

function node(overrides: Partial<CareerNode> = {}): CareerNode {
  return {
    id: 'node',
    label: 'Node',
    kind: 'skill',
    status: 'confirmed',
    confidence: 0.9,
    evidence: [],
    weight: 0.5,
    ...overrides,
  }
}

function edge(overrides: Partial<CareerEdge> = {}): CareerEdge {
  return { from: 'a', to: 'b', weight: 0.3, kind: 'prereq', ...overrides }
}

function snap<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// ── tests ────────────────────────────────────────────────────────────────

describe('computeNextMove — null gates', () => {
  it('returns null when targetRoleId is null', () => {
    const g = makeGraph({ targetRoleId: null })
    expect(computeNextMove(g)).toBeNull()
  })

  it('returns null when the graph has no edges', () => {
    const g = makeGraph({
      targetRoleId: 'r',
      nodes: [node({ id: 'role:r', kind: 'role', status: 'unknown' })],
      edges: [],
    })
    expect(computeNextMove(g)).toBeNull()
  })

  it('returns null when no node matches the target role id', () => {
    const g = makeGraph({
      targetRoleId: 'nonexistent',
      nodes: [
        node({ id: 'skill:python', status: 'confirmed' }),
        node({ id: 'skill:sql', status: 'gap', weight: 0.8 }),
      ],
      edges: [
        edge({ from: 'skill:python', to: 'skill:sql' }),
      ],
    })
    expect(computeNextMove(g)).toBeNull()
  })

  it('returns null when the graph confidence is below threshold (all-unknown skills)', () => {
    const g = makeGraph({
      targetRoleId: 'r',
      nodes: [
        node({ id: 'role:r', kind: 'role', status: 'unknown' }),
        node({ id: 'skill:x', status: 'unknown', confidence: 0.1 }),
        node({ id: 'skill:y', status: 'unknown', confidence: 0.1 }),
      ],
      edges: [
        edge({ from: 'skill:x', to: 'role:r', weight: 0.5 }),
        edge({ from: 'skill:y', to: 'role:r', weight: 0.5 }),
      ],
    })
    expect(computeNextMove(g)).toBeNull()
  })
})

describe('computeNextMove — Ahmed demo', () => {
  it('post-radar Ahmed demo surfaces a mock on sql-window-fns with expected delta ~ +11', () => {
    const { graph: radarGraph } = applyRadarSignals(DEMO_AHMED_GRAPH, DEFAULT_MENA_SIGNALS, {
      now: NOW,
    })
    const move = computeNextMove(radarGraph)
    expect(move).not.toBeNull()
    expect(move!.actionKind).toBe<NextMoveKind>('mock')
    expect(move!.nodeId).toBe('skill:sql-window-fns')
    expect(move!.expectedMatchDelta).toBeGreaterThanOrEqual(9)
    expect(move!.expectedMatchDelta).toBeLessThanOrEqual(13)
    expect(move!.label).toMatch(/Mock interview/)
    expect(move!.label).toMatch(/Saudi Aramco/)
    expect(move!.label).toMatch(/20 min/)
  })

  it('is pure: Ahmed demo is unchanged after computeNextMove', () => {
    const before = snap(DEMO_AHMED_GRAPH)
    computeNextMove(DEMO_AHMED_GRAPH)
    expect(DEMO_AHMED_GRAPH).toEqual(before)
  })

  it('is deterministic: two calls with the same input produce equal outputs', () => {
    const a = computeNextMove(DEMO_AHMED_GRAPH)
    const b = computeNextMove(DEMO_AHMED_GRAPH)
    expect(a).toEqual(b)
  })

  it('surfaces confidence >= 0.3 on a healthy graph', () => {
    const move = computeNextMove(DEMO_AHMED_GRAPH)
    expect(move).not.toBeNull()
    expect(move!.confidence).toBeGreaterThanOrEqual(0.3)
    expect(move!.confidence).toBeLessThanOrEqual(1)
  })
})

describe('computeNextMove — action kind selection', () => {
  it('returns an application action when matchScore >= 80 and all prereqs confirmed', () => {
    const g = makeGraph({
      matchScore: 88,
      targetRoleId: 'ready-role',
      nodes: [
        node({ id: 'role:ready-role', kind: 'role', status: 'unknown' }),
        node({ id: 'skill:a', status: 'confirmed', weight: 0.6 }),
        node({ id: 'skill:b', status: 'confirmed', weight: 0.5 }),
      ],
      edges: [
        edge({ from: 'skill:a', to: 'role:ready-role', weight: 0.15, kind: 'prereq' }),
        edge({ from: 'skill:b', to: 'role:ready-role', weight: 0.15, kind: 'prereq' }),
      ],
    })
    const move = computeNextMove(g)
    expect(move).not.toBeNull()
    expect(move!.actionKind).toBe<NextMoveKind>('application')
    expect(move!.nodeId).toBe('role:ready-role')
    expect(move!.label).toMatch(/Apply to/)
  })

  it('prioritises a `weak` node over a higher-weight `gap` node (mock beats module)', () => {
    // `weak` node weight 0.5 should still beat `gap` node weight 0.8 because
    // status bump pushes weak above plain gap.
    const g = makeGraph({
      targetRoleId: 'target',
      nodes: [
        node({ id: 'role:target', kind: 'role', status: 'unknown' }),
        node({ id: 'skill:anchor', status: 'confirmed', weight: 0.7 }),
        node({ id: 'skill:heavy-gap', status: 'gap', weight: 0.8 }),
        node({ id: 'skill:weak-one', status: 'weak', weight: 0.72 }),
      ],
      edges: [
        edge({ from: 'skill:anchor', to: 'role:target', weight: 0.15, kind: 'prereq' }),
        edge({ from: 'skill:heavy-gap', to: 'role:target', weight: 0.5, kind: 'prereq' }),
        edge({ from: 'skill:weak-one', to: 'role:target', weight: 0.5, kind: 'prereq' }),
      ],
    })
    const move = computeNextMove(g)
    expect(move).not.toBeNull()
    expect(move!.nodeId).toBe('skill:weak-one')
    expect(move!.actionKind).toBe<NextMoveKind>('mock')
  })

  it('uses `mock` action kind for a `gap` node reached via an `unlock` edge', () => {
    const g = makeGraph({
      targetRoleId: 'target',
      nodes: [
        node({ id: 'role:target', kind: 'role', status: 'unknown' }),
        node({ id: 'skill:anchor', status: 'confirmed', weight: 0.7 }),
        node({ id: 'skill:unlock-gap', status: 'gap', weight: 0.9 }),
      ],
      edges: [
        edge({ from: 'skill:anchor', to: 'role:target', weight: 0.15, kind: 'prereq' }),
        edge({ from: 'skill:unlock-gap', to: 'role:target', weight: 0.6, kind: 'unlock' }),
      ],
    })
    const move = computeNextMove(g)
    expect(move).not.toBeNull()
    expect(move!.nodeId).toBe('skill:unlock-gap')
    expect(move!.actionKind).toBe<NextMoveKind>('mock')
  })

  it('uses `module` action kind for a plain `gap` node with only prereq edges', () => {
    const g = makeGraph({
      targetRoleId: 'target',
      nodes: [
        node({ id: 'role:target', kind: 'role', status: 'unknown' }),
        node({ id: 'skill:anchor', status: 'confirmed', weight: 0.7 }),
        node({ id: 'skill:plain-gap', status: 'gap', weight: 0.6 }),
      ],
      edges: [
        edge({ from: 'skill:anchor', to: 'role:target', weight: 0.15, kind: 'prereq' }),
        edge({ from: 'skill:plain-gap', to: 'role:target', weight: 0.5, kind: 'prereq' }),
      ],
    })
    const move = computeNextMove(g)
    expect(move).not.toBeNull()
    expect(move!.nodeId).toBe('skill:plain-gap')
    expect(move!.actionKind).toBe<NextMoveKind>('module')
    expect(move!.label).toMatch(/Complete/)
    expect(move!.label).toMatch(/lesson/)
  })
})

describe('computeNextMove — time budget', () => {
  it('skips nodes whose estimated effort exceeds the budget', () => {
    const g = makeGraph({
      targetRoleId: 'target',
      nodes: [
        node({ id: 'role:target', kind: 'role', status: 'unknown' }),
        node({ id: 'skill:anchor', status: 'confirmed', weight: 0.7 }),
        // weight 0.95 -> 28 min estimated; budget 15 should skip it
        node({ id: 'skill:expensive', status: 'gap', weight: 0.95 }),
        // weight 0.3 -> 10 min minimum floor
        node({ id: 'skill:cheap', status: 'gap', weight: 0.3 }),
      ],
      edges: [
        edge({ from: 'skill:anchor', to: 'role:target', weight: 0.15, kind: 'prereq' }),
        edge({ from: 'skill:expensive', to: 'role:target', weight: 0.8, kind: 'prereq' }),
        edge({ from: 'skill:cheap', to: 'role:target', weight: 0.4, kind: 'prereq' }),
      ],
    })
    const move = computeNextMove(g, { timeBudgetMin: 15 })
    expect(move).not.toBeNull()
    expect(move!.nodeId).toBe('skill:cheap')
  })
})
