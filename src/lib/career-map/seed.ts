// src/lib/career-map/seed.ts
//
// seedFromProfile(...) — turns a parsed CV (UserProfile + CurrentSkill[])
// plus a user-picked target role into a CareerGraph.
//
// The match-score formula intentionally mirrors `skillGapAnalysisTool` in
// src/lib/tools.ts (including its 65% floor for demo optimism) so the value
// rendered on /home agrees with the value the tool produces in chat.
// NOTE FOR TASK 3: the 65% floor can mask raw deltas. If the Radar needs a
// true "before/after" match, compute unfloored values there and display the
// floored value only in the UI. A shared helper in this file will help keep
// that consistent.

import { MENA_ROLES } from '@/lib/mock-data'
import type { CurrentSkill, UserProfile, MENARole } from '@/types'
import type { CareerGraph, CareerNode, CareerEdge } from './types'

// ── shared with src/lib/tools.ts (keep in sync) ──────────────────────────
// Adjacent skills that provide partial credit when the exact skill name is
// missing. Mirrors SKILL_CROSSMAP in tools.ts. Kept duplicated here to keep
// the seed pure — a future refactor can extract to a shared module.
const SKILL_CROSSMAP: Record<string, string[]> = {
  'machine learning': ['ml', 'llm', 'rag', 'ai', 'nlp', 'tensorflow', 'pytorch', 'generative ai', 'deep learning', 'scikit', 'data science', 'statistics', 'llm agents', 'rag pipelines'],
  'deep learning': ['llm', 'rag', 'ai', 'nlp', 'tensorflow', 'pytorch', 'machine learning', 'generative ai', 'neural', 'transformers', 'llm agents'],
  'cloud architecture': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'cloud', 'devops', 'infrastructure'],
  'mathematics': ['statistics', 'python', 'data science', 'machine learning', 'ml', 'data analysis', 'analytics'],
  'research communication': ['english', 'communication', 'presentation', 'leadership', 'writing', 'french', 'arabic', 'japanese', 'vietnamese', 'language', 'python', 'data analysis', 'technical writing'],
  'stakeholder management': ['product management', 'leadership', 'communication', 'agile', 'scrum', 'project management', 'presales'],
  'data engineering': ['python', 'sql', 'etl', 'spark', 'airflow', 'data pipelines', 'gcp', 'azure', 'aws'],
  'mlops': ['docker', 'kubernetes', 'ci/cd', 'devops', 'cloud', 'python', 'azure', 'gcp', 'aws'],
  'system design': ['software', 'architecture', 'backend', 'cloud', 'rest apis', 'microservices'],
  'nlp': ['llm', 'rag', 'ai', 'generative ai', 'python', 'transformers', 'llm agents'],
  'sql': ['data analysis', 'data engineering', 'database', 'python', 'analytics'],
  'aws': ['cloud', 'azure', 'gcp', 'docker', 'devops', 'infrastructure'],
  'azure': ['cloud', 'aws', 'gcp', 'docker', 'devops', 'infrastructure'],
  'product strategy': ['product management', 'product ownership', 'roadmapping', 'okrs', 'business strategy'],
  'product management': ['product ownership', 'product strategy', 'agile', 'scrum', 'stakeholder management'],
}

function inferCrossCredit(requiredSkillName: string, skillMap: Map<string, number>): number {
  const related = SKILL_CROSSMAP[requiredSkillName.toLowerCase()]
  if (!related) return 0

  let maxRelated = 0
  for (const relatedTerm of related) {
    for (const [key, level] of skillMap.entries()) {
      if (key.includes(relatedTerm) || relatedTerm.includes(key)) {
        if (level > maxRelated) maxRelated = level
      }
    }
  }
  if (maxRelated === 0) return 0
  return Math.max(1, Math.round(maxRelated * 0.65))
}

// ── slug helpers ─────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function skillNodeId(name: string): string {
  return `skill:${slugify(name)}`
}

function roleNodeId(roleId: string): string {
  return `role:${roleId}`
}

// ── seed ─────────────────────────────────────────────────────────────────

export interface SeedOptions {
  /** Override for tests; defaults to `new Date().toISOString()`. */
  now?: string
}

/**
 * Turn a parsed CV profile + picked target role into an initial CareerGraph.
 * If `targetRoleId` is not found in MENA_ROLES the graph is still produced
 * with an empty node list and matchScore 0 — callers should verify the id
 * before invoking.
 */
export function seedFromProfile(
  profile: UserProfile,
  currentSkills: CurrentSkill[],
  targetRoleId: string,
  learnerId: string,
  options: SeedOptions = {}
): CareerGraph {
  const now = options.now ?? new Date().toISOString()
  const role: MENARole | undefined = MENA_ROLES.find(r => r.id === targetRoleId)

  if (!role) {
    return {
      version: 1,
      learnerId,
      targetRoleId,
      nodes: [],
      edges: [],
      matchScore: 0,
      updatedAt: now,
    }
  }

  // Map of lowercase skill name → current CV level (1..10).
  const skillMap = new Map(
    currentSkills.map(s => [s.name.toLowerCase(), s.currentLevel] as const)
  )

  const nodes: CareerNode[] = []
  const edges: CareerEdge[] = []

  // ── role node (target) ────────────────────────────────────────────────
  const roleNode: CareerNode = {
    id: roleNodeId(role.id),
    label: `${role.title} · ${role.company}`,
    kind: 'role',
    status: 'unknown',
    confidence: 1,
    evidence: [
      {
        source: 'user:target-picker',
        at: now,
        detail: `${role.company} — ${role.location}`,
      },
    ],
    weight: 1,
  }
  nodes.push(roleNode)

  // ── skill nodes (one per required skill) ──────────────────────────────
  let totalRequiredLevel = 0
  let totalCurrentLevel = 0
  const gapsBySkill: Array<{ node: CareerNode; gapSize: number }> = []

  for (const req of role.requiredSkills) {
    const lowerName = req.name.toLowerCase()
    const direct = skillMap.get(lowerName)
    const cross = direct === undefined ? inferCrossCredit(req.name, skillMap) : 0
    const effectiveLevel = direct ?? cross
    const gap = Math.max(0, req.level - effectiveLevel)

    // A skill is "confirmed" if the learner meets or exceeds the required
    // level; otherwise it's a "gap" (use 'unknown' only if we truly have no
    // signal — we always have a signal for the required skill here).
    const status: CareerNode['status'] = effectiveLevel >= req.level ? 'confirmed' : 'gap'

    // Node weight surfaces the severity of the gap; confirmed skills still
    // carry some weight so they render at a sensible size.
    const weight = status === 'confirmed' ? 0.3 + Math.min(req.level / 10, 0.5) : Math.min(gap / 10, 0.95)

    // Confidence: high when the direct match is strong, medium for crossmap,
    // lower when the gap is wide and there's no signal.
    const confidence =
      direct !== undefined ? 0.95 : cross > 0 ? 0.6 : 0.4

    const node: CareerNode = {
      id: skillNodeId(req.name),
      label: req.name,
      kind: 'skill',
      status,
      confidence,
      evidence:
        direct !== undefined
          ? [{ source: 'cv', at: now, detail: `level ${direct}/10 from CV` }]
          : cross > 0
          ? [{ source: 'cv:cross', at: now, detail: `inferred ${cross}/10 from adjacent skills` }]
          : [{ source: 'cv:missing', at: now, detail: 'not detected in CV' }],
      weight,
    }
    nodes.push(node)
    totalRequiredLevel += req.level
    totalCurrentLevel += Math.min(effectiveLevel, req.level)

    if (status === 'gap') gapsBySkill.push({ node, gapSize: gap })

    // Prereq edge from the confirmed skill into the role; higher cost for
    // un-confirmed skills so Next Move will see the gap as "expensive."
    edges.push({
      from: node.id,
      to: roleNode.id,
      weight: status === 'confirmed' ? 0.15 : Math.min(0.3 + gap / 10, 0.95),
      kind: 'prereq',
    })
  }

  // ── unlock edges: highlight the top-2 highest-gap skills ──────────────
  // These edges don't add new connections (the prereqs already exist); they
  // re-label the biggest gaps so Next Move can find them fast.
  gapsBySkill
    .sort((a, b) => b.gapSize - a.gapSize)
    .slice(0, 2)
    .forEach(({ node, gapSize }) => {
      edges.push({
        from: node.id,
        to: roleNode.id,
        weight: Math.min(0.2 + gapSize / 10, 0.9),
        kind: 'unlock',
      })
    })

  // ── matchScore (mirrors skillGapAnalysisTool including 65% floor) ─────
  const rawPercent =
    totalRequiredLevel === 0 ? 0 : Math.round((totalCurrentLevel / totalRequiredLevel) * 100)
  const matchScore = Math.max(65, rawPercent)

  // Apply the match score to the role node's weight-ish field via evidence
  // (the role itself isn't a skill, so weight stays 1). We attach the
  // percent to the role node's evidence for later visual use.
  roleNode.evidence.push({
    source: 'seed:matchScore',
    at: now,
    detail: `${matchScore}% match`,
  })

  // Record the learner's current-level / background hint in evidence.
  if (profile.currentLevel || profile.location) {
    roleNode.evidence.push({
      source: 'profile',
      at: now,
      detail: [profile.currentLevel, profile.location].filter(Boolean).join(' · '),
    })
  }

  return {
    version: 1,
    learnerId,
    targetRoleId,
    nodes,
    edges,
    matchScore,
    updatedAt: now,
  }
}
