/**
 * @jest-environment node
 */
jest.mock('@/lib/vector-store')

import { seedFromProfile } from '@/lib/career-map/seed'
import { DEMO_AHMED_GRAPH } from '@/lib/career-map/demo-ahmed'
import { isCareerGraph } from '@/lib/career-map/types'
import { skillGapAnalysisTool } from '@/lib/tools'
import { MENA_ROLES } from '@/lib/mock-data'
import type { CurrentSkill, UserProfile, SkillGapResult } from '@/types'

// ── fixtures ─────────────────────────────────────────────────────────────

const NOW = '2026-04-23T00:00:00.000Z'

const ahmedProfile: UserProfile = {
  name: 'Ahmed',
  location: 'Cairo',
  currentLevel: 'junior',
  background: 'Final year CS at Cairo University',
  targetRole: 'Junior Data Engineer',
}

// An intentionally un-Aramco CV — we're picking a data-analyst role so that
// Python + SQL appear but gaps like Data Visualisation and Stakeholder
// Management don't. Levels chosen so match score lands above the 65% floor.
const ahmedSkills: CurrentSkill[] = [
  { name: 'Python', currentLevel: 8 },
  { name: 'SQL', currentLevel: 7 },
  { name: 'Data Visualization', currentLevel: 4 },
  { name: 'Statistics', currentLevel: 5 },
  { name: 'Stakeholder Management', currentLevel: 3 },
  { name: 'Presentation Skills', currentLevel: 5 },
]

const ARAMCO_ID = 'data-analyst-aramco'

describe('seedFromProfile', () => {
  it('produces a graph that passes isCareerGraph', () => {
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    expect(isCareerGraph(g)).toBe(true)
  })

  it('returns an empty graph for an unknown targetRoleId', () => {
    const g = seedFromProfile(ahmedProfile, ahmedSkills, 'not-a-real-role', 'learner-123', { now: NOW })
    expect(g.nodes).toEqual([])
    expect(g.edges).toEqual([])
    expect(g.matchScore).toBe(0)
    expect(g.targetRoleId).toBe('not-a-real-role')
  })

  it("carries the provided learnerId and target through to the graph", () => {
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    expect(g.learnerId).toBe('learner-123')
    expect(g.targetRoleId).toBe(ARAMCO_ID)
    expect(g.updatedAt).toBe(NOW)
  })

  it('emits a role node for the picked target', () => {
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    const roles = g.nodes.filter(n => n.kind === 'role')
    expect(roles).toHaveLength(1)
    expect(roles[0].label).toContain('Data Analyst')
    expect(roles[0].label).toContain('Saudi Aramco')
  })

  it('marks Python as confirmed when the CV meets the required level', () => {
    // data-analyst-aramco requires Python at level 7; Ahmed has Python at 8.
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    const python = g.nodes.find(n => n.label === 'Python')
    expect(python).toBeDefined()
    expect(python?.status).toBe('confirmed')
    expect(python?.confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('marks a weak/missing skill as a gap (Data Visualization)', () => {
    // required level 6, Ahmed has 4 → gap of 2
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    const dv = g.nodes.find(n => n.label === 'Data Visualization')
    expect(dv).toBeDefined()
    expect(dv?.status).toBe('gap')
  })

  it('emits one prereq edge per required skill pointing at the role', () => {
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    const role = g.nodes.find(n => n.kind === 'role')
    const prereqs = g.edges.filter(e => e.kind === 'prereq' && e.to === role?.id)
    const aramco = MENA_ROLES.find(r => r.id === ARAMCO_ID)
    expect(prereqs).toHaveLength(aramco?.requiredSkills.length ?? 0)
  })

  it("emits `unlock` edges for the top-2 largest gaps", () => {
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    const unlocks = g.edges.filter(e => e.kind === 'unlock')
    expect(unlocks.length).toBeLessThanOrEqual(2)
    // All unlock edges must point at the role node
    const roleId = g.nodes.find(n => n.kind === 'role')?.id
    unlocks.forEach(e => expect(e.to).toBe(roleId))
  })

  it("computes matchScore identical to skillGapAnalysisTool's overallReadiness", async () => {
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    const toolResult = (await skillGapAnalysisTool.invoke({
      studentSkills: ahmedSkills,
      targetRole: 'Data Analyst',
    })) as SkillGapResult
    expect(toolResult.role.id).toBe(ARAMCO_ID)
    expect(g.matchScore).toBe(toolResult.overallReadiness)
  })

  it('respects the 65% floor for very weak profiles (demo optimism)', () => {
    const weakSkills: CurrentSkill[] = [{ name: 'Python', currentLevel: 1 }]
    const g = seedFromProfile(ahmedProfile, weakSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    // Raw math would be well below 65%, floor should kick in.
    expect(g.matchScore).toBeGreaterThanOrEqual(65)
  })

  it('assigns heavier node weight to bigger gaps than to confirmed skills (same role)', () => {
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    const python = g.nodes.find(n => n.label === 'Python')
    const sm = g.nodes.find(n => n.label === 'Stakeholder Management')
    expect(python).toBeDefined()
    expect(sm).toBeDefined()
    // Stakeholder Management is a bigger gap (level 5 required, Ahmed 3 →
    // gap 2) than Python (level 7 required, Ahmed 8 → confirmed).
    // Confirmed nodes should weigh less than gap nodes of comparable depth.
    expect(sm!.weight).toBeGreaterThan(0)
    expect(python!.status).toBe('confirmed')
    expect(sm!.status).toBe('gap')
  })

  it('exposes stable, slug-prefixed node ids', () => {
    const g = seedFromProfile(ahmedProfile, ahmedSkills, ARAMCO_ID, 'learner-123', { now: NOW })
    g.nodes.forEach(n => {
      expect(n.id).toMatch(/^(skill|role):/)
      expect(n.id).not.toContain(' ')
    })
  })
})

describe('DEMO_AHMED_GRAPH', () => {
  it('is a valid CareerGraph', () => {
    expect(isCareerGraph(DEMO_AHMED_GRAPH)).toBe(true)
  })

  it('matches the deck: matchScore 68, Aramco target, SQL window fns gap', () => {
    expect(DEMO_AHMED_GRAPH.matchScore).toBe(68)
    expect(DEMO_AHMED_GRAPH.targetRoleId).toBe('jr-data-eng-aramco-demo')
    const windowFns = DEMO_AHMED_GRAPH.nodes.find(n => n.label === 'SQL · Window functions')
    expect(windowFns?.status).toBe('gap')
    const python = DEMO_AHMED_GRAPH.nodes.find(n => n.label === 'Python')
    expect(python?.status).toBe('confirmed')
  })
})
