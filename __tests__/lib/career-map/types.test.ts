/**
 * @jest-environment jsdom
 */
import type { CareerGraph, CareerNode, CareerEdge } from '@/lib/career-map/types'
import { isCareerGraph, isCareerNode, isCareerEdge } from '@/lib/career-map/types'

function makeNode(overrides: Partial<CareerNode> = {}): CareerNode {
  return {
    id: 'python',
    label: 'Python',
    kind: 'skill',
    status: 'confirmed',
    confidence: 0.9,
    evidence: [],
    weight: 0.5,
    ...overrides,
  }
}

function makeEdge(overrides: Partial<CareerEdge> = {}): CareerEdge {
  return { from: 'python', to: 'aramco', weight: 0.3, kind: 'prereq', ...overrides }
}

function makeGraph(overrides: Partial<CareerGraph> = {}): CareerGraph {
  return {
    version: 1,
    learnerId: 'learner-123',
    targetRoleId: 'aramco',
    nodes: [makeNode()],
    edges: [],
    matchScore: 68,
    updatedAt: '2026-04-23T00:00:00.000Z',
    ...overrides,
  }
}

describe('isCareerNode', () => {
  it('accepts a well-formed node', () => {
    expect(isCareerNode(makeNode())).toBe(true)
  })

  it('rejects non-object inputs', () => {
    expect(isCareerNode(null)).toBe(false)
    expect(isCareerNode(undefined)).toBe(false)
    expect(isCareerNode('python')).toBe(false)
    expect(isCareerNode(42)).toBe(false)
  })

  it('rejects invalid kind', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isCareerNode(makeNode({ kind: 'gibberish' as any }))).toBe(false)
  })

  it('rejects invalid status', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isCareerNode(makeNode({ status: 'perfect' as any }))).toBe(false)
  })

  it('rejects confidence out of [0,1]', () => {
    expect(isCareerNode(makeNode({ confidence: 1.5 }))).toBe(false)
    expect(isCareerNode(makeNode({ confidence: -0.1 }))).toBe(false)
  })
})

describe('isCareerEdge', () => {
  it('accepts a well-formed edge', () => {
    expect(isCareerEdge(makeEdge())).toBe(true)
  })

  it('rejects edges with weight outside [0,1]', () => {
    expect(isCareerEdge(makeEdge({ weight: 2 }))).toBe(false)
    expect(isCareerEdge(makeEdge({ weight: -1 }))).toBe(false)
  })

  it('rejects edges with bad kind', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isCareerEdge(makeEdge({ kind: 'sideways' as any }))).toBe(false)
  })
})

describe('isCareerGraph', () => {
  it('accepts a well-formed graph', () => {
    expect(isCareerGraph(makeGraph())).toBe(true)
  })

  it('accepts graphs with targetRoleId set to null', () => {
    expect(isCareerGraph(makeGraph({ targetRoleId: null }))).toBe(true)
  })

  it('rejects graphs with version other than 1', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isCareerGraph(makeGraph({ version: 2 as any }))).toBe(false)
  })

  it('rejects graphs with matchScore out of [0,100]', () => {
    expect(isCareerGraph(makeGraph({ matchScore: 120 }))).toBe(false)
    expect(isCareerGraph(makeGraph({ matchScore: -5 }))).toBe(false)
  })

  it('rejects graphs with missing learnerId', () => {
    expect(isCareerGraph(makeGraph({ learnerId: '' }))).toBe(false)
  })

  it('rejects graphs with a malformed node in the nodes array', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isCareerGraph(makeGraph({ nodes: [{ id: 'x' } as any] }))).toBe(false)
  })

  it('rejects non-object inputs', () => {
    expect(isCareerGraph(null)).toBe(false)
    expect(isCareerGraph('graph')).toBe(false)
    expect(isCareerGraph([])).toBe(false)
  })
})
