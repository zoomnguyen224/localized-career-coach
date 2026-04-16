# Plan 1: Foundation + Jobs Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the app shell (sidebar nav + route structure) and the Jobs page with real ATS job scanning + agent-powered job evaluation — the highest-value demo feature.

**Architecture:** Add a `(app)` Next.js route group that wraps all new pages in a shared sidebar layout. Keep the existing `/` chat page untouched. Career-agent-cli `modes/*.md` files are copied into `src/prompts/` and loaded as system prompts at runtime — no logic is rewritten, only wired to the web API. Job data is a mix of real Greenhouse/Lever/Ashby API calls + mock MENA fallback data for demo reliability.

**Tech Stack:** Next.js 16 App Router, React 19, LangChain + `@langchain/anthropic`, Tailwind CSS v4, Figtree font, career-agent-cli prompt files, Greenhouse/Lever/Ashby public APIs

---

## File Map

**New files — prompts (copied from career-agent-cli):**
- `src/prompts/oferta.md` — job evaluation A-F blocks
- `src/prompts/_shared.md` — scoring system, archetypes, 1-5 scale rules
- `src/prompts/scan.md` — ATS API endpoints and scanning strategy

**New files — layout:**
- `src/app/(app)/layout.tsx` — route group layout: sidebar + main content
- `src/components/layout/AppSidebar.tsx` — new sidebar (5 nav items, user footer, chat FAB)

**New files — jobs page:**
- `src/app/(app)/jobs/page.tsx` — jobs page (server component shell)
- `src/components/jobs/JobsPageClient.tsx` — client component: filter bar + two-panel state
- `src/components/jobs/JobList.tsx` — scrollable job card list
- `src/components/jobs/JobCard.tsx` — individual job card (logo, title, score, chips)
- `src/components/jobs/JobDetail.tsx` — right detail panel (score bars, agent actions, skill match)
- `src/components/jobs/FilterBar.tsx` — filter chips (role, quality, remote, country)
- `src/components/jobs/ScoreBreakdown.tsx` — 5 bar dimensions from evaluation result

**New files — page stubs (so nav links don't 404):**
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/applications/page.tsx`
- `src/app/(app)/cv/page.tsx`
- `src/app/(app)/interview/page.tsx`

**New files — API routes:**
- `src/app/api/jobs/scan/route.ts` — fetch jobs from ATS APIs + return merged list
- `src/app/api/jobs/evaluate/route.ts` — load oferta.md + _shared.md → call Claude → return score

**New files — agent lib:**
- `src/lib/agents/job-scanner.ts` — ATS API calls (Greenhouse, Lever, Ashby) + mock fallback
- `src/lib/agents/job-evaluator.ts` — load prompt files, build Claude call, parse response

**New files — types:**
- `src/types/jobs.ts` — Job, JobScore, ScoreBreakdown, FilterState types

**New files — tests:**
- `__tests__/lib/job-scanner.test.ts`
- `__tests__/lib/job-evaluator.test.ts`
- `__tests__/app/api/jobs/scan.test.ts`
- `__tests__/app/api/jobs/evaluate.test.ts`

**Modified files:**
- `src/app/page.tsx` — add redirect: if user visits `/`, redirect to `/jobs`
- `src/app/layout.tsx` — no change needed (Figtree already loaded)

---

## Task 1: Copy career-agent-cli prompt files

**Files:**
- Create: `src/prompts/oferta.md`
- Create: `src/prompts/_shared.md`
- Create: `src/prompts/scan.md`

- [ ] **Step 1: Create prompts directory and copy files**

```bash
mkdir -p "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach/src/prompts"

cp "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/career-agent-cli/modes/oferta.md" \
   "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach/src/prompts/oferta.md"

cp "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/career-agent-cli/modes/_shared.md" \
   "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach/src/prompts/_shared.md"

cp "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/career-agent-cli/modes/scan.md" \
   "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach/src/prompts/scan.md"
```

- [ ] **Step 2: Verify files exist**

```bash
ls src/prompts/
```
Expected output: `_shared.md  oferta.md  scan.md`

- [ ] **Step 3: Commit**

```bash
git add src/prompts/
git commit -m "chore: copy career-agent-cli prompt files into src/prompts"
```

---

## Task 2: Define job types

**Files:**
- Create: `src/types/jobs.ts`

- [ ] **Step 1: Write the types**

```typescript
// src/types/jobs.ts

export type ATSSource = 'greenhouse' | 'lever' | 'ashby' | 'mock'
export type RemoteType = 'remote' | 'hybrid' | 'onsite'
export type RoleCategory = 'ai-ml' | 'product' | 'data' | 'engineering' | 'other'

export interface Job {
  id: string
  externalId: string
  atsSource: ATSSource
  company: string
  companySlug: string
  title: string
  location: string
  country: 'UAE' | 'KSA' | 'Qatar' | 'Kuwait' | 'Bahrain' | 'Oman' | 'Other'
  url: string
  description?: string
  salaryRange?: string
  remoteType: RemoteType
  roleCategory: RoleCategory
  postedAt?: string
  isVision2030?: boolean
  matchScore?: number
  scoreBreakdown?: ScoreBreakdown
  skillsMatch?: SkillMatch[]
  isNew?: boolean
}

export interface ScoreBreakdown {
  overall: number        // 1.0–5.0
  cvMatch: number        // 1.0–5.0
  roleAlignment: number  // 1.0–5.0
  compensation: number   // 1.0–5.0
  culturalSignals: number // 1.0–5.0
  redFlags: string | null
  recommendation: string
  archetype: string
}

export interface SkillMatch {
  skill: string
  status: 'strong' | 'partial' | 'gap'
  note: string
}

export interface FilterState {
  category: RoleCategory | 'all'
  minScore: number | null   // null = no filter, 4.0 = "strong match"
  remoteOnly: boolean
  countries: Array<'UAE' | 'KSA' | 'Qatar' | 'Kuwait' | 'Bahrain' | 'Oman'>
}
```

- [ ] **Step 2: Export from main types index**

Open `src/types/index.ts`. Add at the bottom:

```typescript
export * from './jobs'
```

- [ ] **Step 3: Commit**

```bash
git add src/types/jobs.ts src/types/index.ts
git commit -m "feat: add Job types for jobs page"
```

---

## Task 3: Build job scanner (ATS APIs + mock fallback)

**Files:**
- Create: `src/lib/agents/job-scanner.ts`
- Create: `__tests__/lib/job-scanner.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/job-scanner.test.ts
import { fetchGreenhouseJobs, fetchLeverJobs, buildMockJobs } from '@/lib/agents/job-scanner'

describe('fetchGreenhouseJobs', () => {
  it('returns empty array on network error without throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    const result = await fetchGreenhouseJobs('stc', 'STC', 'KSA')
    expect(result).toEqual([])
  })

  it('parses greenhouse job list into Job array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          { id: 123, title: 'AI Engineer', absolute_url: 'https://boards.greenhouse.io/stc/jobs/123', location: { name: 'Riyadh' } }
        ]
      })
    })
    const result = await fetchGreenhouseJobs('stc', 'STC', 'KSA')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('AI Engineer')
    expect(result[0].atsSource).toBe('greenhouse')
    expect(result[0].company).toBe('STC')
  })
})

describe('fetchLeverJobs', () => {
  it('returns empty array on network error without throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    const result = await fetchLeverJobs('talabat', 'Talabat', 'UAE')
    expect(result).toEqual([])
  })

  it('parses lever posting array into Job array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 'abc123', text: 'LLM Engineer', hostedUrl: 'https://jobs.lever.co/talabat/abc123', categories: { location: 'Dubai' } }
      ])
    })
    const result = await fetchLeverJobs('talabat', 'Talabat', 'UAE')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('LLM Engineer')
    expect(result[0].atsSource).toBe('lever')
  })
})

describe('buildMockJobs', () => {
  it('returns array of jobs with required fields', () => {
    const jobs = buildMockJobs()
    expect(jobs.length).toBeGreaterThan(0)
    jobs.forEach(job => {
      expect(job.id).toBeDefined()
      expect(job.company).toBeDefined()
      expect(job.title).toBeDefined()
      expect(job.atsSource).toBe('mock')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/lib/job-scanner.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/agents/job-scanner'`

- [ ] **Step 3: Implement job-scanner.ts**

```typescript
// src/lib/agents/job-scanner.ts
import { Job, ATSSource, RoleCategory } from '@/types/jobs'
import { v4 as uuidv4 } from 'uuid'

// Install uuid if not present: npm install uuid @types/uuid

function classifyRole(title: string): RoleCategory {
  const t = title.toLowerCase()
  if (t.match(/ai|ml|machine learning|llm|nlp|rag|generative/)) return 'ai-ml'
  if (t.match(/product manager|product owner|pm\b/)) return 'product'
  if (t.match(/data scientist|data engineer|data analyst|analytics/)) return 'data'
  if (t.match(/software|engineer|developer|backend|frontend|fullstack/)) return 'engineering'
  return 'other'
}

function inferRemoteType(location: string): Job['remoteType'] {
  const l = location.toLowerCase()
  if (l.includes('remote')) return 'remote'
  if (l.includes('hybrid')) return 'hybrid'
  return 'onsite'
}

export async function fetchGreenhouseJobs(
  companySlug: string,
  companyName: string,
  country: Job['country']
): Promise<Job[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs`,
      { next: { revalidate: 21600 } } // 6h cache
    )
    if (!res.ok) return []
    const data = await res.json()
    const jobs: Array<{ id: number; title: string; absolute_url: string; location?: { name?: string } }> = data.jobs ?? []
    return jobs.map(j => ({
      id: uuidv4(),
      externalId: String(j.id),
      atsSource: 'greenhouse' as ATSSource,
      company: companyName,
      companySlug,
      title: j.title,
      location: j.location?.name ?? country,
      country,
      url: j.absolute_url,
      remoteType: inferRemoteType(j.location?.name ?? ''),
      roleCategory: classifyRole(j.title),
    }))
  } catch {
    return []
  }
}

export async function fetchLeverJobs(
  companySlug: string,
  companyName: string,
  country: Job['country']
): Promise<Job[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${companySlug}?mode=json`,
      { next: { revalidate: 21600 } }
    )
    if (!res.ok) return []
    const jobs: Array<{ id: string; text: string; hostedUrl?: string; applyUrl?: string; categories?: { location?: string } }> = await res.json()
    return jobs.map(j => ({
      id: uuidv4(),
      externalId: j.id,
      atsSource: 'lever' as ATSSource,
      company: companyName,
      companySlug,
      title: j.text,
      location: j.categories?.location ?? country,
      country,
      url: j.hostedUrl ?? j.applyUrl ?? '',
      remoteType: inferRemoteType(j.categories?.location ?? ''),
      roleCategory: classifyRole(j.text),
    }))
  } catch {
    return []
  }
}

export function buildMockJobs(): Job[] {
  return [
    {
      id: 'mock-1', externalId: 'mock-1', atsSource: 'mock',
      company: 'STC', companySlug: 'stc', title: 'Senior AI Engineer',
      location: 'Riyadh · Hybrid', country: 'KSA', url: 'https://stc.com.sa/careers',
      remoteType: 'hybrid', roleCategory: 'ai-ml', salaryRange: 'SAR 28,000–35,000/mo',
      isVision2030: true, postedAt: new Date(Date.now() - 3 * 86400000).toISOString(), isNew: true,
    },
    {
      id: 'mock-2', externalId: 'mock-2', atsSource: 'mock',
      company: 'Talabat', companySlug: 'talabat', title: 'LLM Platform Engineer',
      location: 'Dubai · Remote', country: 'UAE', url: 'https://talabat.com/careers',
      remoteType: 'remote', roleCategory: 'ai-ml', salaryRange: 'AED 25,000–32,000/mo',
      postedAt: new Date(Date.now() - 1 * 86400000).toISOString(), isNew: true,
    },
    {
      id: 'mock-3', externalId: 'mock-3', atsSource: 'mock',
      company: 'Careem', companySlug: 'careem', title: 'AI Product Manager',
      location: 'Dubai · Hybrid', country: 'UAE', url: 'https://careem.com/careers',
      remoteType: 'hybrid', roleCategory: 'product', salaryRange: 'AED 22,000–28,000/mo',
      postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'mock-4', externalId: 'mock-4', atsSource: 'mock',
      company: 'NEOM', companySlug: 'neom', title: 'ML Engineer',
      location: 'Tabuk · Onsite', country: 'KSA', url: 'https://neom.com/careers',
      remoteType: 'onsite', roleCategory: 'ai-ml', salaryRange: 'SAR 32,000–40,000/mo',
      isVision2030: true, postedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'mock-5', externalId: 'mock-5', atsSource: 'mock',
      company: 'Geidea', companySlug: 'geidea', title: 'GenAI Engineer',
      location: 'Riyadh · Hybrid', country: 'KSA', url: 'https://geidea.net/careers',
      remoteType: 'hybrid', roleCategory: 'ai-ml', salaryRange: 'SAR 25,000–30,000/mo',
      postedAt: new Date(Date.now() - 2 * 86400000).toISOString(), isNew: true,
    },
    {
      id: 'mock-6', externalId: 'mock-6', atsSource: 'mock',
      company: 'Emirates NBD', companySlug: 'emiratesnbd', title: 'Data Science Lead',
      location: 'Dubai · Hybrid', country: 'UAE', url: 'https://emiratesnbd.com/careers',
      remoteType: 'hybrid', roleCategory: 'data', salaryRange: 'AED 28,000–35,000/mo',
      postedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ]
}

// MENA companies on Greenhouse/Lever — real ATS slugs
const MENA_ATS_COMPANIES: Array<{
  slug: string; name: string; ats: 'greenhouse' | 'lever'; country: Job['country']
}> = [
  { slug: 'careem', name: 'Careem', ats: 'lever', country: 'UAE' },
  { slug: 'fetchrewards', name: 'Fetch', ats: 'greenhouse', country: 'UAE' },
]

export async function scanAllMENAPortals(): Promise<Job[]> {
  const promises = MENA_ATS_COMPANIES.map(c =>
    c.ats === 'greenhouse'
      ? fetchGreenhouseJobs(c.slug, c.name, c.country)
      : fetchLeverJobs(c.slug, c.name, c.country)
  )
  const results = await Promise.allSettled(promises)
  const liveJobs = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  // Always include mock MENA jobs for demo reliability
  const mockJobs = buildMockJobs()

  // Merge: real jobs first, mock jobs deduplicated by company+title
  const seen = new Set(liveJobs.map(j => `${j.company}::${j.title}`))
  const dedupedMock = mockJobs.filter(j => !seen.has(`${j.company}::${j.title}`))

  return [...liveJobs, ...dedupedMock]
}
```

- [ ] **Step 4: Install uuid**

```bash
npm install uuid @types/uuid
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/lib/job-scanner.test.ts --no-coverage
```
Expected: PASS (3 test suites, all green)

- [ ] **Step 6: Commit**

```bash
git add src/lib/agents/job-scanner.ts __tests__/lib/job-scanner.test.ts
git commit -m "feat: job scanner — Greenhouse/Lever ATS APIs + mock MENA fallback"
```

---

## Task 4: Build job evaluator agent (loads oferta.md → Claude)

**Files:**
- Create: `src/lib/agents/job-evaluator.ts`
- Create: `__tests__/lib/job-evaluator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/job-evaluator.test.ts
import { buildEvaluationPrompt, parseEvaluationResponse } from '@/lib/agents/job-evaluator'

describe('buildEvaluationPrompt', () => {
  it('includes CV content in the prompt', () => {
    const prompt = buildEvaluationPrompt({
      jobTitle: 'AI Engineer',
      jobDescription: 'Build LLM pipelines...',
      company: 'STC',
      cvMarkdown: '# Ahmed Nasser\nSenior AI Engineer with LLM experience',
    })
    expect(prompt).toContain('Ahmed Nasser')
    expect(prompt).toContain('STC')
    expect(prompt).toContain('LLM pipelines')
  })

  it('includes MENA market context', () => {
    const prompt = buildEvaluationPrompt({
      jobTitle: 'AI Engineer',
      jobDescription: 'Build LLM pipelines...',
      company: 'STC',
      cvMarkdown: '# Test CV',
    })
    expect(prompt).toContain('MENA')
  })
})

describe('parseEvaluationResponse', () => {
  it('parses a well-formed JSON block from Claude response', () => {
    const response = `
Some analysis text here.

\`\`\`json
{
  "overall": 4.5,
  "cvMatch": 4.8,
  "roleAlignment": 4.6,
  "compensation": 4.2,
  "culturalSignals": 4.0,
  "redFlags": null,
  "recommendation": "Strong match — recommend applying immediately",
  "archetype": "LLMOps",
  "skillsMatch": [
    { "skill": "LLM / RAG", "status": "strong", "note": "3 projects in CV" },
    { "skill": "MLOps", "status": "partial", "note": "Adjacent experience" }
  ]
}
\`\`\`
`
    const result = parseEvaluationResponse(response)
    expect(result.overall).toBe(4.5)
    expect(result.cvMatch).toBe(4.8)
    expect(result.redFlags).toBeNull()
    expect(result.skillsMatch).toHaveLength(2)
    expect(result.skillsMatch[0].status).toBe('strong')
  })

  it('returns fallback score on unparseable response', () => {
    const result = parseEvaluationResponse('This is not valid JSON at all')
    expect(result.overall).toBe(3.0)
    expect(result.recommendation).toContain('manually review')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/job-evaluator.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/agents/job-evaluator'`

- [ ] **Step 3: Implement job-evaluator.ts**

```typescript
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
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/lib/job-evaluator.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/job-evaluator.ts __tests__/lib/job-evaluator.test.ts
git commit -m "feat: job evaluator agent — loads oferta.md/_shared.md, parses Claude response"
```

---

## Task 5: API routes for scan + evaluate

**Files:**
- Create: `src/app/api/jobs/scan/route.ts`
- Create: `src/app/api/jobs/evaluate/route.ts`
- Create: `__tests__/app/api/jobs/scan.test.ts`
- Create: `__tests__/app/api/jobs/evaluate.test.ts`

- [ ] **Step 1: Write scan route test**

```typescript
// __tests__/app/api/jobs/scan.test.ts
import { GET } from '@/app/api/jobs/scan/route'

jest.mock('@/lib/agents/job-scanner', () => ({
  scanAllMENAPortals: jest.fn().mockResolvedValue([
    {
      id: 'test-1', externalId: 'test-1', atsSource: 'mock',
      company: 'STC', companySlug: 'stc', title: 'AI Engineer',
      location: 'Riyadh', country: 'KSA', url: 'https://stc.com',
      remoteType: 'hybrid', roleCategory: 'ai-ml',
    }
  ])
}))

describe('GET /api/jobs/scan', () => {
  it('returns jobs array with 200 status', async () => {
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.jobs)).toBe(true)
    expect(data.jobs).toHaveLength(1)
    expect(data.jobs[0].company).toBe('STC')
  })
})
```

- [ ] **Step 2: Write evaluate route test**

```typescript
// __tests__/app/api/jobs/evaluate.test.ts
import { POST } from '@/app/api/jobs/evaluate/route'

jest.mock('@/lib/agents/job-evaluator', () => ({
  evaluateJob: jest.fn().mockResolvedValue({
    overall: 4.5, cvMatch: 4.8, roleAlignment: 4.6,
    compensation: 4.2, culturalSignals: 4.0,
    redFlags: null, recommendation: 'Strong match', archetype: 'LLMOps',
    skillsMatch: []
  })
}))

describe('POST /api/jobs/evaluate', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/jobs/evaluate', {
      method: 'POST',
      body: JSON.stringify({ jobTitle: 'AI Engineer' }), // missing jobDescription, company, cvMarkdown
      headers: { 'Content-Type': 'application/json' }
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns evaluation result with 200 status', async () => {
    const req = new Request('http://localhost/api/jobs/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle: 'AI Engineer',
        jobDescription: 'Build LLM systems...',
        company: 'STC',
        cvMarkdown: '# Ahmed Nasser\nAI Engineer',
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    const response = await POST(req)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.overall).toBe(4.5)
    expect(data.recommendation).toBe('Strong match')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx jest __tests__/app/api/jobs/ --no-coverage
```
Expected: FAIL — routes don't exist yet

- [ ] **Step 4: Implement scan route**

```typescript
// src/app/api/jobs/scan/route.ts
import { NextResponse } from 'next/server'
import { scanAllMENAPortals } from '@/lib/agents/job-scanner'

export async function GET() {
  try {
    const jobs = await scanAllMENAPortals()
    return NextResponse.json({ jobs }, { status: 200 })
  } catch (error) {
    console.error('Job scan failed:', error)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Implement evaluate route**

```typescript
// src/app/api/jobs/evaluate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { evaluateJob } from '@/lib/agents/job-evaluator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobTitle, jobDescription, company, cvMarkdown } = body

    if (!jobTitle || !jobDescription || !company || !cvMarkdown) {
      return NextResponse.json(
        { error: 'Missing required fields: jobTitle, jobDescription, company, cvMarkdown' },
        { status: 400 }
      )
    }

    const result = await evaluateJob({ jobTitle, jobDescription, company, cvMarkdown })
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Job evaluation failed:', error)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Run tests**

```bash
npx jest __tests__/app/api/jobs/ --no-coverage
```
Expected: PASS (2 suites, all green)

- [ ] **Step 7: Commit**

```bash
git add src/app/api/jobs/ __tests__/app/api/jobs/
git commit -m "feat: /api/jobs/scan and /api/jobs/evaluate routes"
```

---

## Task 6: App shell — route group layout + sidebar

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/layout/AppSidebar.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/applications/page.tsx`
- Create: `src/app/(app)/cv/page.tsx`
- Create: `src/app/(app)/interview/page.tsx`

- [ ] **Step 1: Create the app sidebar component**

```typescript
// src/components/layout/AppSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, ClipboardList, FileText, Target, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs', badge: '12' },
  { href: '/applications', icon: ClipboardList, label: 'Applications' },
  { href: '/cv', icon: FileText, label: 'My CV' },
  { href: '/interview', icon: Target, label: 'Interview Prep' },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[228px] bg-white border-r border-[#DCDFE8] flex flex-col flex-shrink-0 h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#DCDFE8] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-sm">
          🌍
        </div>
        <span className="text-base font-extrabold text-[#06123C]">
          Local<span className="text-[#4584FF]">ized</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#ECF3FF] text-[#4584FF]'
                  : 'text-[#727998] hover:bg-[#F2F3F6] hover:text-[#06123C]'
              }`}
            >
              <item.icon size={17} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-[#4584FF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        <div className="h-px bg-[#DCDFE8] my-2" />

        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-semibold text-[#727998] hover:bg-[#F2F3F6] hover:text-[#06123C] transition-colors"
        >
          <Settings size={17} />
          Settings
        </Link>
      </nav>

      {/* User footer */}
      <div className="px-5 py-4 border-t border-[#DCDFE8] flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          AN
        </div>
        <div>
          <div className="text-[13px] font-bold text-[#06123C]">Ahmed N.</div>
          <div className="text-[11px] text-[#727998]">AI Engineer · Dubai</div>
        </div>
      </div>

      {/* Chat FAB */}
      <button
        className="absolute bottom-7 right-7 w-[50px] h-[50px] rounded-full bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-xl shadow-lg shadow-blue-400/30 z-50"
        title="Ask your career agent"
      >
        💬
      </button>
    </aside>
  )
}
```

- [ ] **Step 2: Create the app route group layout**

```typescript
// src/app/(app)/layout.tsx
import { AppSidebar } from '@/components/layout/AppSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] relative">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Create page stubs so nav links resolve**

```typescript
// src/app/(app)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-[#06123C]">Dashboard</h1>
      <p className="text-[#727998] mt-1">Coming in Plan 3</p>
    </div>
  )
}
```

```typescript
// src/app/(app)/applications/page.tsx
export default function ApplicationsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-[#06123C]">Applications</h1>
      <p className="text-[#727998] mt-1">Coming in Plan 3</p>
    </div>
  )
}
```

```typescript
// src/app/(app)/cv/page.tsx
export default function CVPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-[#06123C]">My CV</h1>
      <p className="text-[#727998] mt-1">Coming in Plan 2</p>
    </div>
  )
}
```

```typescript
// src/app/(app)/interview/page.tsx
export default function InterviewPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-[#06123C]">Interview Prep</h1>
      <p className="text-[#727998] mt-1">Coming in Plan 4</p>
    </div>
  )
}
```

- [ ] **Step 4: Update root page.tsx to redirect to /jobs**

Open `src/app/page.tsx`. Replace the entire file content with:

```typescript
// src/app/page.tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/jobs')
}
```

- [ ] **Step 5: Start dev server and verify navigation**

```bash
npm run dev
```

Open `http://localhost:3000` — should redirect to `/jobs` (stub for now). Click all 5 nav items — none should 404.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/ src/components/layout/AppSidebar.tsx src/app/page.tsx
git commit -m "feat: app shell — route group layout, sidebar nav, page stubs"
```

---

## Task 7: Jobs page UI — FilterBar + JobList + JobCard

**Files:**
- Create: `src/components/jobs/FilterBar.tsx`
- Create: `src/components/jobs/JobCard.tsx`
- Create: `src/components/jobs/JobList.tsx`

- [ ] **Step 1: Build FilterBar**

```typescript
// src/components/jobs/FilterBar.tsx
'use client'

import { FilterState, RoleCategory } from '@/types/jobs'

interface FilterBarProps {
  filters: FilterState
  totalCount: number
  onChange: (filters: FilterState) => void
}

const CATEGORIES: Array<{ value: FilterState['category']; label: string }> = [
  { value: 'all', label: 'All roles' },
  { value: 'ai-ml', label: 'AI / ML' },
  { value: 'product', label: 'Product' },
  { value: 'data', label: 'Data' },
  { value: 'engineering', label: 'Engineering' },
]

const COUNTRIES: Array<FilterState['countries'][number]> = ['UAE', 'KSA', 'Qatar']

export function FilterBar({ filters, totalCount, onChange }: FilterBarProps) {
  const chip = (active: boolean, onClick: () => void, label: string, variant: 'blue' | 'green' = 'blue') =>
    `flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
      active
        ? variant === 'green'
          ? 'bg-[#E6FAF4] border-[#03BA82] text-[#009C6C]'
          : 'bg-[#ECF3FF] border-[#4584FF] text-[#4584FF]'
        : 'bg-white border-[#DCDFE8] text-[#727998] hover:border-[#4584FF] hover:text-[#4584FF]'
    }`

  return (
    <div className="flex items-center gap-2.5 px-7 py-4 border-b border-[#DCDFE8] flex-wrap">
      {CATEGORIES.map(cat => (
        <button
          key={cat.value}
          className={chip(filters.category === cat.value, () => {}, cat.label)}
          onClick={() => onChange({ ...filters, category: cat.value })}
        >
          {cat.label}
        </button>
      ))}

      <div className="w-px h-5 bg-[#DCDFE8] flex-shrink-0" />

      <button
        className={chip(filters.minScore === 4.0, () => {}, 'Strong match (4.0+)', 'green')}
        onClick={() => onChange({ ...filters, minScore: filters.minScore === 4.0 ? null : 4.0 })}
      >
        Strong match (4.0+)
      </button>

      <button
        className={chip(filters.remoteOnly, () => {}, 'Remote only')}
        onClick={() => onChange({ ...filters, remoteOnly: !filters.remoteOnly })}
      >
        Remote only
      </button>

      {COUNTRIES.map(c => (
        <button
          key={c}
          className={chip(filters.countries.includes(c), () => {}, c)}
          onClick={() => {
            const next = filters.countries.includes(c)
              ? filters.countries.filter(x => x !== c)
              : [...filters.countries, c]
            onChange({ ...filters, countries: next })
          }}
        >
          {c}
        </button>
      ))}

      <span className="ml-auto text-xs text-[#727998] flex-shrink-0">
        {totalCount} jobs · sorted by match
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Build JobCard**

```typescript
// src/components/jobs/JobCard.tsx
import { Job } from '@/types/jobs'

interface JobCardProps {
  job: Job
  isSelected: boolean
  onClick: () => void
}

const LOGO_COLORS: Record<string, string> = {
  STC: 'bg-[#ECF3FF] text-[#4584FF]',
  Talabat: 'bg-[#E6FAF4] text-[#009C6C]',
  Careem: 'bg-[#FFF4E6] text-[#FAA82C]',
  NEOM: 'bg-[#F2F3F6] text-[#727998]',
  Geidea: 'bg-[#ECF3FF] text-[#4584FF]',
  'Emirates NBD': 'bg-[#F0F4FF] text-[#4584FF]',
}

function scoreColor(score?: number): string {
  if (!score) return 'text-[#8D96B4]'
  if (score >= 4.0) return 'text-[#03BA82]'
  if (score >= 3.5) return 'text-[#FAA82C]'
  return 'text-[#F84E4E]'
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const logoColor = LOGO_COLORS[job.company] ?? 'bg-[#F2F3F6] text-[#727998]'
  const initial = job.company[0].toUpperCase()

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-[10px] p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-[#4584FF] bg-[#F8FBFF] shadow-[0_2px_20px_rgba(69,132,255,0.15)]'
          : 'border-[#DCDFE8] hover:border-[#4584FF] hover:shadow-[0_2px_16px_rgba(69,132,255,0.1)]'
      }`}
    >
      <div className="flex items-start gap-2.5 mb-2.5">
        {job.isNew && (
          <div className="w-2 h-2 rounded-full bg-[#4584FF] flex-shrink-0 mt-1" />
        )}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-extrabold flex-shrink-0 ${logoColor}`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-[#06123C] truncate">{job.title}</div>
          <div className="text-[11px] text-[#727998] mt-0.5">{job.company} · {job.location}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-[13px] font-extrabold ${scoreColor(job.matchScore)}`}>
            {job.matchScore?.toFixed(1) ?? '—'}
          </div>
          <div className="text-[10px] text-[#8D96B4]">match</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.isNew && (
          <span className="bg-[#ECF3FF] text-[#4584FF] text-[10px] font-semibold px-2 py-0.5 rounded-full">New</span>
        )}
        {job.isVision2030 && (
          <span className="bg-[#E6FAF4] text-[#009C6C] text-[10px] font-semibold px-2 py-0.5 rounded-full">Vision 2030</span>
        )}
        <span className="bg-[#F2F3F6] text-[#727998] text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
          {job.remoteType}
        </span>
        <span className="bg-[#F2F3F6] text-[#727998] text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {job.roleCategory.toUpperCase().replace('-', ' / ')}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build JobList**

```typescript
// src/components/jobs/JobList.tsx
import { Job } from '@/types/jobs'
import { JobCard } from './JobCard'

interface JobListProps {
  jobs: Job[]
  selectedJobId: string | null
  onSelect: (job: Job) => void
}

export function JobList({ jobs, selectedJobId, onSelect }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#8D96B4] text-sm font-semibold">
        No jobs match your filters
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          isSelected={job.id === selectedJobId}
          onClick={() => onSelect(job)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/jobs/FilterBar.tsx src/components/jobs/JobCard.tsx src/components/jobs/JobList.tsx
git commit -m "feat: jobs page components — FilterBar, JobCard, JobList"
```

---

## Task 8: Jobs page UI — ScoreBreakdown + JobDetail

**Files:**
- Create: `src/components/jobs/ScoreBreakdown.tsx`
- Create: `src/components/jobs/JobDetail.tsx`

- [ ] **Step 1: Build ScoreBreakdown**

```typescript
// src/components/jobs/ScoreBreakdown.tsx
import { ScoreBreakdown as ScoreBreakdownType, SkillMatch } from '@/types/jobs'

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType & { skillsMatch: SkillMatch[] }
}

const BARS: Array<{ key: keyof ScoreBreakdownType; label: string }> = [
  { key: 'cvMatch', label: 'CV match' },
  { key: 'roleAlignment', label: 'Role alignment' },
  { key: 'compensation', label: 'Compensation' },
  { key: 'culturalSignals', label: 'Culture signals' },
]

function barColor(val: number): string {
  if (val >= 4.0) return 'bg-[#03BA82]'
  if (val >= 3.0) return 'bg-[#FAA82C]'
  return 'bg-[#F84E4E]'
}

function scoreColor(val: number): string {
  if (val >= 4.0) return 'text-[#03BA82]'
  if (val >= 3.0) return 'text-[#FAA82C]'
  return 'text-[#F84E4E]'
}

function dotColor(status: SkillMatch['status']): string {
  if (status === 'strong') return 'bg-[#03BA82]'
  if (status === 'partial') return 'bg-[#FAA82C]'
  return 'bg-[#F84E4E]'
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Overall */}
      <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_40px_rgba(151,155,192,0.1)]">
        <div className="text-[11px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">
          Agent Match Analysis
        </div>
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#F2F3F6]">
          <div className={`text-4xl font-extrabold ${scoreColor(breakdown.overall)}`}>
            {breakdown.overall.toFixed(1)}
          </div>
          <div>
            <div className="text-[11px] text-[#727998]">Overall match score</div>
            <div className="text-[13px] font-semibold text-[#06123C] mt-0.5">{breakdown.recommendation}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {BARS.map(({ key, label }) => {
            const val = breakdown[key] as number
            return (
              <div key={key} className="flex items-center gap-2.5">
                <div className="text-[12px] font-semibold text-[#06123C] w-[110px] flex-shrink-0">{label}</div>
                <div className="flex-1 h-1.5 bg-[#F2F3F6] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(val)}`} style={{ width: `${(val / 5) * 100}%` }} />
                </div>
                <div className={`text-[12px] font-bold w-7 text-right flex-shrink-0 ${scoreColor(val)}`}>
                  {val.toFixed(1)}
                </div>
              </div>
            )
          })}
          {breakdown.redFlags && (
            <div className="mt-1 text-[12px] text-[#F84E4E] font-semibold">
              ⚠️ {breakdown.redFlags}
            </div>
          )}
        </div>
      </div>

      {/* Skills match */}
      {breakdown.skillsMatch.length > 0 && (
        <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_40px_rgba(151,155,192,0.1)]">
          <div className="text-[11px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">
            Skills Match
          </div>
          <div className="flex flex-col gap-2">
            {breakdown.skillsMatch.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(s.status)}`} />
                <div className="text-[12px] font-semibold text-[#06123C] flex-1">{s.skill}</div>
                <div className="text-[11px] text-[#727998]">{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build JobDetail**

```typescript
// src/components/jobs/JobDetail.tsx
'use client'

import { useState } from 'react'
import { Job, ScoreBreakdown as ScoreBreakdownType, SkillMatch } from '@/types/jobs'
import { ScoreBreakdown } from './ScoreBreakdown'

interface JobDetailProps {
  job: Job
  cvMarkdown: string
}

const LOGO_COLORS: Record<string, string> = {
  STC: 'bg-[#ECF3FF] text-[#4584FF]',
  Talabat: 'bg-[#E6FAF4] text-[#009C6C]',
  Careem: 'bg-[#FFF4E6] text-[#FAA82C]',
  NEOM: 'bg-[#F2F3F6] text-[#727998]',
  Geidea: 'bg-[#ECF3FF] text-[#4584FF]',
  'Emirates NBD': 'bg-[#F0F4FF] text-[#4584FF]',
}

type EvalState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: ScoreBreakdownType & { skillsMatch: SkillMatch[] } }
  | { status: 'error'; message: string }

export function JobDetail({ job, cvMarkdown }: JobDetailProps) {
  const [evalState, setEvalState] = useState<EvalState>({ status: 'idle' })
  const logoColor = LOGO_COLORS[job.company] ?? 'bg-[#F2F3F6] text-[#727998]'

  async function handleEvaluate() {
    setEvalState({ status: 'loading' })
    try {
      const res = await fetch('/api/jobs/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          jobDescription: job.description ?? `${job.title} at ${job.company} in ${job.location}`,
          company: job.company,
          cvMarkdown,
        }),
      })
      if (!res.ok) throw new Error('Evaluation failed')
      const result = await res.json()
      setEvalState({ status: 'done', result })
    } catch (e) {
      setEvalState({ status: 'error', message: 'Evaluation failed — please try again.' })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 pb-5 border-b border-[#DCDFE8]">
        <div className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center text-[22px] font-extrabold flex-shrink-0 ${logoColor}`}>
          {job.company[0]}
        </div>
        <div className="flex-1">
          <div className="text-xl font-extrabold text-[#06123C] tracking-tight">{job.title}</div>
          <div className="text-[14px] text-[#727998] mt-1">{job.company} · {job.location}</div>
          <div className="flex gap-2 flex-wrap mt-2.5">
            <span className="bg-[#F2F3F6] text-[#727998] text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize">
              {job.remoteType}
            </span>
            {job.salaryRange && (
              <span className="bg-[#F2F3F6] text-[#727998] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {job.salaryRange}
              </span>
            )}
            {job.isVision2030 && (
              <span className="bg-[#ECF3FF] text-[#4584FF] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                Vision 2030 role
              </span>
            )}
            <span className="bg-[#F2F3F6] text-[#727998] text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase">
              {job.atsSource}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#4584FF] text-white text-[13px] font-bold px-5 py-2.5 rounded-[14px] text-center"
          >
            Apply now
          </a>
          <button className="bg-white border border-[#DCDFE8] text-[#06123C] text-[12px] font-semibold px-4 py-2 rounded-[14px]">
            Save
          </button>
        </div>
      </div>

      {/* Evaluate CTA or result */}
      {evalState.status === 'idle' && (
        <div className="bg-[#ECF3FF] border border-[#DCE8FF] rounded-[10px] p-5 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold text-[#06123C]">Agent evaluation ready</div>
            <div className="text-[12px] text-[#727998] mt-1">
              Score this job against your CV using oferta.md scoring framework
            </div>
          </div>
          <button
            onClick={handleEvaluate}
            className="bg-[#4584FF] text-white text-[13px] font-bold px-5 py-2.5 rounded-[14px] flex-shrink-0 ml-4"
          >
            Evaluate with agent
          </button>
        </div>
      )}

      {evalState.status === 'loading' && (
        <div className="bg-[#ECF3FF] border border-[#DCE8FF] rounded-[10px] p-5 mb-4 text-[13px] font-semibold text-[#4584FF] flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#4584FF] animate-pulse" />
          Agent evaluating — reading your CV and job requirements…
        </div>
      )}

      {evalState.status === 'error' && (
        <div className="bg-[#FFF0F0] border border-[#F84E4E]/20 rounded-[10px] p-4 mb-4 text-[12px] text-[#F84E4E] font-semibold">
          {evalState.message}
        </div>
      )}

      {evalState.status === 'done' && (
        <ScoreBreakdown breakdown={evalState.result} />
      )}

      {/* Agent actions */}
      <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 mt-4 shadow-[0_5px_40px_rgba(151,155,192,0.1)]">
        <div className="text-[11px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">
          Agent Actions
        </div>
        {[
          { icon: '📄', label: 'Generate tailored CV', sub: 'Keyword-optimized · PDF download', active: true },
          { icon: '✉️', label: 'Draft LinkedIn outreach', sub: 'Find hiring manager · 3-sentence message', active: true },
          { icon: '🔍', label: 'Deep company research', sub: 'AI strategy, culture, recent news', active: true },
          { icon: '🎯', label: 'Interview prep', sub: 'Glassdoor intel + STAR stories', active: false },
        ].map((action, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg border mb-2 last:mb-0 transition-all ${
              action.active
                ? 'border-[#DCDFE8] cursor-pointer hover:border-[#4584FF] hover:bg-[#F8FBFF]'
                : 'border-[#DCDFE8] opacity-60'
            }`}
          >
            <div className="w-[30px] h-[30px] rounded-lg bg-[#ECF3FF] flex items-center justify-center text-sm flex-shrink-0">
              {action.icon}
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-bold text-[#06123C]">{action.label}</div>
              <div className="text-[11px] text-[#727998] mt-0.5">{action.sub}</div>
            </div>
            {action.active
              ? <span className="text-[#BFC5D6] text-sm">›</span>
              : <span className="bg-[#F2F3F6] text-[#8D96B4] text-[10px] font-semibold px-2 py-0.5 rounded-full">Coming soon</span>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/jobs/ScoreBreakdown.tsx src/components/jobs/JobDetail.tsx
git commit -m "feat: jobs page components — ScoreBreakdown, JobDetail with evaluate CTA"
```

---

## Task 9: Wire jobs page together

**Files:**
- Create: `src/components/jobs/JobsPageClient.tsx`
- Create: `src/app/(app)/jobs/page.tsx`

- [ ] **Step 1: Build JobsPageClient**

```typescript
// src/components/jobs/JobsPageClient.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Job, FilterState } from '@/types/jobs'
import { FilterBar } from './FilterBar'
import { JobList } from './JobList'
import { JobDetail } from './JobDetail'

const DEFAULT_FILTERS: FilterState = {
  category: 'all',
  minScore: null,
  remoteOnly: false,
  countries: [],
}

// Placeholder CV — in Plan 2 this comes from the real parsed CV
const DEMO_CV = `# Ahmed Nasser
Senior AI Engineer with 6+ years experience in LLM pipelines, RAG systems, and Generative AI.
Skills: Python, LangChain, RAG, LLM fine-tuning, FastAPI, Docker, AWS, Arabic NLP.
Experience: Careem (AI Platform Lead), Souq/Amazon (ML Engineer).`

interface JobsPageClientProps {
  initialJobs: Job[]
}

export function JobsPageClient({ initialJobs }: JobsPageClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selectedJob, setSelectedJob] = useState<Job | null>(initialJobs[0] ?? null)
  const [isScanning, setIsScanning] = useState(false)

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filters.category !== 'all' && job.roleCategory !== filters.category) return false
      if (filters.minScore && (job.matchScore ?? 0) < filters.minScore) return false
      if (filters.remoteOnly && job.remoteType !== 'remote') return false
      if (filters.countries.length > 0 && !filters.countries.includes(job.country as typeof filters.countries[number])) return false
      return true
    })
  }, [jobs, filters])

  async function refreshJobs() {
    setIsScanning(true)
    try {
      const res = await fetch('/api/jobs/scan')
      const data = await res.json()
      if (data.jobs) setJobs(data.jobs)
    } catch {
      // keep existing jobs
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-[#06123C]">Job Matches</h1>
          <p className="text-[12px] text-[#727998] mt-0.5">
            Agent-scanned from Greenhouse, Lever, Ashby · MENA companies
          </p>
        </div>
        <button
          onClick={refreshJobs}
          disabled={isScanning}
          className="flex items-center gap-2 bg-[#ECF3FF] border border-[#DCE8FF] text-[#4584FF] text-[12px] font-semibold px-3.5 py-1.5 rounded-full"
        >
          {isScanning ? (
            <><div className="w-1.5 h-1.5 rounded-full bg-[#03BA82] animate-pulse" /> Scanning…</>
          ) : (
            'Scan for new jobs'
          )}
        </button>
      </div>

      {/* Filter bar */}
      <FilterBar filters={filters} totalCount={filteredJobs.length} onChange={setFilters} />

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Job list */}
        <div className="w-[360px] flex-shrink-0 overflow-y-auto border-r border-[#DCDFE8] bg-[#F8F9FB]">
          <JobList jobs={filteredJobs} selectedJobId={selectedJob?.id ?? null} onSelect={setSelectedJob} />
        </div>

        {/* Job detail */}
        {selectedJob ? (
          <JobDetail job={selectedJob} cvMarkdown={DEMO_CV} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8D96B4] text-sm font-semibold">
            Select a job to see details
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build jobs page (server component)**

```typescript
// src/app/(app)/jobs/page.tsx
import { scanAllMENAPortals } from '@/lib/agents/job-scanner'
import { JobsPageClient } from '@/components/jobs/JobsPageClient'

export default async function JobsPage() {
  // Server-side initial data fetch — fast first load
  const jobs = await scanAllMENAPortals()

  return <JobsPageClient initialJobs={jobs} />
}
```

- [ ] **Step 3: Start dev server and test the full jobs page**

```bash
npm run dev
```

Open `http://localhost:3000/jobs`. Verify:
- [ ] Sidebar renders with Jobs highlighted
- [ ] Job list shows cards (mock jobs at minimum)
- [ ] Click a job card → detail panel updates
- [ ] Filter chips filter the list
- [ ] "Evaluate with agent" button calls `/api/jobs/evaluate` and streams score back
- [ ] Score bars appear after evaluation

- [ ] **Step 4: Commit**

```bash
git add src/components/jobs/JobsPageClient.tsx src/app/\(app\)/jobs/page.tsx
git commit -m "feat: jobs page — full two-panel layout with ATS scan + agent evaluation"
```

---

## Task 10: Final check + run full test suite

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```
Expected: All existing tests pass + new tests pass. No regressions.

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: No TypeScript errors, successful build.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Plan 1 complete — app shell + jobs page with ATS scanning and agent evaluation"
```

---

## Self-Review

**Spec coverage check:**
- ✅ App-first layout with sidebar nav — Task 6
- ✅ Jobs page two-panel layout — Tasks 7–9
- ✅ career-agent-cli `oferta.md` + `_shared.md` loaded as system prompts — Tasks 1, 4
- ✅ Real ATS APIs (Greenhouse, Lever) — Task 3
- ✅ Mock MENA jobs for demo reliability — Task 3
- ✅ Score breakdown bars (5 dimensions) — Task 8
- ✅ Agent actions panel with "coming soon" badges — Task 8
- ✅ Filter bar (category, match score, remote, country) — Task 7
- ✅ Page stubs for all 5 nav items — Task 6
- ✅ Root redirect to /jobs — Task 6
- ✅ `scan.md` copied to `src/prompts/` — Task 1

**Not in this plan (by design — later plans):**
- Dashboard, Applications, CV, Interview pages — Plans 2–4
- PDF generation — Plan 2
- Context-aware chat sidebar — Plan 4
- Background cron scanner — Plan 5
