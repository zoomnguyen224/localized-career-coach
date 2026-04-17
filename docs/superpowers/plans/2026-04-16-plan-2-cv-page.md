# Plan 2: CV Page + PDF Generation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the My CV page — three-column layout with profile overview (left), live CV preview with keyword highlighting (center), and generated CVs list with PDF download (right) — powered by the career-agent-cli `pdf.md` prompt loaded at runtime.

**Architecture:** The cv-generator agent loads `src/prompts/pdf.md` via `readFileSync` (identical pattern to job-evaluator from Plan 1), calls `claude-sonnet-4-6` to produce tailored HTML with keyword injection, and returns structured JSON with `html`, `keywords`, `keywordsInjected`, and `atsScore`. PDF download calls a Playwright API route server-side. Generated CVs are stored in React state (in-memory, single demo user — no DB needed for Plan 2). The CV page is a thin server wrapper over a client component that holds all state.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, `@anthropic-ai/sdk` (already installed), `playwright` (new), `uuid@9` (already installed), career-agent-cli `pdf.md`

---

## File Map

**New files — prompts:**
- `src/prompts/pdf.md` — CV keyword injection prompt (copied from `career-agent-cli/modes/pdf.md`)

**New files — types:**
- `src/types/cv.ts` — `GeneratedCV`, `CVGenerationResult`

**New files — agent lib:**
- `src/lib/agents/cv-generator.ts` — `buildCVPrompt`, `parseCVGenerationResponse`, `generateTailoredCV`
- `src/lib/generate-pdf.ts` — `htmlToPdf` (Playwright wrapper, returns `Buffer`)

**New files — API routes:**
- `src/app/api/cv/generate/route.ts` — POST: `{ cvMarkdown, jobTitle, jobDescription, company }` → `CVGenerationResult`
- `src/app/api/cv/pdf/route.ts` — POST: `{ html }` → PDF binary (`application/pdf`)

**New files — UI components:**
- `src/components/cv/ProfileColumn.tsx` — profile card + skill bars + agent suggestions (pure display)
- `src/components/cv/CVPreview.tsx` — CV iframe preview + generate form + tailored banner (`'use client'`)
- `src/components/cv/GeneratedCVList.tsx` — generated CV cards + download buttons + "new job" CTA (`'use client'`)
- `src/components/cv/CVPageClient.tsx` — state orchestration: generates, stores, selects, downloads (`'use client'`)

**Modified files:**
- `src/app/(app)/cv/page.tsx` — replace stub with `<CVPageClient />`
- `src/types/index.ts` — add `export * from './cv'`

**New files — tests:**
- `__tests__/lib/cv-generator.test.ts`
- `__tests__/lib/generate-pdf.test.ts`
- `__tests__/app/api/cv/generate.test.ts`
- `__tests__/app/api/cv/pdf.test.ts`

---

## Task 1: Copy pdf.md prompt file

**Files:**
- Create: `src/prompts/pdf.md`

- [ ] **Step 1: Copy pdf.md from career-agent-cli**

```bash
cp "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/career-agent-cli/modes/pdf.md" \
   "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach/src/prompts/pdf.md"
```

- [ ] **Step 2: Verify**

```bash
ls "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach/src/prompts/"
```
Expected: `_shared.md  oferta.md  pdf.md  scan.md`

- [ ] **Step 3: Commit**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
git add src/prompts/pdf.md
git commit -m "chore: copy pdf.md prompt into src/prompts"
```

---

## Task 2: Define CV types

**Files:**
- Create: `src/types/cv.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create cv.ts**

```typescript
// src/types/cv.ts

export interface CVGenerationResult {
  html: string
  keywords: string[]
  keywordsInjected: number
  atsScore: number    // 0–100
}

export interface GeneratedCV {
  id: string
  company: string
  jobTitle: string
  generatedAt: string  // ISO string
  html: string
  keywords: string[]
  keywordsInjected: number
  atsScore: number    // 0–100
}
```

- [ ] **Step 2: Export from index**

Open `src/types/index.ts` and add at the bottom:

```typescript
export * from './cv'
```

- [ ] **Step 3: Commit**

```bash
git add src/types/cv.ts src/types/index.ts
git commit -m "feat: add CV types (GeneratedCV, CVGenerationResult)"
```

---

## Task 3: Build cv-generator agent (TDD)

**Files:**
- Create: `src/lib/agents/cv-generator.ts`
- Create: `__tests__/lib/cv-generator.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/cv-generator.test.ts
import { buildCVPrompt, parseCVGenerationResponse } from '@/lib/agents/cv-generator'

describe('buildCVPrompt', () => {
  it('includes CV markdown, job details, and company in the prompt', () => {
    const prompt = buildCVPrompt({
      cvMarkdown: '# Ahmed Nasser\nSenior AI Engineer',
      jobTitle: 'LLM Engineer',
      jobDescription: 'Build RAG pipelines and LLM systems',
      company: 'STC',
    })
    expect(prompt).toContain('Ahmed Nasser')
    expect(prompt).toContain('STC')
    expect(prompt).toContain('RAG pipelines')
    expect(prompt).toContain('LLM Engineer')
  })

  it('requests JSON output with required fields', () => {
    const prompt = buildCVPrompt({
      cvMarkdown: '# Test',
      jobTitle: 'Test Role',
      jobDescription: 'Test JD',
      company: 'Test Co',
    })
    expect(prompt).toContain('"html"')
    expect(prompt).toContain('"keywords"')
    expect(prompt).toContain('"atsScore"')
    expect(prompt).toContain('"keywordsInjected"')
  })
})

describe('parseCVGenerationResponse', () => {
  it('parses a well-formed JSON block', () => {
    const response = `
\`\`\`json
{
  "keywords": ["LLM", "RAG", "Python", "LangChain"],
  "keywordsInjected": 4,
  "atsScore": 87,
  "html": "<html><body><h1>Ahmed Nasser</h1></body></html>"
}
\`\`\`
`
    const result = parseCVGenerationResponse(response)
    expect(result.keywords).toEqual(['LLM', 'RAG', 'Python', 'LangChain'])
    expect(result.keywordsInjected).toBe(4)
    expect(result.atsScore).toBe(87)
    expect(result.html).toContain('Ahmed Nasser')
  })

  it('clamps atsScore to 0–100', () => {
    const response = '```json\n{"keywords":[],"keywordsInjected":0,"atsScore":150,"html":""}\n```'
    const result = parseCVGenerationResponse(response)
    expect(result.atsScore).toBe(100)
  })

  it('returns empty result on invalid JSON', () => {
    const result = parseCVGenerationResponse('not valid json at all')
    expect(result.keywords).toEqual([])
    expect(result.atsScore).toBe(0)
    expect(result.html).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/lib/cv-generator.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/agents/cv-generator'`

- [ ] **Step 3: Implement cv-generator.ts**

```typescript
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
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/lib/cv-generator.test.ts --no-coverage
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/cv-generator.ts __tests__/lib/cv-generator.test.ts
git commit -m "feat: cv-generator agent — loads pdf.md, keyword injection, parses Claude response"
```

---

## Task 4: Build PDF generator with Playwright

**Files:**
- Create: `src/lib/generate-pdf.ts`
- Create: `__tests__/lib/generate-pdf.test.ts`

- [ ] **Step 1: Install Playwright**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npm install playwright
npx playwright install chromium
```

- [ ] **Step 2: Write the failing test**

```typescript
// __tests__/lib/generate-pdf.test.ts
/** @jest-environment node */
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}))

import { htmlToPdf } from '@/lib/generate-pdf'
import { chromium } from 'playwright'

describe('htmlToPdf', () => {
  const mockClose = jest.fn().mockResolvedValue(undefined)
  const mockPdf = jest.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])) // %PDF
  const mockSetContent = jest.fn().mockResolvedValue(undefined)
  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue({ setContent: mockSetContent, pdf: mockPdf }),
    close: mockClose,
  }

  beforeEach(() => {
    ;(chromium.launch as jest.Mock).mockResolvedValue(mockBrowser)
    mockClose.mockClear()
    mockSetContent.mockClear()
    mockPdf.mockClear()
  })

  it('returns a Buffer', async () => {
    const result = await htmlToPdf('<html><body>Test</body></html>')
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it('closes browser even when setContent throws', async () => {
    mockSetContent.mockRejectedValueOnce(new Error('render error'))
    await expect(htmlToPdf('<html/>')).rejects.toThrow('render error')
    expect(mockClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest __tests__/lib/generate-pdf.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/generate-pdf'`

- [ ] **Step 4: Implement generate-pdf.ts**

```typescript
// src/lib/generate-pdf.ts
import { chromium } from 'playwright'

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/lib/generate-pdf.test.ts --no-coverage
```
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/generate-pdf.ts __tests__/lib/generate-pdf.test.ts package.json package-lock.json
git commit -m "feat: Playwright htmlToPdf — A4 PDF generation from HTML"
```

---

## Task 5: API routes for CV generate + PDF

**Files:**
- Create: `src/app/api/cv/generate/route.ts`
- Create: `src/app/api/cv/pdf/route.ts`
- Create: `__tests__/app/api/cv/generate.test.ts`
- Create: `__tests__/app/api/cv/pdf.test.ts`

- [ ] **Step 1: Write generate route test**

```typescript
// __tests__/app/api/cv/generate.test.ts
/** @jest-environment node */
import { POST } from '@/app/api/cv/generate/route'

jest.mock('@/lib/agents/cv-generator', () => ({
  generateTailoredCV: jest.fn().mockResolvedValue({
    keywords: ['LLM', 'RAG'],
    keywordsInjected: 2,
    atsScore: 85,
    html: '<html><body>Tailored CV</body></html>',
  }),
}))

describe('POST /api/cv/generate', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/cv/generate', {
      method: 'POST',
      body: JSON.stringify({ cvMarkdown: '# Test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns generation result with 200 status', async () => {
    const req = new Request('http://localhost/api/cv/generate', {
      method: 'POST',
      body: JSON.stringify({
        cvMarkdown: '# Ahmed Nasser',
        jobTitle: 'LLM Engineer',
        jobDescription: 'Build RAG systems',
        company: 'STC',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.atsScore).toBe(85)
    expect(data.keywords).toEqual(['LLM', 'RAG'])
  })
})
```

- [ ] **Step 2: Write pdf route test**

```typescript
// __tests__/app/api/cv/pdf.test.ts
/** @jest-environment node */
import { POST } from '@/app/api/cv/pdf/route'

jest.mock('@/lib/generate-pdf', () => ({
  htmlToPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-test')),
}))

describe('POST /api/cv/pdf', () => {
  it('returns 400 when html field is missing', async () => {
    const req = new Request('http://localhost/api/cv/pdf', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns PDF with content-type application/pdf', async () => {
    const req = new Request('http://localhost/api/cv/pdf', {
      method: 'POST',
      body: JSON.stringify({ html: '<html><body>CV</body></html>' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/app/api/cv/ --no-coverage
```
Expected: FAIL — routes don't exist yet

- [ ] **Step 4: Implement generate route**

```typescript
// src/app/api/cv/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateTailoredCV } from '@/lib/agents/cv-generator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cvMarkdown, jobTitle, jobDescription, company } = body
    if (!cvMarkdown || !jobTitle || !jobDescription || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: cvMarkdown, jobTitle, jobDescription, company' },
        { status: 400 }
      )
    }
    const result = await generateTailoredCV({ cvMarkdown, jobTitle, jobDescription, company })
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('CV generation failed:', error)
    return NextResponse.json({ error: 'CV generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Implement pdf route**

```typescript
// src/app/api/cv/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { htmlToPdf } from '@/lib/generate-pdf'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { html } = body
    if (!html) {
      return NextResponse.json({ error: 'Missing html field' }, { status: 400 })
    }
    const pdfBuffer = await htmlToPdf(html)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="cv-tailored.pdf"',
      },
    })
  } catch (error) {
    console.error('PDF generation failed:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Run tests**

```bash
npx jest __tests__/app/api/cv/ --no-coverage
```
Expected: PASS (2 suites, 4 tests)

- [ ] **Step 7: Commit**

```bash
git add src/app/api/cv/ __tests__/app/api/cv/
git commit -m "feat: /api/cv/generate and /api/cv/pdf routes"
```

---

## Task 6: CV page components — ProfileColumn, CVPreview, GeneratedCVList

**Files:**
- Create: `src/components/cv/ProfileColumn.tsx`
- Create: `src/components/cv/CVPreview.tsx`
- Create: `src/components/cv/GeneratedCVList.tsx`

- [ ] **Step 1: Create ProfileColumn**

```typescript
// src/components/cv/ProfileColumn.tsx
interface DemoProfile {
  name: string
  role: string
  location: string
  email: string
  completeness: number
  skills: Array<{ name: string; level: number }>
  suggestions: string[]
}

interface ProfileColumnProps {
  profile: DemoProfile
}

function skillColor(level: number): string {
  if (level >= 8) return 'bg-[#4584FF]'
  if (level >= 6) return 'bg-[#FAA82C]'
  return 'bg-[#F84E4E]'
}

export function ProfileColumn({ profile }: ProfileColumnProps) {
  const initials = profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="w-[260px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
      {/* Profile card */}
      <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[13px] font-extrabold text-[#06123C]">{profile.name}</div>
            <div className="text-[11px] text-[#727998] mt-0.5">{profile.role}</div>
          </div>
        </div>
        <div className="text-[11px] text-[#727998] mb-3">{profile.location} · {profile.email}</div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-semibold text-[#727998]">CV completeness</div>
          <div className="text-[10px] font-bold text-[#4584FF]">{profile.completeness}%</div>
        </div>
        <div className="h-1.5 bg-[#F2F3F6] rounded-full overflow-hidden">
          <div className="h-full bg-[#4584FF] rounded-full" style={{ width: `${profile.completeness}%` }} />
        </div>
      </div>

      {/* Skill bars */}
      <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">Top Skills</div>
        <div className="flex flex-col gap-2.5">
          {profile.skills.map(skill => (
            <div key={skill.name}>
              <div className="flex justify-between mb-1">
                <div className="text-[11px] font-semibold text-[#06123C]">{skill.name}</div>
                <div className="text-[11px] text-[#727998]">{skill.level}/10</div>
              </div>
              <div className="h-1.5 bg-[#F2F3F6] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${skillColor(skill.level)}`} style={{ width: `${skill.level * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent suggestions */}
      <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">Agent Suggestions</div>
        <div className="flex flex-col gap-2.5">
          {profile.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4584FF] flex-shrink-0 mt-1.5" />
              <div className="text-[11px] text-[#727998] leading-relaxed">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create CVPreview**

```typescript
// src/components/cv/CVPreview.tsx
'use client'

import { useState } from 'react'
import { GeneratedCV } from '@/types/cv'

interface CVPreviewProps {
  masterCvMarkdown: string
  activeCV: GeneratedCV | null
  onGenerate: (jobTitle: string, company: string, jobDescription: string) => Promise<void>
  isGenerating: boolean
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[^<]*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n+/g, '</p><p>')
}

export function CVPreview({ masterCvMarkdown, activeCV, onGenerate, isGenerating }: CVPreviewProps) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobTitle.trim() || !company.trim() || !jobDescription.trim()) return
    await onGenerate(jobTitle, company, jobDescription)
    setShowForm(false)
    setJobTitle('')
    setCompany('')
    setJobDescription('')
  }

  const masterHtml = `<!DOCTYPE html><html><head><style>
    body { font-family: -apple-system, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #06123C; padding: 32px; max-width: 700px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8D96B4; margin: 20px 0 8px; border-bottom: 1px solid #DCDFE8; padding-bottom: 4px; }
    h3 { font-size: 13px; font-weight: 700; margin: 8px 0 2px; }
    p { margin: 0 0 8px; color: #727998; }
    ul { margin: 4px 0 8px 16px; color: #727998; }
    li { margin-bottom: 3px; }
  </style></head><body><p>${markdownToHtml(masterCvMarkdown)}</p></body></html>`

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        {activeCV ? (
          <div className="bg-[#ECF3FF] border border-[#DCE8FF] rounded-[10px] px-4 py-3 flex-1 flex items-center justify-between">
            <div>
              <div className="text-[12px] font-bold text-[#4584FF]">
                Tailored for {activeCV.company} · {activeCV.jobTitle}
              </div>
              <div className="text-[11px] text-[#727998] mt-0.5">
                {activeCV.keywordsInjected} keywords injected · {activeCV.atsScore}% ATS score
              </div>
            </div>
            <div className="flex flex-wrap gap-1 max-w-[220px] ml-4">
              {activeCV.keywords.slice(0, 4).map(kw => (
                <span key={kw} className="bg-[#4584FF]/10 text-[#4584FF] text-[10px] font-semibold px-2 py-0.5 rounded-full">{kw}</span>
              ))}
              {activeCV.keywords.length > 4 && (
                <span className="text-[10px] text-[#727998]">+{activeCV.keywords.length - 4}</span>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-[13px] font-bold text-[#06123C]">Master CV</div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-[#4584FF] text-white text-[12px] font-bold px-4 py-2 rounded-[14px] ml-4 flex-shrink-0"
            >
              Generate tailored version
            </button>
          </>
        )}
      </div>

      {/* Generate form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 mb-4 flex-shrink-0 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
          <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">Generate tailored CV</div>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="Job title"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className="flex-1 border border-[#DCDFE8] rounded-[10px] px-3 py-2 text-[12px] text-[#06123C] placeholder:text-[#8D96B4] outline-none focus:border-[#4584FF]"
              required
            />
            <input
              type="text"
              placeholder="Company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="flex-1 border border-[#DCDFE8] rounded-[10px] px-3 py-2 text-[12px] text-[#06123C] placeholder:text-[#8D96B4] outline-none focus:border-[#4584FF]"
              required
            />
          </div>
          <textarea
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            rows={4}
            className="w-full border border-[#DCDFE8] rounded-[10px] px-3 py-2 text-[12px] text-[#06123C] placeholder:text-[#8D96B4] outline-none focus:border-[#4584FF] resize-none mb-3"
            required
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-[12px] text-[#727998] font-semibold px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={isGenerating} className="bg-[#4584FF] text-white text-[12px] font-bold px-5 py-2 rounded-[14px] disabled:opacity-50">
              {isGenerating ? 'Generating…' : 'Generate with agent'}
            </button>
          </div>
        </form>
      )}

      {/* CV preview iframe */}
      <div className="flex-1 bg-white border border-[#DCDFE8] rounded-[10px] overflow-hidden shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
        <iframe
          srcDoc={activeCV ? activeCV.html : masterHtml}
          className="w-full h-full border-none"
          title="CV Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create GeneratedCVList**

```typescript
// src/components/cv/GeneratedCVList.tsx
'use client'

import { GeneratedCV } from '@/types/cv'

interface GeneratedCVListProps {
  cvs: GeneratedCV[]
  activeId: string | null
  onSelect: (cv: GeneratedCV) => void
  onDownload: (cv: GeneratedCV) => void
  onStartNew: () => void
}

export function GeneratedCVList({ cvs, activeId, onSelect, onDownload, onStartNew }: GeneratedCVListProps) {
  return (
    <div className="w-[240px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
      <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] flex-shrink-0">Generated CVs</div>

      {cvs.length === 0 && (
        <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-4 text-[11px] text-[#727998] text-center leading-relaxed">
          No tailored CVs yet.<br />Use the center panel to generate one.
        </div>
      )}

      {cvs.map(cv => (
        <div
          key={cv.id}
          onClick={() => onSelect(cv)}
          className={`bg-white border rounded-[10px] p-4 cursor-pointer transition-all ${
            activeId === cv.id
              ? 'border-[#4584FF] shadow-[0_2px_20px_rgba(69,132,255,0.15)]'
              : 'border-[#DCDFE8] hover:border-[#4584FF]'
          }`}
        >
          <div className="text-[12px] font-bold text-[#06123C] truncate">{cv.company}</div>
          <div className="text-[11px] text-[#727998] truncate mt-0.5">{cv.jobTitle}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-[#E6FAF4] text-[#009C6C] text-[10px] font-bold px-2 py-0.5 rounded-full">
              {cv.atsScore}% ATS
            </span>
            <span className="text-[10px] text-[#8D96B4]">{cv.keywordsInjected} kw</span>
          </div>
          <div className="text-[10px] text-[#8D96B4] mt-1">
            {new Date(cv.generatedAt).toLocaleDateString()}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDownload(cv) }}
            className="w-full mt-3 bg-[#ECF3FF] text-[#4584FF] text-[11px] font-bold py-1.5 rounded-lg hover:bg-[#DCE8FF] transition-colors"
          >
            Download PDF
          </button>
        </div>
      ))}

      <button
        onClick={onStartNew}
        className="flex-shrink-0 w-full border-2 border-dashed border-[#DCDFE8] rounded-[10px] py-4 text-[11px] text-[#8D96B4] font-semibold hover:border-[#4584FF] hover:text-[#4584FF] transition-colors"
      >
        + Generate for a new job
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
git add src/components/cv/ProfileColumn.tsx src/components/cv/CVPreview.tsx src/components/cv/GeneratedCVList.tsx
git commit -m "feat: CV page components — ProfileColumn, CVPreview, GeneratedCVList"
```

---

## Task 7: Wire CV page together

**Files:**
- Create: `src/components/cv/CVPageClient.tsx`
- Modify: `src/app/(app)/cv/page.tsx`

- [ ] **Step 1: Create CVPageClient**

```typescript
// src/components/cv/CVPageClient.tsx
'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { GeneratedCV } from '@/types/cv'
import { ProfileColumn } from './ProfileColumn'
import { CVPreview } from './CVPreview'
import { GeneratedCVList } from './GeneratedCVList'

const DEMO_PROFILE = {
  name: 'Ahmed Nasser',
  role: 'Senior AI Engineer',
  location: 'Dubai, UAE',
  email: 'ahmed.nasser@example.com',
  completeness: 87,
  skills: [
    { name: 'LLM / RAG', level: 9 },
    { name: 'Python', level: 9 },
    { name: 'LangChain', level: 8 },
    { name: 'MLOps', level: 7 },
    { name: 'Arabic NLP', level: 6 },
  ],
  suggestions: [
    'Add quantified metrics to Careem achievements (e.g. "reduced latency by 40%")',
    'Include Arabic NLP projects — highly valued in MENA tech roles',
    'Add a "Key Projects" section featuring your RAG systems work',
  ],
}

const DEMO_CV_MARKDOWN = `# Ahmed Nasser
Senior AI Engineer | Dubai, UAE | ahmed.nasser@example.com

## Summary
Senior AI Engineer with 6+ years building LLM pipelines, RAG systems, and production Generative AI applications. Led AI platform development at Careem serving 50M+ users.

## Experience
### AI Platform Lead — Careem (2022–Present)
- Built multi-modal RAG system handling 2M daily queries with 95% accuracy
- Led team of 8 engineers building LLM infrastructure
- Reduced model inference latency by 40% through quantization and caching
- Implemented Arabic NLP pipeline supporting multiple MENA dialects

### ML Engineer — Souq/Amazon (2019–2022)
- Trained recommendation models serving 20M product listings across MENA
- Built real-time fraud detection reducing fraudulent transactions by 60%
- Deployed MLOps pipeline on AWS SageMaker for 100+ model versions

## Education
MSc Computer Science (AI) — American University of Beirut (2019)
BSc Computer Engineering — Cairo University (2017)

## Skills
Python, LangChain, LlamaIndex, FastAPI, Docker, Kubernetes, AWS, Arabic NLP, RAG, LLM fine-tuning, Pinecone, Weaviate, PyTorch, Transformers`

export function CVPageClient() {
  const [generatedCVs, setGeneratedCVs] = useState<GeneratedCV[]>([])
  const [activeCV, setActiveCV] = useState<GeneratedCV | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate(jobTitle: string, company: string, jobDescription: string) {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvMarkdown: DEMO_CV_MARKDOWN, jobTitle, jobDescription, company }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const result = await res.json()
      const newCV: GeneratedCV = {
        id: uuidv4(),
        company,
        jobTitle,
        generatedAt: new Date().toISOString(),
        html: result.html,
        keywords: result.keywords ?? [],
        keywordsInjected: result.keywordsInjected ?? 0,
        atsScore: result.atsScore ?? 0,
      }
      setGeneratedCVs(prev => [newCV, ...prev])
      setActiveCV(newCV)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownload(cv: GeneratedCV) {
    try {
      const res = await fetch('/api/cv/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: cv.html }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cv-${cv.company.toLowerCase().replace(/\s+/g, '-')}-${cv.jobTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently ignore download errors in demo
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-xl font-extrabold text-[#06123C]">My CV</h1>
        <p className="text-[12px] text-[#727998] mt-0.5">
          Master CV · {generatedCVs.length} tailored {generatedCVs.length === 1 ? 'version' : 'versions'} generated
        </p>
      </div>

      {/* 3-column body */}
      <div className="flex flex-1 gap-5 px-7 pb-6 overflow-hidden">
        <ProfileColumn profile={DEMO_PROFILE} />
        <CVPreview
          masterCvMarkdown={DEMO_CV_MARKDOWN}
          activeCV={activeCV}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
        <GeneratedCVList
          cvs={generatedCVs}
          activeId={activeCV?.id ?? null}
          onSelect={setActiveCV}
          onDownload={handleDownload}
          onStartNew={() => setActiveCV(null)}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update cv/page.tsx**

Replace the entire content of `src/app/(app)/cv/page.tsx` with:

```typescript
// src/app/(app)/cv/page.tsx
import { CVPageClient } from '@/components/cv/CVPageClient'

export default function CVPage() {
  return <CVPageClient />
}
```

- [ ] **Step 3: Run build to verify no TypeScript errors**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npm run build 2>&1 | tail -20
```
Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/cv/CVPageClient.tsx "src/app/(app)/cv/page.tsx"
git commit -m "feat: CV page — 3-column layout with profile, preview, generated CVs list"
```

---

## Task 8: Full test suite + build check

- [ ] **Step 1: Run all tests**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest --no-coverage 2>&1 | tail -30
```
Expected: All Plan 1 tests still pass + all Plan 2 tests pass. No regressions in new test files.

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```
Expected: Successful build. No TypeScript errors in new files.

- [ ] **Step 3: Commit (if uncommitted changes exist)**

```bash
git status
# If there are uncommitted changes:
git add -A
git commit -m "feat: Plan 2 complete — CV page with generation and PDF download"
```

---

## Self-Review

**Spec coverage check (against `docs/superpowers/specs/2026-04-16-app-revamp-design.md` Section 3.5):**
- ✅ 3-column layout: profile left 260px, CV preview center, generated CVs right 240px — Tasks 6–7
- ✅ Profile card: avatar initials, name, role, location, completeness bar — Task 6 (ProfileColumn)
- ✅ Skill bars: top 5 skills with level 1–10, color-coded — Task 6 (ProfileColumn)
- ✅ Agent suggestions: 3 specific improvements — Task 6 (ProfileColumn, demo data)
- ✅ Tailored banner: company, role, keywords injected, ATS score — Task 6 (CVPreview)
- ✅ CV preview (iframe): shows master or tailored HTML — Task 6 (CVPreview)
- ✅ Generate form: job title, company, job description inputs — Task 6 (CVPreview)
- ✅ Generated CVs list: company, role, date, ATS score, keyword count, download — Task 6 (GeneratedCVList)
- ✅ Download PDF button: calls /api/cv/pdf, downloads blob — Task 7 (CVPageClient.handleDownload)
- ✅ pdf.md loaded at runtime via readFileSync — Task 3 (cv-generator)
- ✅ claude-sonnet-4-6 model used — Task 3
- ✅ Playwright PDF generation — Task 4

**Not in this plan (by design — later plans):**
- Real parsed CV from user onboarding (uses demo CV for now)
- Applications, Dashboard, Interview pages — Plans 3–4
- Background job scanner — Plan 5
