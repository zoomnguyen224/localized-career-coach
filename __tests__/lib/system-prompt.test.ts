/**
 * @jest-environment node
 */
import {
  systemPrompt,
  buildInterviewSystemPrompt,
  type InterviewMapContext,
  type InterviewTargetRole,
} from '@/lib/system-prompt'
import { DEMO_AHMED_GRAPH } from '@/lib/career-map/demo-ahmed'
import { MENA_ROLES } from '@/lib/mock-data'

// Aramco-flavoured JD source for the snapshot. Use the real `data-analyst-aramco`
// MENA role as a stand-in for the deck's Jr. Data Engineer JD — it's the closest
// live MENA_ROLES entry (the demo Ahmed targetRoleId is a hand-authored fixture
// that's intentionally NOT in MENA_ROLES; see demo-ahmed.ts).
function ahmedAramcoArgs(): {
  targetRole: InterviewTargetRole
  mapContext: InterviewMapContext
} {
  const role = MENA_ROLES.find((r) => r.id === 'data-analyst-aramco')
  if (!role) throw new Error('test fixture: data-analyst-aramco missing from MENA_ROLES')

  const targetRole: InterviewTargetRole = {
    id: role.id,
    title: role.title,
    company: role.company,
    location: role.location,
    requiredSkills: role.requiredSkills,
  }

  const mapContext: InterviewMapContext = {
    matchScore: DEMO_AHMED_GRAPH.matchScore,
    nodes: DEMO_AHMED_GRAPH.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      status: n.status,
    })),
  }

  return { targetRole, mapContext }
}

describe('systemPrompt — base prompt unchanged', () => {
  it('still mentions the existing 11 tools so non-interview flows behave identically', () => {
    expect(systemPrompt).toMatch(/Localized AI Career Coach/)
    expect(systemPrompt).toMatch(/skill_gap_analysis/)
    expect(systemPrompt).toMatch(/learning_path/)
    expect(systemPrompt).toMatch(/expert_match/)
    expect(systemPrompt).toMatch(/job_market_scan/)
    expect(systemPrompt).toMatch(/generate_interview_question/)
  })

  it('does NOT mention write_map_node — the interview block carries that instruction', () => {
    // We deliberately keep the interview-only tool out of the base prompt so
    // it doesn't leak into generic chat turns where there's no map context.
    expect(systemPrompt).not.toMatch(/write_map_node/)
  })
})

describe('buildInterviewSystemPrompt — composition', () => {
  it('starts with the full base systemPrompt verbatim', () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    expect(out.startsWith(systemPrompt)).toBe(true)
  })

  it('appends an Interview Studio context section', () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    expect(out).toMatch(/## Interview Studio context/)
  })
})

describe('buildInterviewSystemPrompt — target JD block', () => {
  it("names the target role's title, company and location", () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    expect(out).toContain(targetRole.title)
    expect(out).toContain(targetRole.company)
    expect(out).toContain(targetRole.location)
  })

  it('lists every required skill with its level and category', () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    for (const skill of targetRole.requiredSkills) {
      expect(out).toContain(skill.name)
      expect(out).toContain(`level ${skill.level}/10`)
      expect(out).toContain(skill.category)
    }
  })
})

describe('buildInterviewSystemPrompt — map context block', () => {
  it('includes the session-start matchScore', () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    expect(out).toContain(`match ${mapContext.matchScore}%`)
  })

  it('lists every map node id, label, and status (no truncation)', () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    for (const node of mapContext.nodes) {
      expect(out).toContain(node.id)
      expect(out).toContain(node.label)
      expect(out).toContain(`status: ${node.status}`)
    }
  })

  it('handles an empty map by telling the agent to stay silent', () => {
    const { targetRole } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({
      targetRole,
      mapContext: { matchScore: 0, nodes: [] },
    })
    expect(out).toMatch(/empty map/i)
    expect(out).toMatch(/do not call write_map_node/i)
  })
})

describe('buildInterviewSystemPrompt — write_map_node instructions', () => {
  it('names the write_map_node tool the agent must use', () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    expect(out).toMatch(/write_map_node/)
  })

  it('explains when each status applies', () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    expect(out).toMatch(/status="weak"/)
    expect(out).toMatch(/status="confirmed"/)
    expect(out).toMatch(/status="gap"/)
  })

  it('requires evidence and a confidenceDelta in [-1, 1]', () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    expect(out).toMatch(/evidence/i)
    expect(out).toMatch(/confidenceDelta/)
    expect(out).toMatch(/\[-1,\s*1\]/)
  })

  it('forbids invented nodeIds and enforces silence-beats-filler', () => {
    const { targetRole, mapContext } = ahmedAramcoArgs()
    const out = buildInterviewSystemPrompt({ targetRole, mapContext })
    expect(out).toMatch(/do not invent nodeids/i)
    expect(out).toMatch(/silence beats filler/i)
    expect(out).toMatch(/stay silent/i)
  })
})

describe('buildInterviewSystemPrompt — purity', () => {
  it('is deterministic for identical args', () => {
    const a = ahmedAramcoArgs()
    const b = ahmedAramcoArgs()
    expect(buildInterviewSystemPrompt(a)).toBe(buildInterviewSystemPrompt(b))
  })

  it('produces a stable snapshot for the Ahmed map + Aramco JD case', () => {
    const out = buildInterviewSystemPrompt(ahmedAramcoArgs())
    expect(out).toMatchSnapshot()
  })
})
