// src/components/home/layout.ts
//
// Deterministic layout for a CareerGraph rendered inside /home's 900x520
// SVG canvas. Used when no hand-authored layout is provided (i.e. for
// seedFromProfile output). Ahmed's demo graph keeps its deck-matched
// coordinates via DEMO_AHMED_LAYOUT instead.

import type { CareerGraph } from '@/lib/career-map'

export interface Point {
  x: number
  y: number
}

const CANVAS = { width: 900, height: 520 }
const CENTER_Y = CANVAS.height / 2

// Anchor positions
const LEARNER_X = 170
const CONFIRMED_COL_X = 310
const GAP_COL_X = 480
const ROLE_COL_X = 740

/**
 * Computes a stable 2D position for every node in a CareerGraph. Confirmed
 * skills cluster left, gaps cluster middle, roles anchor right. Ordering is
 * deterministic on node ids so the same graph always renders the same way.
 */
export function computeLayout(graph: CareerGraph): Record<string, Point> {
  const positions: Record<string, Point> = {}

  const confirmed = graph.nodes
    .filter(n => n.kind === 'skill' && n.status === 'confirmed')
    .sort((a, b) => a.id.localeCompare(b.id))
  const gaps = graph.nodes
    .filter(n => n.kind === 'skill' && (n.status === 'gap' || n.status === 'weak' || n.status === 'unknown'))
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
  const roles = graph.nodes
    .filter(n => n.kind === 'role')
    .sort((a, b) => a.id.localeCompare(b.id))

  // Evenly space nodes vertically within each column.
  const stackY = (count: number, i: number, topPadding = 80, bottomPadding = 80): number => {
    if (count === 0) return CENTER_Y
    if (count === 1) return CENTER_Y
    const usable = CANVAS.height - topPadding - bottomPadding
    const step = usable / (count - 1)
    return topPadding + step * i
  }

  confirmed.forEach((n, i) => {
    positions[n.id] = { x: CONFIRMED_COL_X, y: stackY(confirmed.length, i) }
  })
  gaps.forEach((n, i) => {
    positions[n.id] = { x: GAP_COL_X, y: stackY(gaps.length, i, 110, 110) }
  })
  roles.forEach((n, i) => {
    // Primary role (first by id ascending) sits higher, secondary below.
    positions[n.id] = { x: ROLE_COL_X, y: stackY(roles.length, i, 100, 100) }
  })

  return positions
}

export const LAYOUT_LEARNER_POSITION: Point = { x: LEARNER_X - 110, y: CENTER_Y - 34 }
export const LAYOUT_CANVAS = CANVAS
