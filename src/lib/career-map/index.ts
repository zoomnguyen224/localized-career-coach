// src/lib/career-map/index.ts
//
// Barrel export for the career-map module.

export type {
  CareerGraph,
  CareerNode,
  CareerEdge,
  NodeStatus,
  NodeKind,
  NodeEvidence,
} from './types'
export { isCareerGraph, isCareerNode, isCareerEdge } from './types'
export { saveGraph, loadGraph, clearGraph, STORAGE_KEY_PREFIX } from './store'
