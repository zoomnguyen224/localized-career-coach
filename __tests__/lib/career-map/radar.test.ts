/**
 * @jest-environment node
 */
import { applyRadarSignals, DEFAULT_MENA_SIGNALS } from '@/lib/career-map/radar'
import type { RadarSignal } from '@/lib/career-map/radar'
import { DEMO_AHMED_GRAPH } from '@/lib/career-map/demo-ahmed'
import { isCareerGraph } from '@/lib/career-map/types'
import type { CareerGraph } from '@/lib/career-map/types'

// ── fixture helpers ──────────────────────────────────────────────────────

const NOW = '2026-04-23T09:00:00.000Z'

function makeEmptyGraph(overrides: Partial<CareerGraph> = {}): CareerGraph {
  return {
    version: 1,
    learnerId: 'learner-test',
    targetRoleId: null,
    nodes: [],
    edges: [],
    matchScore: 70,
    updatedAt: NOW,
    ...overrides,
  }
}

/** Deep-clones through JSON — sufficient for structural equality checks
 *  on the POJOs produced by the career-map module. */
function snap<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

describe('applyRadarSignals', () => {
  it('returns a graph unchanged (structurally) when signals is empty', () => {
    const before = snap(DEMO_AHMED_GRAPH)
    const { graph, cards } = applyRadarSignals(DEMO_AHMED_GRAPH, [])
    expect(cards).toEqual([])
    expect(graph).toEqual(before) // structural equality preserved
    // And the input reference is untouched:
    expect(DEMO_AHMED_GRAPH).toEqual(before)
  })

  it('produces a valid CareerGraph after applying the default signals', () => {
    const { graph } = applyRadarSignals(DEMO_AHMED_GRAPH, DEFAULT_MENA_SIGNALS, { now: NOW })
    expect(isCareerGraph(graph)).toBe(true)
    expect(graph.updatedAt).toBe(NOW)
  })

  it('is pure: original input reference is structurally identical after call', () => {
    const before = snap(DEMO_AHMED_GRAPH)
    applyRadarSignals(DEMO_AHMED_GRAPH, DEFAULT_MENA_SIGNALS)
    expect(DEMO_AHMED_GRAPH).toEqual(before)
  })

  it('is deterministic: two calls with the same inputs produce structurally equal outputs', () => {
    const a = applyRadarSignals(DEMO_AHMED_GRAPH, DEFAULT_MENA_SIGNALS, { now: NOW })
    const b = applyRadarSignals(DEMO_AHMED_GRAPH, DEFAULT_MENA_SIGNALS, { now: NOW })
    expect(a.graph).toEqual(b.graph)
    expect(a.cards).toEqual(b.cards)
  })

  it('Aramco signal on Ahmed demo increases sql-window-fns weight and records evidence', () => {
    const before = DEMO_AHMED_GRAPH.nodes.find(n => n.id === 'skill:sql-window-fns')!
    const { graph } = applyRadarSignals(DEMO_AHMED_GRAPH, DEFAULT_MENA_SIGNALS, { now: NOW })
    const after = graph.nodes.find(n => n.id === 'skill:sql-window-fns')!
    expect(after.weight).toBeGreaterThan(before.weight)
    expect(after.status).toBe('gap')
    // At least one evidence entry should have been appended by the Aramco signal.
    const sources = after.evidence.map(e => e.source)
    expect(sources).toContain('radar:aramco-jd')
  })

  it("Gulf remote signal lifts S.Remote role node weight on the Ahmed demo", () => {
    const before = DEMO_AHMED_GRAPH.nodes.find(n => n.id === 'role:s-remote-demo')!
    const { graph } = applyRadarSignals(DEMO_AHMED_GRAPH, DEFAULT_MENA_SIGNALS, { now: NOW })
    const after = graph.nodes.find(n => n.id === 'role:s-remote-demo')!
    expect(after.weight).toBeGreaterThan(before.weight)
    const sources = after.evidence.map(e => e.source)
    expect(sources).toContain('radar:gulf-remote')
  })

  it('drops matchScore on the Ahmed demo when the Aramco signal is applied', () => {
    const { graph } = applyRadarSignals(DEMO_AHMED_GRAPH, DEFAULT_MENA_SIGNALS, { now: NOW })
    // DEMO_AHMED_GRAPH starts at 68. With all three default signals the
    // cumulative delta is -4 + 1 + 0.6 = -2.4 -> 68 - 2.4 = 65.6 -> rounded to 66.
    expect(graph.matchScore).toBeLessThan(DEMO_AHMED_GRAPH.matchScore)
    expect(graph.matchScore).toBeGreaterThanOrEqual(0)
  })

  it('clamps matchScore to [0, 100]', () => {
    const lowSignal: RadarSignal = {
      id: 'sig:hit-bottom',
      severity: 'high',
      headline: 'x',
      body: 'x',
      matchDelta: -500,
      impact: (g) => g,
    }
    const { graph } = applyRadarSignals(makeEmptyGraph({ matchScore: 10 }), [lowSignal])
    expect(graph.matchScore).toBe(0)

    const highSignal: RadarSignal = { ...lowSignal, id: 'sig:hit-top', matchDelta: 500 }
    const { graph: up } = applyRadarSignals(makeEmptyGraph({ matchScore: 80 }), [highSignal])
    expect(up.matchScore).toBe(100)
  })

  it('filters cards by the default suppression threshold (|delta| >= 0.5)', () => {
    const loud: RadarSignal = {
      id: 'sig:loud',
      severity: 'high',
      headline: 'loud',
      body: '',
      matchDelta: -4,
      impact: (g) => g,
    }
    const quiet: RadarSignal = {
      id: 'sig:quiet',
      severity: 'info',
      headline: 'quiet',
      body: '',
      matchDelta: 0.2,
      impact: (g) => g,
    }
    const threshold: RadarSignal = {
      id: 'sig:threshold',
      severity: 'med',
      headline: 'threshold',
      body: '',
      matchDelta: -0.5, // exactly on boundary — should be kept
      impact: (g) => g,
    }
    const { cards } = applyRadarSignals(makeEmptyGraph(), [loud, quiet, threshold])
    expect(cards.map(c => c.id)).toEqual(['sig:loud', 'sig:threshold'])
  })

  it('honours a custom suppression threshold', () => {
    const small: RadarSignal = {
      id: 'sig:small',
      severity: 'info',
      headline: '',
      body: '',
      matchDelta: 0.3,
      impact: (g) => g,
    }
    const { cards } = applyRadarSignals(makeEmptyGraph(), [small], { suppressBelow: 0.2 })
    expect(cards).toHaveLength(1)
  })

  it('preserves signal order in the returned cards array', () => {
    const a: RadarSignal = {
      id: 'a',
      severity: 'high',
      headline: '',
      body: '',
      matchDelta: -2,
      impact: (g) => g,
    }
    const b: RadarSignal = { ...a, id: 'b', matchDelta: +1 }
    const c: RadarSignal = { ...a, id: 'c', matchDelta: -3 }
    const { cards } = applyRadarSignals(makeEmptyGraph(), [a, b, c])
    expect(cards.map(x => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('the Aramco signal does NOT touch sql-window-fns weight when targetRoleId is not Aramco', () => {
    const nonAramcoGraph: CareerGraph = {
      ...DEMO_AHMED_GRAPH,
      targetRoleId: 'pm-careem', // real id, non-aramco
    }
    const before = nonAramcoGraph.nodes.find(n => n.id === 'skill:sql-window-fns')!
    // Run just the Aramco signal — we want to isolate its no-op path.
    const aramcoOnly = [DEFAULT_MENA_SIGNALS[0]]
    const { graph } = applyRadarSignals(nonAramcoGraph, aramcoOnly)
    const after = graph.nodes.find(n => n.id === 'skill:sql-window-fns')!
    expect(after.weight).toBe(before.weight)
    // The demo fixture already has one 'radar:aramco-jd' entry; the signal
    // should NOT append another one when the target is non-Aramco.
    const count = (arr: readonly { source: string }[]) =>
      arr.filter(e => e.source === 'radar:aramco-jd').length
    expect(count(after.evidence)).toBe(count(before.evidence))
  })

  it('exports three default MENA signals covering all three severities', () => {
    expect(DEFAULT_MENA_SIGNALS).toHaveLength(3)
    const severities = DEFAULT_MENA_SIGNALS.map(s => s.severity)
    expect(severities).toEqual(expect.arrayContaining(['high', 'med', 'info']))
  })
})
