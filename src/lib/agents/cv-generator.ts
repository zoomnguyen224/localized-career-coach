// src/lib/agents/cv-generator.ts
import { readFileSync } from 'fs'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { CVGenerationResult } from '@/types/cv'

interface CVGenerationInput {
  cvMarkdown: string
  jobTitle: string
  jobDescription: string
  company: string
}

export function buildCVPrompt(input: CVGenerationInput): string {
  const pdfPrompt = readFileSync(join(process.cwd(), 'src/prompts/pdf.md'), 'utf-8')

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

Create a tailored ATS-optimized version of this CV for the target job:
1. Extract 10–15 ATS keywords from the job description
2. Inject those keywords naturally into the CV (never invent achievements)
3. Rewrite the Professional Summary (3–4 lines, keyword-dense, MENA-aware)
4. Reorder experience bullets to highlight most relevant achievements first
5. Produce the complete tailored CV as a single self-contained HTML file

**HTML requirements (ATS-safe, Playwright-ready):**
- Single column layout, no sidebars
- Embedded CSS only (no external stylesheets or external fonts)
- Font stack: 'Helvetica Neue', Arial, sans-serif
- A4 width: max-width 794px, margin 0 auto, padding 48px
- Section headers: Professional Summary, Work Experience, Education, Skills
- Selectable text (no SVG/image text)

Return ONLY a JSON block (no prose before or after):

\`\`\`json
{
  "keywords": ["keyword1", "keyword2"],
  "keywordsInjected": <count>,
  "atsScore": <0-100>,
  "html": "<complete self-contained HTML string>"
}
\`\`\``
}

export function parseCVGenerationResponse(response: string): CVGenerationResult {
  try {
    const match = response.match(/```json\s*([\s\S]*?)```/)
    if (!match) throw new Error('No JSON block found')
    const parsed = JSON.parse(match[1])
    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      keywordsInjected: Number(parsed.keywordsInjected) || 0,
      atsScore: Math.min(100, Math.max(0, Number(parsed.atsScore) || 0)),
      html: typeof parsed.html === 'string' ? parsed.html : '',
    }
  } catch {
    return { keywords: [], keywordsInjected: 0, atsScore: 0, html: '' }
  }
}

export async function generateTailoredCV(input: CVGenerationInput): Promise<CVGenerationResult> {
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

  return parseCVGenerationResponse(text)
}
