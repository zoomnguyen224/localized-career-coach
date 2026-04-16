// src/lib/agents/job-evaluator.ts
import { readFileSync } from 'fs'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { ScoreBreakdown, SkillMatch } from '@/types/jobs'

interface EvaluationInput {
  jobTitle: string
  jobDescription: string
  company: string
  cvMarkdown: string
  targetRole?: string
  location?: string
}

export function buildEvaluationPrompt(input: EvaluationInput): string {
  // Load career-agent-cli prompt files at runtime
  const sharedPrompt = readFileSync(join(process.cwd(), 'src/prompts/_shared.md'), 'utf-8')
  const ofertaPrompt = readFileSync(join(process.cwd(), 'src/prompts/oferta.md'), 'utf-8')

  return `You are a career evaluation agent specialized in the MENA job market (GCC countries: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman).

${sharedPrompt}

---

${ofertaPrompt}

---

## Candidate CV

${input.cvMarkdown}

---

## Job to Evaluate

**Company:** ${input.company}
**Title:** ${input.jobTitle}
**Description:**
${input.jobDescription}

---

## Your Task

Evaluate this job against the candidate's CV using the scoring framework above. Consider MENA market context: Saudization/Emiratization requirements, Vision 2030 roles, Arabic language as an asset, GCC salary norms.

Return ONLY a JSON block in this exact format (no markdown prose outside the JSON):

\`\`\`json
{
  "overall": <1.0-5.0>,
  "cvMatch": <1.0-5.0>,
  "roleAlignment": <1.0-5.0>,
  "compensation": <1.0-5.0>,
  "culturalSignals": <1.0-5.0>,
  "redFlags": <string or null>,
  "recommendation": "<one sentence>",
  "archetype": "<detected archetype>",
  "skillsMatch": [
    { "skill": "<name>", "status": "strong" | "partial" | "gap", "note": "<short note>" }
  ]
}
\`\`\``
}

export function parseEvaluationResponse(response: string): ScoreBreakdown & { skillsMatch: SkillMatch[] } {
  try {
    const match = response.match(/```json\s*([\s\S]*?)```/)
    if (!match) throw new Error('No JSON block found')
    const parsed = JSON.parse(match[1])
    return {
      overall: Number(parsed.overall) || 3.0,
      cvMatch: Number(parsed.cvMatch) || 3.0,
      roleAlignment: Number(parsed.roleAlignment) || 3.0,
      compensation: Number(parsed.compensation) || 3.0,
      culturalSignals: Number(parsed.culturalSignals) || 3.0,
      redFlags: parsed.redFlags ?? null,
      recommendation: parsed.recommendation ?? '',
      archetype: parsed.archetype ?? 'Unknown',
      skillsMatch: Array.isArray(parsed.skillsMatch) ? parsed.skillsMatch : [],
    }
  } catch {
    return {
      overall: 3.0, cvMatch: 3.0, roleAlignment: 3.0,
      compensation: 3.0, culturalSignals: 3.0,
      redFlags: null,
      recommendation: 'Could not parse evaluation — please manually review this role.',
      archetype: 'Unknown',
      skillsMatch: [],
    }
  }
}

export async function evaluateJob(input: EvaluationInput): Promise<ScoreBreakdown & { skillsMatch: SkillMatch[] }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const prompt = buildEvaluationPrompt(input)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('')

  return parseEvaluationResponse(text)
}
