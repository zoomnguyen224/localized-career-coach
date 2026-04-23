// src/lib/career-map/types.ts
//
// Core data model for the Career Map. A CareerGraph represents the learner's
// skills, the target role(s), and the relationships between them. Produced by
// seedFromProfile (CV → map) and read by /home, Radar, and Next Move.
//
// Kept framework-agnostic on purpose: pure TypeScript, no React, no Next deps.

export type NodeStatus = 'confirmed' | 'gap' | 'weak' | 'unknown'
export type NodeKind = 'skill' | 'role' | 'milestone'

export interface NodeEvidence {
  source: string      // e.g. 'cv', 'interview:2026-04-22', 'radar:aramco-jd'
  at: string          // ISO timestamp
  detail?: string
}

export interface CareerNode {
  id: string          // stable slug, e.g. 'sql-window-fns'
  label: string       // 'SQL window fns'
  kind: NodeKind
  status: NodeStatus
  confidence: number  // 0..1, how sure we are about `status`
  evidence: NodeEvidence[]
  weight: number      // importance / severity, set by seed + Radar
}

export interface CareerEdge {
  from: string        // node id
  to: string          // node id
  weight: number      // time/effort cost, 0..1 (lower = cheaper)
  kind: 'prereq' | 'unlock' | 'adjacent'
}

export interface CareerGraph {
  version: 1
  learnerId: string
  targetRoleId: string | null
  nodes: CareerNode[]
  edges: CareerEdge[]
  matchScore: number  // 0..100, computed from confirmed/required skills vs. target
  updatedAt: string   // ISO timestamp
}

// ── invariants / guards ──────────────────────────────────────────────────

export function isCareerGraph(value: unknown): value is CareerGraph {
  if (typeof value !== 'object' || value === null) return false
  const g = value as Partial<CareerGraph>
  if (g.version !== 1) return false
  if (typeof g.learnerId !== 'string' || g.learnerId.length === 0) return false
  if (g.targetRoleId !== null && typeof g.targetRoleId !== 'string') return false
  if (!Array.isArray(g.nodes) || !Array.isArray(g.edges)) return false
  if (typeof g.matchScore !== 'number' || g.matchScore < 0 || g.matchScore > 100) return false
  if (typeof g.updatedAt !== 'string') return false
  return g.nodes.every(isCareerNode) && g.edges.every(isCareerEdge)
}

export function isCareerNode(value: unknown): value is CareerNode {
  if (typeof value !== 'object' || value === null) return false
  const n = value as Partial<CareerNode>
  if (typeof n.id !== 'string' || n.id.length === 0) return false
  if (typeof n.label !== 'string') return false
  if (n.kind !== 'skill' && n.kind !== 'role' && n.kind !== 'milestone') return false
  if (
    n.status !== 'confirmed' &&
    n.status !== 'gap' &&
    n.status !== 'weak' &&
    n.status !== 'unknown'
  )
    return false
  if (typeof n.confidence !== 'number' || n.confidence < 0 || n.confidence > 1) return false
  if (!Array.isArray(n.evidence)) return false
  if (typeof n.weight !== 'number') return false
  return true
}

export function isCareerEdge(value: unknown): value is CareerEdge {
  if (typeof value !== 'object' || value === null) return false
  const e = value as Partial<CareerEdge>
  if (typeof e.from !== 'string' || typeof e.to !== 'string') return false
  if (typeof e.weight !== 'number' || e.weight < 0 || e.weight > 1) return false
  if (e.kind !== 'prereq' && e.kind !== 'unlock' && e.kind !== 'adjacent') return false
  return true
}
