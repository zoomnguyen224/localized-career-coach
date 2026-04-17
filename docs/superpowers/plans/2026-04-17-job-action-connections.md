# Job Action Connections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing Job Detail action rows so users can generate a tailored CV, track an application, and prep for an interview — all from `/jobs` without manually navigating to other pages.

**Architecture:** Context is passed via URL query params (`?jobTitle=X&company=Y`). A new `POST /api/applications` route appends to a module-level mutable store in `src/lib/applications.ts`. `CVPreview` and `InterviewPageClient` read `useSearchParams()` to pre-fill their forms when params are present.

**Tech Stack:** Next.js 14 App Router, TypeScript, React `useSearchParams`, Jest + React Testing Library.

---

## File Structure

| File | Change |
|---|---|
| `src/lib/applications.ts` | Add `liveApplications`, `appendApplication`, `isDuplicate`, `resetApplicationsForTest`, `getAllApplications` |
| `src/app/api/applications/route.ts` | **Create** — POST handler, 409 on duplicate |
| `src/components/jobs/JobDetail.tsx` | Replace emoji action rows with SVG rows; add `handleMarkApplied`; add `useRouter` |
| `src/components/cv/CVPreview.tsx` | Add `initialJobTitle?` + `initialCompany?` props; pre-fill state; auto-open form |
| `src/components/cv/CVPageClient.tsx` | Add `useSearchParams`; pass params to `CVPreview` |
| `src/app/(app)/cv/page.tsx` | Wrap `CVPageClient` in `<Suspense>` |
| `src/components/interview/InterviewPageClient.tsx` | Add `useSearchParams`; auto-select session matching `?company` param |
| `src/app/(app)/interview/page.tsx` | Wrap `InterviewPageClient` in `<Suspense>` |
| `__tests__/lib/applications-store.test.ts` | **Create** — unit tests for store functions |
| `__tests__/api/applications.test.ts` | **Create** — API route tests |

---

## Task 1: Applications store functions + API route

**Files:**
- Modify: `src/lib/applications.ts`
- Create: `src/app/api/applications/route.ts`
- Create: `__tests__/lib/applications-store.test.ts`
- Create: `__tests__/api/applications.test.ts`

- [ ] **Step 1: Write failing store tests**

Create `__tests__/lib/applications-store.test.ts`:

```typescript
import {
  appendApplication,
  isDuplicate,
  getAllApplications,
  resetApplicationsForTest,
} from '@/lib/applications'

beforeEach(() => resetApplicationsForTest())

describe('isDuplicate', () => {
  it('returns false for unknown company+role', () => {
    expect(isDuplicate('NewCo', 'Wizard')).toBe(false)
  })

  it('returns true for existing DEMO_APPLICATIONS entry (case-insensitive)', () => {
    expect(isDuplicate('neom', 'ai platform engineer')).toBe(true)
  })
})

describe('appendApplication', () => {
  it('adds entry and getAllApplications returns it', () => {
    const before = getAllApplications().length
    appendApplication({ company: 'Acme', jobTitle: 'CTO', matchScore: 4.2 })
    expect(getAllApplications()).toHaveLength(before + 1)
  })

  it('sets status to applied and appliedAt to today', () => {
    const app = appendApplication({ company: 'Acme', jobTitle: 'CTO', matchScore: 4.2 })
    expect(app.status).toBe('applied')
    expect(app.appliedAt).toBeDefined()
    expect(app.id).toBeTruthy()
  })

  it('isDuplicate returns true after append', () => {
    appendApplication({ company: 'Acme', jobTitle: 'CTO', matchScore: 4.2 })
    expect(isDuplicate('Acme', 'CTO')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/lib/applications-store.test.ts --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `appendApplication is not a function`

- [ ] **Step 3: Add store functions to `src/lib/applications.ts`**

Append after the existing `DEMO_APPLICATIONS` export (keep all existing code untouched):

```typescript
// ─── Live store (mutable, demo-only, not persisted) ───────────────

let liveApplications: Application[] = [...DEMO_APPLICATIONS]

export function getAllApplications(): Application[] {
  return liveApplications
}

export function isDuplicate(company: string, jobTitle: string): boolean {
  return liveApplications.some(
    a =>
      a.company.toLowerCase() === company.toLowerCase() &&
      a.jobTitle.toLowerCase() === jobTitle.toLowerCase()
  )
}

export function appendApplication(
  data: Pick<Application, 'company' | 'jobTitle' | 'matchScore'>
): Application {
  const app: Application = {
    id: crypto.randomUUID(),
    company: data.company,
    jobTitle: data.jobTitle,
    matchScore: data.matchScore,
    status: 'applied',
    appliedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    alertType: null,
  }
  liveApplications = [...liveApplications, app]
  return app
}

export function resetApplicationsForTest(): void {
  liveApplications = [...DEMO_APPLICATIONS]
}
```

- [ ] **Step 4: Run store tests — expect PASS**

```bash
npx jest __tests__/lib/applications-store.test.ts --no-coverage 2>&1 | tail -10
```

Expected: 5 tests passed

- [ ] **Step 5: Write failing API route tests**

Create `__tests__/api/applications.test.ts`:

```typescript
import { POST } from '@/app/api/applications/route'
import { NextRequest } from 'next/server'
import { resetApplicationsForTest } from '@/lib/applications'

beforeEach(() => resetApplicationsForTest())

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

it('returns 200 with id for a new application', async () => {
  const res = await POST(makeRequest({ company: 'Acme', jobTitle: 'CTO', matchScore: 4.2 }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(typeof body.id).toBe('string')
})

it('returns 409 when company+jobTitle already tracked', async () => {
  // NEOM + AI Platform Engineer is in DEMO_APPLICATIONS
  const res = await POST(makeRequest({ company: 'NEOM', jobTitle: 'AI Platform Engineer', matchScore: 4.7 }))
  expect(res.status).toBe(409)
})

it('returns 400 when company is missing', async () => {
  const res = await POST(makeRequest({ jobTitle: 'CTO' }))
  expect(res.status).toBe(400)
})
```

- [ ] **Step 6: Run API tests — expect FAIL**

```bash
npx jest __tests__/api/applications.test.ts --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '@/app/api/applications/route'`

- [ ] **Step 7: Create `src/app/api/applications/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { appendApplication, isDuplicate } from '@/lib/applications'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { company, jobTitle, matchScore } = body

  if (!company || !jobTitle) {
    return NextResponse.json(
      { error: 'company and jobTitle are required' },
      { status: 400 }
    )
  }

  if (isDuplicate(company, jobTitle)) {
    return NextResponse.json({ error: 'Already tracked' }, { status: 409 })
  }

  const app = appendApplication({ company, jobTitle, matchScore: matchScore ?? 0 })
  return NextResponse.json({ ok: true, id: app.id })
}
```

- [ ] **Step 8: Run all tests — expect PASS**

```bash
npx jest __tests__/lib/applications-store.test.ts __tests__/api/applications.test.ts --no-coverage 2>&1 | tail -10
```

Expected: 8 tests passed

- [ ] **Step 9: Commit**

```bash
git add src/lib/applications.ts src/app/api/applications/route.ts \
        __tests__/lib/applications-store.test.ts __tests__/api/applications.test.ts
git commit -m "feat: add applications store + POST /api/applications endpoint"
```

---

## Task 2: Wire JobDetail action rows

**Files:**
- Modify: `src/components/jobs/JobDetail.tsx`

- [ ] **Step 1: Add `useRouter` import and `applied` state**

In `src/components/jobs/JobDetail.tsx`, change the import block at the top from:

```typescript
'use client'

import { useState } from 'react'
import { Job, ScoreBreakdown as ScoreBreakdownType, SkillMatch } from '@/types/jobs'
import { ScoreBreakdown } from './ScoreBreakdown'
```

to:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Job, ScoreBreakdown as ScoreBreakdownType, SkillMatch } from '@/types/jobs'
import { ScoreBreakdown } from './ScoreBreakdown'
```

- [ ] **Step 2: Add `router`, `applied` state, and `handleMarkApplied` inside the component**

Inside `export function JobDetail({ job, cvMarkdown }: JobDetailProps) {`, after the existing `const [evalState, setEvalState] = useState<EvalState>({ status: 'idle' })` line, add:

```typescript
  const router = useRouter()
  const [applied, setApplied] = useState(false)

  async function handleMarkApplied() {
    if (applied) return
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: job.company,
          jobTitle: job.title,
          matchScore: job.matchScore ?? 0,
        }),
      })
      // 409 means already tracked — still show as applied
      if (res.ok || res.status === 409) setApplied(true)
    } catch {
      // silently ignore in demo context
    }
  }
```

- [ ] **Step 3: Replace the Agent Actions section**

Find the block starting with:
```typescript
      {/* Agent actions */}
      <div className="bg-white border border-[#d8dbe4] rounded-[10px] p-5 mt-4 shadow-[0_5px_40px_rgba(151,155,192,0.1)]">
        <div className="text-[11px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">
          Agent Actions
        </div>
        {[
          { icon: '📄', label: 'Generate tailored CV', sub: 'Keyword-optimized · PDF download', active: true },
          { icon: '✉️', label: 'Draft LinkedIn outreach', sub: 'Find hiring manager · 3-sentence message', active: true },
          { icon: '🎯', label: 'Interview prep', sub: 'Glassdoor intel + STAR stories', active: false },
          { icon: '🔍', label: 'Deep company research', sub: 'AI strategy, culture, recent news', active: true },
        ].map((action, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg border mb-2 last:mb-0 transition-all ${
              action.active
                ? 'border-[#d8dbe4] cursor-pointer hover:border-[#0052ff] hover:bg-[#F8FBFF]'
                : 'border-[#d8dbe4] opacity-60'
            }`}
          >
            <div className="w-[30px] h-[30px] rounded-lg bg-[#e8f0fe] flex items-center justify-center text-sm flex-shrink-0">
              {action.icon}
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-bold text-[#0a0b0d]">{action.label}</div>
              <div className="text-[11px] text-[#727998] mt-0.5">{action.sub}</div>
            </div>
            {action.active
              ? <span className="text-[#BFC5D6] text-sm">›</span>
              : <span className="bg-[#eef0f3] text-[#8D96B4] text-[10px] font-semibold px-2 py-0.5 rounded-full">Coming soon</span>
            }
          </div>
        ))}
      </div>
```

Replace with:

```typescript
      {/* Agent actions */}
      <div className="bg-white border border-[#d8dbe4] rounded-[10px] p-5 mt-4 shadow-[0_5px_40px_rgba(151,155,192,0.1)]">
        <div className="text-[11px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-3">
          Agent Actions
        </div>

        {/* Generate tailored CV */}
        <button
          onClick={() => router.push(`/cv?jobTitle=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#d8dbe4] mb-2 hover:border-[#0052ff] hover:bg-[#f5f8ff] transition-all cursor-pointer text-left"
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0052ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-[#0a0b0d]">Generate tailored CV</div>
            <div className="text-[11px] text-[#727998] mt-0.5">Opens CV page with this job pre-filled</div>
          </div>
          <span className="text-[#d8dbe4] text-sm">›</span>
        </button>

        {/* Mark as applied */}
        <button
          onClick={handleMarkApplied}
          disabled={applied}
          className="w-full flex items-center gap-3 p-3 rounded-lg border mb-2 transition-all cursor-pointer text-left disabled:cursor-default border-[#d8dbe4] hover:border-[#03BA82] hover:bg-[#f0fdf8] disabled:hover:border-[#d8dbe4] disabled:hover:bg-white"
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-[#e6faf4] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#03BA82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-[#0a0b0d]">Mark as applied</div>
            <div className="text-[11px] text-[#727998] mt-0.5">Auto-adds to Applications tracker</div>
          </div>
          {applied
            ? <span className="bg-[#e6faf4] text-[#03BA82] text-[10px] font-bold px-2 py-0.5 rounded-full">Applied</span>
            : <span className="text-[#d8dbe4] text-sm">›</span>
          }
        </button>

        {/* Interview prep */}
        <button
          onClick={() => router.push(`/interview?company=${encodeURIComponent(job.company)}`)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#d8dbe4] mb-2 hover:border-[#0052ff] hover:bg-[#f5f8ff] transition-all cursor-pointer text-left"
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-[#fff8ec] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FAA82C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-[#0a0b0d]">Interview prep</div>
            <div className="text-[11px] text-[#727998] mt-0.5">Opens Interview page for {job.company}</div>
          </div>
          <span className="text-[#d8dbe4] text-sm">›</span>
        </button>

        {/* Draft outreach */}
        <button
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#d8dbe4] hover:border-[#0052ff] hover:bg-[#f5f8ff] transition-all cursor-pointer text-left"
        >
          <div className="w-[30px] h-[30px] rounded-lg bg-[#eef0f3] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#727998" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-[#0a0b0d]">Draft outreach message</div>
            <div className="text-[11px] text-[#727998] mt-0.5">Ask AI coach to write a LinkedIn message</div>
          </div>
          <span className="text-[#d8dbe4] text-sm">›</span>
        </button>
      </div>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (zero errors)

- [ ] **Step 5: Commit**

```bash
git add src/components/jobs/JobDetail.tsx
git commit -m "feat: wire job action rows with SVG icons and real navigation"
```

---

## Task 3: CVPreview pre-fill from URL params

**Files:**
- Modify: `src/components/cv/CVPreview.tsx`
- Modify: `src/components/cv/CVPageClient.tsx`
- Modify: `src/app/(app)/cv/page.tsx`

- [ ] **Step 1: Add `initialJobTitle` and `initialCompany` props to `CVPreview`**

In `src/components/cv/CVPreview.tsx`, change the interface:

```typescript
interface CVPreviewProps {
  masterCvMarkdown: string
  activeCV: GeneratedCV | null
  onGenerate: (jobTitle: string, company: string, jobDescription: string) => Promise<void>
  isGenerating: boolean
  initialJobTitle?: string
  initialCompany?: string
}
```

Change the function signature:

```typescript
export function CVPreview({ masterCvMarkdown, activeCV, onGenerate, isGenerating, initialJobTitle, initialCompany }: CVPreviewProps) {
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? '')
  const [company, setCompany] = useState(initialCompany ?? '')
  const [jobDescription, setJobDescription] = useState('')
  const [showForm, setShowForm] = useState(!!initialJobTitle)
```

- [ ] **Step 2: Add `useSearchParams` to `CVPageClient`**

In `src/components/cv/CVPageClient.tsx`, change:

```typescript
'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { GeneratedCV } from '@/types/cv'
import { ProfileColumn } from './ProfileColumn'
import { CVPreview } from './CVPreview'
import { GeneratedCVList } from './GeneratedCVList'
```

to:

```typescript
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { GeneratedCV } from '@/types/cv'
import { ProfileColumn } from './ProfileColumn'
import { CVPreview } from './CVPreview'
import { GeneratedCVList } from './GeneratedCVList'
```

Add these two lines inside `export function CVPageClient() {` right before the `useState` declarations:

```typescript
  const searchParams = useSearchParams()
  const initialJobTitle = searchParams.get('jobTitle') ?? undefined
  const initialCompany = searchParams.get('company') ?? undefined
```

Pass the params to `CVPreview` — change the `<CVPreview ...>` JSX from:

```typescript
        <CVPreview
          masterCvMarkdown={DEMO_CV_MARKDOWN}
          activeCV={activeCV}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
```

to:

```typescript
        <CVPreview
          masterCvMarkdown={DEMO_CV_MARKDOWN}
          activeCV={activeCV}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          initialJobTitle={initialJobTitle}
          initialCompany={initialCompany}
        />
```

- [ ] **Step 3: Wrap `CVPageClient` in Suspense in `src/app/(app)/cv/page.tsx`**

```typescript
import { Suspense } from 'react'
import { CVPageClient } from '@/components/cv/CVPageClient'

export default function CVPage() {
  return (
    <Suspense fallback={null}>
      <CVPageClient />
    </Suspense>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 5: Smoke-test manually**

Navigate to `http://localhost:3001/cv?jobTitle=AI+Platform+Engineer&company=NEOM` — the CV generation form should be open and pre-filled with "AI Platform Engineer" and "NEOM".

- [ ] **Step 6: Commit**

```bash
git add src/components/cv/CVPreview.tsx src/components/cv/CVPageClient.tsx src/app/\(app\)/cv/page.tsx
git commit -m "feat: pre-fill CV form from ?jobTitle and ?company URL params"
```

---

## Task 4: InterviewPageClient pre-fill from URL params

**Files:**
- Modify: `src/components/interview/InterviewPageClient.tsx`
- Modify: `src/app/(app)/interview/page.tsx`

- [ ] **Step 1: Add `useSearchParams` to `InterviewPageClient`**

In `src/components/interview/InterviewPageClient.tsx`, change the import block:

```typescript
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { InterviewSession } from '@/types/interview'
import { DEMO_SESSIONS, DEMO_QUESTIONS, DEMO_STAR_STORIES, DEMO_COMPANY_PROCESS } from '@/lib/interview'
import { InterviewSessionPanel } from './InterviewSessionPanel'
```

Inside `export function InterviewPageClient() {`, replace:

```typescript
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(
    DEMO_SESSIONS[0] ?? null
  )
```

with:

```typescript
  const searchParams = useSearchParams()
  const companyParam = searchParams.get('company')

  const [activeSession, setActiveSession] = useState<InterviewSession | null>(() => {
    if (companyParam) {
      return DEMO_SESSIONS.find(
        s => s.company.toLowerCase() === companyParam.toLowerCase()
      ) ?? DEMO_SESSIONS[0] ?? null
    }
    return DEMO_SESSIONS[0] ?? null
  })
```

- [ ] **Step 2: Wrap `InterviewPageClient` in Suspense in `src/app/(app)/interview/page.tsx`**

```typescript
import { Suspense } from 'react'
import { InterviewPageClient } from '@/components/interview/InterviewPageClient'

export default function InterviewPage() {
  return (
    <Suspense fallback={null}>
      <InterviewPageClient />
    </Suspense>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 4: Smoke-test manually**

Navigate to `http://localhost:3001/interview?company=Emirates+NBD` — the left column should have Emirates NBD pre-selected.

- [ ] **Step 5: Run full test suite**

```bash
npx jest --no-coverage 2>&1 | tail -15
```

Expected: all tests pass (count ≥ previous run + 8 new)

- [ ] **Step 6: Run build**

```bash
npm run build 2>&1 | tail -15
```

Expected: Build completes with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/interview/InterviewPageClient.tsx src/app/\(app\)/interview/page.tsx
git commit -m "feat: pre-select interview company from ?company URL param"
```
