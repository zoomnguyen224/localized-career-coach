/**
 * @jest-environment node
 */
import { computeLayout, LAYOUT_CANVAS } from '@/components/home/layout'
import type { CareerGraph } from '@/lib/career-map'

function graphWith(nodes: CareerGraph['nodes']): CareerGraph {
  return {
    version: 1,
    learnerId: 'l',
    targetRoleId: null,
    nodes,
    edges: [],
    matchScore: 70,
    updatedAt: '2026-04-23T00:00:00.000Z',
  }
}

describe('computeLayout', () => {
  it('places every node within the canvas bounds', () => {
    const g = graphWith([
      {
        id: 'skill:python',
        label: 'Python',
        kind: 'skill',
        status: 'confirmed',
        confidence: 0.9,
        evidence: [],
        weight: 0.5,
      },
      {
        id: 'skill:sql',
        label: 'SQL',
        kind: 'skill',
        status: 'gap',
        confidence: 0.9,
        evidence: [],
        weight: 0.7,
      },
      {
        id: 'role:aramco',
        label: 'Role',
        kind: 'role',
        status: 'unknown',
        confidence: 1,
        evidence: [],
        weight: 1,
      },
    ])
    const layout = computeLayout(g)
    Object.values(layout).forEach(pos => {
      expect(pos.x).toBeGreaterThanOrEqual(0)
      expect(pos.x).toBeLessThanOrEqual(LAYOUT_CANVAS.width)
      expect(pos.y).toBeGreaterThanOrEqual(0)
      expect(pos.y).toBeLessThanOrEqual(LAYOUT_CANVAS.height)
    })
  })

  it('is deterministic for the same input', () => {
    const g = graphWith([
      {
        id: 'skill:a',
        label: 'a',
        kind: 'skill',
        status: 'confirmed',
        confidence: 0.9,
        evidence: [],
        weight: 0.5,
      },
      {
        id: 'skill:b',
        label: 'b',
        kind: 'skill',
        status: 'confirmed',
        confidence: 0.9,
        evidence: [],
        weight: 0.5,
      },
    ])
    const a = computeLayout(g)
    const b = computeLayout(g)
    expect(a).toEqual(b)
  })

  it('puts role nodes on the right, confirmed nodes on the left', () => {
    const g = graphWith([
      {
        id: 'skill:python',
        label: 'Python',
        kind: 'skill',
        status: 'confirmed',
        confidence: 0.9,
        evidence: [],
        weight: 0.5,
      },
      {
        id: 'role:aramco',
        label: 'Role',
        kind: 'role',
        status: 'unknown',
        confidence: 1,
        evidence: [],
        weight: 1,
      },
    ])
    const layout = computeLayout(g)
    expect(layout['skill:python'].x).toBeLessThan(layout['role:aramco'].x)
  })

  it('puts gap nodes between confirmed and role columns', () => {
    const g = graphWith([
      {
        id: 'skill:python',
        label: 'Python',
        kind: 'skill',
        status: 'confirmed',
        confidence: 0.9,
        evidence: [],
        weight: 0.5,
      },
      {
        id: 'skill:airflow',
        label: 'Airflow',
        kind: 'skill',
        status: 'gap',
        confidence: 0.9,
        evidence: [],
        weight: 0.7,
      },
      {
        id: 'role:aramco',
        label: 'Role',
        kind: 'role',
        status: 'unknown',
        confidence: 1,
        evidence: [],
        weight: 1,
      },
    ])
    const layout = computeLayout(g)
    expect(layout['skill:python'].x).toBeLessThan(layout['skill:airflow'].x)
    expect(layout['skill:airflow'].x).toBeLessThan(layout['role:aramco'].x)
  })
})
