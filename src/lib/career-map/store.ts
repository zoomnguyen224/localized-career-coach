// src/lib/career-map/store.ts
//
// localStorage CRUD for CareerGraph. Follows the existing session model
// (see src/lib/conversation-store.ts): entirely client-side, keyed per learner.
//
// Storage key layout: `career-map-v1:${learnerId}` — the version segment lets
// us bump the schema without stomping legacy payloads.
//
// SSR-safe: all reads/writes return `null` / no-op when `window` is undefined,
// which matches Next.js's server-component rendering path.

import type { CareerGraph } from './types'
import { isCareerGraph } from './types'

const KEY_PREFIX = 'career-map-v1:'

function storageKey(learnerId: string): string {
  return `${KEY_PREFIX}${learnerId}`
}

function hasWindow(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * Persist a CareerGraph to localStorage under the learner's key.
 * Silently no-ops on the server or if localStorage is unavailable.
 */
export function saveGraph(graph: CareerGraph): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(storageKey(graph.learnerId), JSON.stringify(graph))
  } catch {
    // QuotaExceeded / serialization errors: ignore — the map is a
    // convenience cache, not a source of truth.
  }
}

/**
 * Load a CareerGraph for the given learner, or `null` if absent / corrupt.
 * Also returns `null` on the server (SSR guard).
 */
export function loadGraph(learnerId: string): CareerGraph | null {
  if (!hasWindow()) return null
  try {
    const raw = window.localStorage.getItem(storageKey(learnerId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isCareerGraph(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Remove a learner's career map from localStorage. Useful for "reset"
 * flows and for test isolation.
 */
export function clearGraph(learnerId: string): void {
  if (!hasWindow()) return
  try {
    window.localStorage.removeItem(storageKey(learnerId))
  } catch {
    // ignore — nothing to recover.
  }
}

/** Exposed for test-only usage. Prefer the named helpers above. */
export const STORAGE_KEY_PREFIX = KEY_PREFIX
