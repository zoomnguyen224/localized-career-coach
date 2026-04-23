/**
 * @jest-environment jsdom
 */
import type { CareerGraph } from '@/lib/career-map/types'
import {
  saveGraph,
  loadGraph,
  clearGraph,
  STORAGE_KEY_PREFIX,
} from '@/lib/career-map/store'

function makeGraph(overrides: Partial<CareerGraph> = {}): CareerGraph {
  return {
    version: 1,
    learnerId: 'learner-1',
    targetRoleId: 'aramco',
    nodes: [
      {
        id: 'python',
        label: 'Python',
        kind: 'skill',
        status: 'confirmed',
        confidence: 0.95,
        evidence: [{ source: 'cv', at: '2026-04-23T00:00:00.000Z' }],
        weight: 0.5,
      },
    ],
    edges: [{ from: 'python', to: 'aramco', weight: 0.3, kind: 'prereq' }],
    matchScore: 68,
    updatedAt: '2026-04-23T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('saveGraph / loadGraph', () => {
  it('roundtrips a graph under the learner key', () => {
    const graph = makeGraph()
    saveGraph(graph)
    expect(loadGraph(graph.learnerId)).toEqual(graph)
  })

  it('writes under the versioned key prefix', () => {
    const graph = makeGraph()
    saveGraph(graph)
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${graph.learnerId}`)
    expect(raw).not.toBeNull()
  })

  it('uses `career-map-v1:` as the versioned prefix', () => {
    expect(STORAGE_KEY_PREFIX).toBe('career-map-v1:')
  })

  it('isolates graphs per learner', () => {
    const a = makeGraph({ learnerId: 'alice', matchScore: 50 })
    const b = makeGraph({ learnerId: 'bob', matchScore: 90 })
    saveGraph(a)
    saveGraph(b)
    expect(loadGraph('alice')?.matchScore).toBe(50)
    expect(loadGraph('bob')?.matchScore).toBe(90)
  })
})

describe('loadGraph', () => {
  it('returns null when nothing is stored', () => {
    expect(loadGraph('nobody')).toBeNull()
  })

  it('returns null for corrupt JSON', () => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}bad`, '{ not json')
    expect(loadGraph('bad')).toBeNull()
  })

  it('returns null for well-formed JSON that is not a CareerGraph', () => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}wrong-shape`, JSON.stringify({ hello: 'world' }))
    expect(loadGraph('wrong-shape')).toBeNull()
  })
})

describe('clearGraph', () => {
  it('removes the stored graph', () => {
    const graph = makeGraph()
    saveGraph(graph)
    clearGraph(graph.learnerId)
    expect(loadGraph(graph.learnerId)).toBeNull()
  })

  it('is a no-op when the key is absent', () => {
    expect(() => clearGraph('nobody-here')).not.toThrow()
  })
})

describe('SSR safety', () => {
  // We can't fully strip jsdom's window here, so we prove the guard by
  // shimming `window.localStorage` to a throwing stub and asserting the
  // functions swallow the failure instead of surfacing it.
  it('saveGraph does not throw when localStorage.setItem fails', () => {
    const originalSet = window.localStorage.setItem
    Object.defineProperty(window.localStorage, 'setItem', {
      value: () => {
        throw new Error('quota')
      },
      configurable: true,
    })
    try {
      expect(() => saveGraph(makeGraph())).not.toThrow()
    } finally {
      Object.defineProperty(window.localStorage, 'setItem', {
        value: originalSet,
        configurable: true,
      })
    }
  })

  it('loadGraph returns null when window is undefined (simulated)', () => {
    const originalWindow = globalThis.window
    // @ts-expect-error — deliberately stripping window for the SSR branch.
    delete globalThis.window
    try {
      expect(loadGraph('anyone')).toBeNull()
    } finally {
      // restore
      globalThis.window = originalWindow
    }
  })
})
