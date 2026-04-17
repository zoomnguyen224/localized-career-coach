// src/lib/agents/cv-generator.ts
import { readFileSync } from 'fs'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import type { CVGenerationResult } from '@/types/cv'

interface CVGenerationInput {
  cvMarkdown: string
  jobTitle: string
  jobDescription: string
  company: string
}

interface ParsedCVResponse {
  placeholders: Record<string, string>
  keywords: string[]
  keywordsInjected: number
  atsScore: number
}

/**
 * Applies {{PLACEHOLDER}} substitutions to an HTML template string.
 * Pure function — safe to call in tests without file system access.
 */
export function applyTemplatePlaceholders(
  template: string,
  placeholders: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replaceAll(`{{${key}}}`, value ?? '')
  }
  return result
}

/**
 * Builds a MENA-optimized CV tailoring prompt.
 * Loads pdf.md system prompt from src/prompts/pdf.md.
 *
 * @throws Error if pdf.md cannot be read
 */
export function buildCVPrompt(input: CVGenerationInput): string {
  let pdfPrompt: string
  try {
    pdfPrompt = readFileSync(join(process.cwd(), 'src/prompts/pdf.md'), 'utf-8')
  } catch (error) {
    throw new Error(
      `Failed to load CV system prompt. Ensure src/prompts/pdf.md exists. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }

  return `You are a CV optimization agent specialized in the MENA job market.

${pdfPrompt}

---

## Candidate's Master CV

${input.cvMarkdown}

---

## Target Job

**Company:** ${input.company}
**Title:** ${input.jobTitle}
**Description:**
${input.jobDescription}

---

## Your Task

Create a tailored, ATS-optimized version of this CV for the target job.

Fill in these template placeholder values based on the candidate's CV and the target job:

- NAME — candidate's full name
- TAGLINE — 1-line descriptor (e.g., "Senior AI Engineer | Dubai, UAE")
- EMAIL — email address (from CV)
- PHONE — phone number (from CV, or empty string)
- LINKEDIN_URL — LinkedIn URL (from CV, or "#")
- LINKEDIN_DISPLAY — LinkedIn display text (e.g., "linkedin.com/in/ahmed")
- PORTFOLIO_URL — portfolio URL (from CV, or "#")
- PORTFOLIO_DISPLAY — portfolio display text (or empty string)
- LOCATION — city, country (e.g., "Dubai, UAE")
- WORK_AUTH_LINE — HTML for work authorization, e.g. \`<span class="work-auth-badge">Open to Work · UAE / KSA</span>\` or empty string
- LANG — "en"
- PAGE_WIDTH — "794px"
- SECTION_SUMMARY — "Professional Summary"
- SUMMARY_TEXT — 3–4 line keyword-dense ATS summary rewritten for this job (inject 5–8 JD keywords)
- SECTION_COMPETENCIES — "Core Competencies"
- COMPETENCIES — HTML: 12–15 \`<span class="competency-tag">Keyword</span>\` tags using top JD keywords
- SECTION_EXPERIENCE — "Work Experience"
- EXPERIENCE — HTML: complete \`<div class="job">...</div>\` blocks. Reorder bullets to highlight relevance to this role.
- SECTION_PROJECTS — "Projects" (or empty string if no projects)
- PROJECTS — HTML: \`<div class="project">...</div>\` blocks or empty string
- SECTION_EDUCATION — "Education"
- EDUCATION — HTML: education entries
- SECTION_CERTIFICATIONS — "Certifications" (or empty string)
- CERTIFICATIONS — HTML: certification entries or empty string
- SECTION_SKILLS — "Skills"
- SKILLS — HTML: skills section content

Return ONLY a JSON block (no prose before or after):

\`\`\`json
{
  "placeholders": {
    "NAME": "...",
    "TAGLINE": "...",
    "EMAIL": "...",
    "PHONE": "...",
    "LINKEDIN_URL": "...",
    "LINKEDIN_DISPLAY": "...",
    "PORTFOLIO_URL": "...",
    "PORTFOLIO_DISPLAY": "...",
    "LOCATION": "...",
    "WORK_AUTH_LINE": "...",
    "LANG": "en",
    "PAGE_WIDTH": "794px",
    "SECTION_SUMMARY": "Professional Summary",
    "SUMMARY_TEXT": "...",
    "SECTION_COMPETENCIES": "Core Competencies",
    "COMPETENCIES": "...",
    "SECTION_EXPERIENCE": "Work Experience",
    "EXPERIENCE": "...",
    "SECTION_PROJECTS": "...",
    "PROJECTS": "...",
    "SECTION_EDUCATION": "Education",
    "EDUCATION": "...",
    "SECTION_CERTIFICATIONS": "...",
    "CERTIFICATIONS": "...",
    "SECTION_SKILLS": "Skills",
    "SKILLS": "..."
  },
  "keywords": ["keyword1", "keyword2"],
  "keywordsInjected": <count>,
  "atsScore": <0-100>
}
\`\`\``
}

/**
 * Parses Claude's JSON block response into structured placeholder data.
 * Returns safe defaults on any parse failure.
 */
export function parseCVGenerationResponse(response: string): ParsedCVResponse {
  try {
    const match = response.match(/```json\s*([\s\S]*?)```/)
    if (!match) throw new Error('No JSON block found')
    const parsed = JSON.parse(match[1])
    return {
      placeholders: parsed.placeholders && typeof parsed.placeholders === 'object'
        ? parsed.placeholders
        : {},
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      keywordsInjected: Number(parsed.keywordsInjected) || 0,
      atsScore: Math.min(100, Math.max(0, Number(parsed.atsScore) || 0)),
    }
  } catch {
    return { placeholders: {}, keywords: [], keywordsInjected: 0, atsScore: 0 }
  }
}

/**
 * Generates a tailored CV by having Claude fill in the cv-template.html placeholders.
 * Uses claude-sonnet-4-6 with the pdf.md system prompt loaded at runtime.
 *
 * @throws Error if template file or prompt file cannot be read
 */
export async function generateTailoredCV(input: CVGenerationInput): Promise<CVGenerationResult> {
  let template: string
  try {
    template = readFileSync(join(process.cwd(), 'src/templates/cv-template.html'), 'utf-8')
  } catch (error) {
    throw new Error(
      `Failed to load CV template. Ensure src/templates/cv-template.html exists. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const prompt = buildCVPrompt(input)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('')

  const { placeholders, keywords, keywordsInjected, atsScore } = parseCVGenerationResponse(text)
  const html = applyTemplatePlaceholders(template, placeholders)

  return { html, keywords, keywordsInjected, atsScore }
}
