// src/lib/career-map/demo-ahmed.ts
//
// Deck-page-4 fixture: Ahmed's career map with Saudi Aramco Jr. Data Engineer
// as the primary target and Saudi Remote Ops as a secondary target.
// The deck calls out: matchScore 68%, SQL window fns as the critical gap,
// Airflow as a secondary gap, Python / SQL basic / Data modeling as confirmed.
//
// `targetRoleId: 'jr-data-eng-aramco-demo'` is intentionally NOT in
// MENA_ROLES — this is a hand-authored fixture matching the deck exactly.
// Regular `seedFromProfile` calls use real MENA_ROLES ids.

import type { CareerGraph } from './types'

const NOW = '2026-04-23T08:14:00.000Z'

export const DEMO_AHMED_GRAPH: CareerGraph = {
  version: 1,
  learnerId: 'demo:ahmed',
  targetRoleId: 'jr-data-eng-aramco-demo',
  matchScore: 68,
  updatedAt: NOW,
  nodes: [
    // ── target role (primary) ───────────────────────────────────────────
    {
      id: 'role:jr-data-eng-aramco-demo',
      label: 'Jr. Data Engineer · Saudi Aramco',
      kind: 'role',
      status: 'unknown',
      confidence: 1,
      evidence: [
        { source: 'demo:deck', at: NOW, detail: '68% match — deck page 4' },
        { source: 'seed:matchScore', at: NOW, detail: '68% match' },
      ],
      weight: 1,
    },
    // ── secondary role ──────────────────────────────────────────────────
    {
      id: 'role:s-remote-demo',
      label: 'Jr. Data Engineer · S.Remote',
      kind: 'role',
      status: 'unknown',
      confidence: 1,
      evidence: [{ source: 'demo:deck', at: NOW, detail: '81% match — deck page 4' }],
      weight: 0.9,
    },

    // ── confirmed skills ────────────────────────────────────────────────
    // `requiredLevel` + `currentLevel` on each skill node power
    // `recomputeMatchScore` (see src/lib/career-map/recompute-score.ts).
    // Numbers hand-tuned so the raw percent rounds to 68 — matching deck page
    // 4's match figure. Total required = 7+6+6+10+8 = 37. Capped current =
    // 7+6+6+4+2 = 25. round(25/37 * 100) = 68.
    {
      id: 'skill:python',
      label: 'Python',
      kind: 'skill',
      status: 'confirmed',
      confidence: 0.95,
      evidence: [{ source: 'cv', at: NOW, detail: 'level 8/10 from CV' }],
      weight: 0.75,
      requiredLevel: 7,
      currentLevel: 8,
    },
    {
      id: 'skill:sql',
      label: 'SQL · basics',
      kind: 'skill',
      status: 'confirmed',
      confidence: 0.9,
      evidence: [{ source: 'cv', at: NOW, detail: 'level 7/10 from CV' }],
      weight: 0.7,
      requiredLevel: 6,
      currentLevel: 7,
    },
    {
      id: 'skill:data-modeling',
      label: 'Data modeling',
      kind: 'skill',
      status: 'confirmed',
      confidence: 0.85,
      evidence: [{ source: 'cv', at: NOW, detail: 'level 7/10 from CV' }],
      weight: 0.65,
      requiredLevel: 6,
      currentLevel: 7,
    },

    // ── gaps ────────────────────────────────────────────────────────────
    {
      id: 'skill:sql-window-fns',
      label: 'SQL · Window functions',
      kind: 'skill',
      status: 'gap',
      confidence: 0.9,
      evidence: [
        { source: 'radar:aramco-jd', at: NOW, detail: 'added to must-haves 2d ago' },
        { source: 'cv:missing', at: NOW, detail: 'not detected in CV' },
      ],
      weight: 0.92,
      requiredLevel: 10,
      currentLevel: 4,
    },
    {
      id: 'skill:airflow',
      label: 'Airflow',
      kind: 'skill',
      status: 'gap',
      confidence: 0.8,
      evidence: [{ source: 'cv:missing', at: NOW, detail: 'not detected in CV' }],
      weight: 0.7,
      requiredLevel: 8,
      currentLevel: 2,
    },
  ],
  edges: [
    // prereq edges from confirmed skills into the primary role
    { from: 'skill:python', to: 'role:jr-data-eng-aramco-demo', weight: 0.15, kind: 'prereq' },
    { from: 'skill:sql', to: 'role:jr-data-eng-aramco-demo', weight: 0.15, kind: 'prereq' },
    { from: 'skill:data-modeling', to: 'role:jr-data-eng-aramco-demo', weight: 0.2, kind: 'prereq' },

    // gap edges — carry higher weight so Next Move surfaces them
    { from: 'skill:sql-window-fns', to: 'role:jr-data-eng-aramco-demo', weight: 0.85, kind: 'unlock' },
    { from: 'skill:airflow', to: 'role:jr-data-eng-aramco-demo', weight: 0.55, kind: 'prereq' },

    // supporting edges into the secondary role (cheaper — ahmed is closer)
    { from: 'skill:python', to: 'role:s-remote-demo', weight: 0.15, kind: 'prereq' },
    { from: 'skill:sql', to: 'role:s-remote-demo', weight: 0.15, kind: 'prereq' },
    { from: 'skill:data-modeling', to: 'role:s-remote-demo', weight: 0.25, kind: 'prereq' },
    { from: 'skill:sql-window-fns', to: 'role:s-remote-demo', weight: 0.6, kind: 'prereq' },
  ],
}

// Deck-matched SVG coordinates for the Ahmed fixture. Separate from the
// graph itself so `seedFromProfile`-produced graphs can use a deterministic
// radial layout while the deck demo keeps its hand-tuned positions.
export const DEMO_AHMED_LAYOUT: Record<string, { x: number; y: number }> = {
  'skill:python': { x: 300, y: 240 },
  'skill:sql': { x: 330, y: 170 },
  'skill:data-modeling': { x: 290, y: 360 },
  'skill:sql-window-fns': { x: 470, y: 130 },
  'skill:airflow': { x: 500, y: 270 },
  'role:jr-data-eng-aramco-demo': { x: 740, y: 100 },
  'role:s-remote-demo': { x: 740, y: 310 },
}
