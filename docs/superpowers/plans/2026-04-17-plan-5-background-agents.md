# Background Agents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up background job scanner and follow-up reminder agents so the Dashboard shows live data — real job counts, last-scanned timestamp, and contextual next actions driven by application state.

**Architecture:** An in-memory scan store (`scan-store.ts`) holds scanner state across requests. Two secured cron routes (`/api/cron/scan`, `/api/cron/followup`) are called on schedule by Vercel cron (or manually by the "Scan now" button). A `ScannerStatus` component polls `/api/scan-status` every 30 s and renders the live pill. The Dashboard's `NextActions` card is driven by `computeFollowUps()`, a pure function over `DEMO_APPLICATIONS` that replaces the hardcoded array.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Jest, Tailwind CSS, in-memory singleton store (no DB — demo mode), `vercel.json` cron config.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/scan-store.ts` | In-memory scanner state singleton — `startScan`, `completeScan`, `getScanState`, `getStoredJobs`, `resetForTest` |
| Create | `src/lib/followup.ts` | Pure `computeFollowUps(applications)` → `FollowUpAction[]` |
| Create | `src/app/api/cron/scan/route.ts` | Secured GET cron endpoint — triggers ATS scan, updates store |
| Create | `src/app/api/cron/followup/route.ts` | Secured GET cron endpoint — computes follow-up actions |
| Create | `src/app/api/scan-status/route.ts` | Public GET — returns `ScanState` (no jobs array) |
| Create | `src/components/dashboard/ScannerStatus.tsx` | "Agents active" pill with live poll + "Scan now" button |
| Modify | `src/types/jobs.ts` | Add `ScanState` interface |
| Modify | `src/types/applications.ts` | Add `FollowUpAction` interface |
| Modify | `src/components/dashboard/DashboardClient.tsx` | Replace hardcoded pill + NEXT_ACTIONS with live components |
| Create | `vercel.json` | Cron schedule config |
| Create | `__tests__/lib/followup.test.ts` | TDD tests for `computeFollowUps` |
| Create | `__tests__/lib/scan-store.test.ts` | TDD tests for scan store |

---

## Task 1: Follow-up engine

**Files:**
- Create: `src/lib/followup.ts`
- Modify: `src/types/applications.ts`
- Test: `__tests__/lib/followup.test.ts`

- [ ] **Step 1: Add `FollowUpAction` type to `src/types/applications.ts`**

Add at the end of the file (after the `Application` interface):

```typescript
export interface FollowUpAction {
  label: string
  description: string
  type: 'follow-up' | 'interview' | 'offer' | 'apply'
}
```

- [ ] **Step 2: Write failing tests in `__tests__/lib/followup.test.ts`**

```typescript
import { computeFollowUps } from '@/lib/followup'
import type { Application } from '@/types/applications'

const baseApp: Application = {
  id: '1', company: 'TestCo', jobTitle: 'Engineer',
  matchScore: 4.0, status: 'applied',
  lastActivity: new Date(Date.now() - 10 * 86400000).toISOString(),
  alertType: null,
}

describe('computeFollowUps', () => {
  it('returns empty array when no alerts', () => {
    expect(computeFollowUps([baseApp])).toEqual([])
  })

  it('returns interview action for interview alertType', () => {
    const app: Application = { ...baseApp, status: 'interview', alertType: 'interview', alertMessage: 'Interview at 3pm' }
    const result = computeFollowUps([app])
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('interview')
    expect(result[0].label).toContain('TestCo')
    expect(result[0].description).toBe('Interview at 3pm')
  })

  it('returns offer action for deadline alertType', () => {
    const app: Application = { ...baseApp, status: 'offer', alertType: 'deadline', alertMessage: 'Deadline in 2 days' }
    const result = computeFollowUps([app])
    expect(result[0].type).toBe('offer')
    expect(result[0].label).toContain('TestCo')
  })

  it('returns follow-up action for follow-up alertType', () => {
    const app: Application = { ...baseApp, alertType: 'follow-up', alertMessage: 'No response in 8 days' }
    const result = computeFollowUps([app])
    expect(result[0].type).toBe('follow-up')
    expect(result[0].description).toBe('No response in 8 days')
  })

  it('sorts offer > interview > follow-up', () => {
    const apps: Application[] = [
      { ...baseApp, id: '1', alertType: 'follow-up', alertMessage: 'Follow up' },
      { ...baseApp, id: '2', status: 'interview', alertType: 'interview', alertMessage: 'Interview' },
      { ...baseApp, id: '3', status: 'offer', alertType: 'deadline', alertMessage: 'Deadline' },
    ]
    const result = computeFollowUps(apps)
    expect(result[0].type).toBe('offer')
    expect(result[1].type).toBe('interview')
    expect(result[2].type).toBe('follow-up')
  })

  it('limits to 3 actions', () => {
    const apps: Application[] = Array.from({ length: 5 }, (_, i) => ({
      ...baseApp, id: String(i), alertType: 'follow-up' as const, alertMessage: `Follow up ${i}`,
    }))
    expect(computeFollowUps(apps)).toHaveLength(3)
  })

  it('skips apps with no alertMessage', () => {
    const app: Application = { ...baseApp, alertType: 'follow-up' }  // no alertMessage
    expect(computeFollowUps([app])).toEqual([])
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd "localized-career-coach"
npx jest __tests__/lib/followup.test.ts --no-coverage
```

Expected: `FAIL` — `Cannot find module '@/lib/followup'`

- [ ] **Step 4: Create `src/lib/followup.ts`**

```typescript
// src/lib/followup.ts
import type { Application } from '@/types/applications'
import type { FollowUpAction } from '@/types/applications'

const SORT_ORDER: Record<FollowUpAction['type'], number> = {
  offer: 0,
  interview: 1,
  'follow-up': 2,
  apply: 3,
}

export function computeFollowUps(applications: Application[]): FollowUpAction[] {
  const actions: FollowUpAction[] = []

  for (const app of applications) {
    if (!app.alertMessage) continue

    if (app.alertType === 'interview') {
      actions.push({
        label: `Prepare for ${app.company} interview`,
        description: app.alertMessage,
        type: 'interview',
      })
    } else if (app.alertType === 'deadline') {
      actions.push({
        label: `Review ${app.company} offer`,
        description: app.alertMessage,
        type: 'offer',
      })
    } else if (app.alertType === 'follow-up') {
      actions.push({
        label: `Follow up with ${app.company} — ${app.jobTitle}`,
        description: app.alertMessage,
        type: 'follow-up',
      })
    }
  }

  return actions
    .sort((a, b) => SORT_ORDER[a.type] - SORT_ORDER[b.type])
    .slice(0, 3)
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/lib/followup.test.ts --no-coverage
```

Expected: `PASS` — 7 tests passing

- [ ] **Step 6: Commit**

```bash
git add src/types/applications.ts src/lib/followup.ts __tests__/lib/followup.test.ts
git commit -m "feat: add computeFollowUps pure engine with TDD"
```

---

## Task 2: Scan state store

**Files:**
- Create: `src/lib/scan-store.ts`
- Modify: `src/types/jobs.ts`
- Test: `__tests__/lib/scan-store.test.ts`

- [ ] **Step 1: Add `ScanState` type to `src/types/jobs.ts`**

Add at the end of the file (after the `FilterState` interface):

```typescript
export interface ScanState {
  lastScanAt: string | null   // ISO string or null if never scanned
  newJobsCount: number         // jobs added since previous scan
  totalJobsCount: number       // total jobs in store
  isScanning: boolean
}
```

- [ ] **Step 2: Write failing tests in `__tests__/lib/scan-store.test.ts`**

```typescript
import { getScanState, getStoredJobs, startScan, completeScan, resetForTest } from '@/lib/scan-store'
import type { Job } from '@/types/jobs'

const mockJob: Job = {
  id: 'test-1', externalId: 'test-1', atsSource: 'mock',
  company: 'TestCo', companySlug: 'testco', title: 'Engineer',
  location: 'Dubai', country: 'UAE', url: 'https://example.com',
  remoteType: 'hybrid', roleCategory: 'ai-ml',
}

beforeEach(() => {
  resetForTest()
})

describe('scan-store', () => {
  it('starts with isScanning false and lastScanAt null', () => {
    const state = getScanState()
    expect(state.isScanning).toBe(false)
    expect(state.lastScanAt).toBeNull()
    expect(state.totalJobsCount).toBe(0)
  })

  it('startScan sets isScanning true', () => {
    startScan()
    expect(getScanState().isScanning).toBe(true)
  })

  it('completeScan stores total job count and clears isScanning', () => {
    startScan()
    completeScan([mockJob])
    const state = getScanState()
    expect(state.isScanning).toBe(false)
    expect(state.totalJobsCount).toBe(1)
  })

  it('completeScan makes jobs accessible via getStoredJobs', () => {
    completeScan([mockJob])
    expect(getStoredJobs()).toHaveLength(1)
    expect(getStoredJobs()[0].id).toBe('test-1')
  })

  it('completeScan counts new jobs vs previous scan', () => {
    completeScan([mockJob])
    expect(getScanState().newJobsCount).toBe(1)  // first scan: all are new

    const anotherJob: Job = { ...mockJob, id: 'test-2', externalId: 'test-2' }
    completeScan([mockJob, anotherJob])
    expect(getScanState().newJobsCount).toBe(1)  // only test-2 is new
  })

  it('completeScan sets lastScanAt to current time', () => {
    const before = Date.now()
    completeScan([])
    const lastScan = getScanState().lastScanAt
    expect(lastScan).not.toBeNull()
    expect(new Date(lastScan!).getTime()).toBeGreaterThanOrEqual(before)
  })

  it('resetForTest restores clean state', () => {
    startScan()
    completeScan([mockJob])
    resetForTest()
    const state = getScanState()
    expect(state.isScanning).toBe(false)
    expect(state.lastScanAt).toBeNull()
    expect(state.totalJobsCount).toBe(0)
    expect(getStoredJobs()).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx jest __tests__/lib/scan-store.test.ts --no-coverage
```

Expected: `FAIL` — `Cannot find module '@/lib/scan-store'`

- [ ] **Step 4: Create `src/lib/scan-store.ts`**

```typescript
// src/lib/scan-store.ts
import type { Job, ScanState } from '@/types/jobs'

interface InternalState extends ScanState {
  jobs: Job[]
}

const store: InternalState = {
  lastScanAt: null,
  newJobsCount: 0,
  totalJobsCount: 0,
  isScanning: false,
  jobs: [],
}

export function getScanState(): ScanState {
  return {
    lastScanAt: store.lastScanAt,
    newJobsCount: store.newJobsCount,
    totalJobsCount: store.totalJobsCount,
    isScanning: store.isScanning,
  }
}

export function getStoredJobs(): Job[] {
  return store.jobs
}

export function startScan(): void {
  store.isScanning = true
}

export function completeScan(jobs: Job[]): void {
  const prevIds = new Set(store.jobs.map(j => j.id))
  store.newJobsCount = jobs.filter(j => !prevIds.has(j.id)).length
  store.jobs = jobs
  store.totalJobsCount = jobs.length
  store.lastScanAt = new Date().toISOString()
  store.isScanning = false
}

/** Reset to pristine state — only use in tests. */
export function resetForTest(): void {
  store.lastScanAt = null
  store.newJobsCount = 0
  store.totalJobsCount = 0
  store.isScanning = false
  store.jobs = []
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/lib/scan-store.test.ts --no-coverage
```

Expected: `PASS` — 7 tests passing

- [ ] **Step 6: Commit**

```bash
git add src/types/jobs.ts src/lib/scan-store.ts __tests__/lib/scan-store.test.ts
git commit -m "feat: add in-memory scan store with TDD"
```

---

## Task 3: Cron routes + scan status API

**Files:**
- Create: `src/app/api/cron/scan/route.ts`
- Create: `src/app/api/cron/followup/route.ts`
- Create: `src/app/api/scan-status/route.ts`
- Create: `vercel.json`

No test files for these routes — they're thin wrappers over already-tested logic. Manual verification below.

- [ ] **Step 1: Create `src/app/api/cron/scan/route.ts`**

```typescript
// src/app/api/cron/scan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { scanAllMENAPortals } from '@/lib/agents/job-scanner'
import { startScan, completeScan } from '@/lib/scan-store'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  startScan()
  try {
    const jobs = await scanAllMENAPortals()
    completeScan(jobs)
    const { newJobsCount, totalJobsCount } = { newJobsCount: 0, totalJobsCount: 0 }
    return NextResponse.json({ ok: true, newJobs: newJobsCount, totalJobs: totalJobsCount })
  } catch {
    completeScan([])
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
```

Wait — the above has a bug: after `completeScan(jobs)`, the counts are in the store. Read them back:

```typescript
// src/app/api/cron/scan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { scanAllMENAPortals } from '@/lib/agents/job-scanner'
import { startScan, completeScan, getScanState } from '@/lib/scan-store'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  startScan()
  try {
    const jobs = await scanAllMENAPortals()
    completeScan(jobs)
    const { newJobsCount, totalJobsCount } = getScanState()
    return NextResponse.json({ ok: true, newJobs: newJobsCount, totalJobs: totalJobsCount })
  } catch {
    completeScan([])
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create `src/app/api/cron/followup/route.ts`**

```typescript
// src/app/api/cron/followup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { computeFollowUps } from '@/lib/followup'
import { DEMO_APPLICATIONS } from '@/lib/applications'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const actions = computeFollowUps(DEMO_APPLICATIONS)
  return NextResponse.json({ ok: true, actions })
}
```

- [ ] **Step 3: Create `src/app/api/scan-status/route.ts`**

```typescript
// src/app/api/scan-status/route.ts
import { NextResponse } from 'next/server'
import { getScanState } from '@/lib/scan-store'

export async function GET() {
  return NextResponse.json(getScanState())
}
```

- [ ] **Step 4: Create `vercel.json` in the project root**

`vercel.json` lives in the same directory as `package.json` (i.e. `localized-career-coach/vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/scan",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/followup",
      "schedule": "0 8 * * *"
    }
  ]
}
```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit 2>&1 | grep -v "^__tests__" | grep -i error
```

Expected: no output (no src/ type errors)

- [ ] **Step 6: Manually test the scan status endpoint**

Start dev server if not running: `npm run dev`

```bash
curl http://localhost:3000/api/scan-status
```

Expected: `{"lastScanAt":null,"newJobsCount":0,"totalJobsCount":0,"isScanning":false}`

```bash
curl http://localhost:3000/api/cron/scan
```

Expected (after a few seconds): `{"ok":true,"newJobs":N,"totalJobs":N}` where N > 0 (mock jobs always included)

```bash
curl http://localhost:3000/api/scan-status
```

Expected: `lastScanAt` is now set, `totalJobsCount` > 0, `isScanning` false

- [ ] **Step 7: Commit**

```bash
git add src/app/api/cron/ src/app/api/scan-status/ vercel.json
git commit -m "feat: add cron routes for scan/followup + scan-status API + vercel.json"
```

---

## Task 4: ScannerStatus component

**Files:**
- Create: `src/components/dashboard/ScannerStatus.tsx`

No separate test file — component behavior is verified visually. The underlying logic (`scan-store`, `computeFollowUps`) is already tested.

- [ ] **Step 1: Create `src/components/dashboard/ScannerStatus.tsx`**

```typescript
// src/components/dashboard/ScannerStatus.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScanState } from '@/types/jobs'

interface ScannerStatusProps {
  onScanComplete?: (newJobsCount: number, totalJobsCount: number) => void
}

function timeSinceScan(iso: string | null): string {
  if (!iso) return 'Never scanned'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const INITIAL_STATE: ScanState = {
  lastScanAt: null,
  newJobsCount: 0,
  totalJobsCount: 0,
  isScanning: false,
}

export function ScannerStatus({ onScanComplete }: ScannerStatusProps) {
  const [state, setState] = useState<ScanState>(INITIAL_STATE)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scan-status')
      if (res.ok) setState(await res.json())
    } catch {
      // silently ignore — demo environment may not have network
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 30_000)
    return () => clearInterval(id)
  }, [fetchStatus])

  const handleScanNow = async () => {
    setState(s => ({ ...s, isScanning: true }))
    try {
      const res = await fetch('/api/cron/scan')
      if (res.ok) {
        const data: { newJobs: number; totalJobs: number } = await res.json()
        onScanComplete?.(data.newJobs, data.totalJobs)
      }
    } finally {
      await fetchStatus()
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[#ABAFC2]">
        {state.isScanning ? 'Scanning now...' : `Scanned ${timeSinceScan(state.lastScanAt)}`}
      </span>
      <button
        onClick={handleScanNow}
        disabled={state.isScanning}
        className="flex items-center gap-2 bg-[#F2F3F6] px-3 py-1.5 rounded-full hover:bg-[#EAECF2] transition-colors disabled:opacity-60 cursor-pointer"
      >
        <div
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            state.isScanning ? 'bg-[#FAA82C]' : 'bg-[#03BA82]'
          }`}
        />
        <span className="text-[11px] text-[#727998] font-semibold">
          {state.isScanning ? 'Scanning...' : 'Agents active'}
        </span>
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ScannerStatus.tsx
git commit -m "feat: add ScannerStatus component with live poll + scan-now button"
```

---

## Task 5: Wire Dashboard to live data

**Files:**
- Modify: `src/components/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Read the current file**

Read `src/components/dashboard/DashboardClient.tsx` to confirm current content before editing.

The current file:
- Has a hardcoded `TOP_MATCHES` array and `NEXT_ACTIONS` array
- Has a hardcoded inline "Agents active" pill div in the JSX header
- Has `<StatCard label="Job Matches" value="12" subtitle="3 new today" valueColor="#4584FF" />`

- [ ] **Step 2: Replace `DashboardClient.tsx` with the wired version**

```typescript
// src/components/dashboard/DashboardClient.tsx
'use client'

import { useState, useCallback } from 'react'
import { computeStats, DEMO_APPLICATIONS } from '@/lib/applications'
import { computeFollowUps } from '@/lib/followup'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import type { SkillGapResult } from '@/types'
import { StatCard } from './StatCard'
import { PipelineSummary } from './PipelineSummary'
import { TopMatches } from './TopMatches'
import { NextActions } from './NextActions'
import { ScannerStatus } from './ScannerStatus'

const DEMO_SKILL_GAP: SkillGapResult = {
  role: {
    id: 'mena-ai-engineer',
    title: 'Senior AI Engineer',
    company: 'MENA Tech',
    location: 'Dubai, UAE',
    requiredSkills: [],
  },
  overallReadiness: 87,
  gaps: [
    { skill: 'LLM / RAG',    category: 'technical', currentLevel: 9, requiredLevel: 9, gap: 0, severity: 'low',    recommendedAction: '' },
    { skill: 'Python',       category: 'technical', currentLevel: 9, requiredLevel: 9, gap: 0, severity: 'low',    recommendedAction: '' },
    { skill: 'MLOps',        category: 'technical', currentLevel: 7, requiredLevel: 8, gap: 1, severity: 'medium', recommendedAction: '' },
    { skill: 'Arabic NLP',   category: 'technical', currentLevel: 6, requiredLevel: 8, gap: 2, severity: 'medium', recommendedAction: '' },
    { skill: 'System Design',category: 'technical', currentLevel: 7, requiredLevel: 9, gap: 2, severity: 'high',   recommendedAction: '' },
    { skill: 'LangChain',    category: 'technical', currentLevel: 8, requiredLevel: 8, gap: 0, severity: 'low',    recommendedAction: '' },
  ],
}

const TOP_MATCHES = [
  { company: 'NEOM', jobTitle: 'AI Platform Engineer', location: 'Riyadh, KSA', matchScore: 4.7, isNew: true },
  { company: 'Emirates NBD', jobTitle: 'Head of AI', location: 'Dubai, UAE', matchScore: 4.8, isNew: true },
  { company: 'STC', jobTitle: 'LLM Engineer', location: 'Riyadh, KSA', matchScore: 4.5, isNew: false },
]

export function DashboardClient() {
  const { sent, avgScore, pipelineCounts } = computeStats(DEMO_APPLICATIONS)
  const total = DEMO_APPLICATIONS.length
  const liveActions = computeFollowUps(DEMO_APPLICATIONS)

  // Live job counts — updated when ScannerStatus completes a scan
  const [jobMatchCount, setJobMatchCount] = useState(12)
  const [newTodayCount, setNewTodayCount] = useState(3)

  const handleScanComplete = useCallback((newJobs: number, totalJobs: number) => {
    if (totalJobs > 0) setJobMatchCount(totalJobs)
    if (newJobs >= 0) setNewTodayCount(newJobs)
  }, [])

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#06123C]">Dashboard</h1>
          <p className="text-[12px] text-[#727998] mt-0.5">Good morning, Ahmed — here&apos;s your job search summary</p>
        </div>
        <ScannerStatus onScanComplete={handleScanComplete} />
      </div>

      <div className="px-7 pb-6 flex flex-col gap-5">
        {/* Stat cards row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Job Matches"
            value={jobMatchCount}
            subtitle={`${newTodayCount} new today`}
            valueColor="#4584FF"
          />
          <StatCard label="Applications Sent" value={sent} subtitle={`${total} total tracked`} />
          <StatCard label="Profile Readiness" value="87%" subtitle="2 improvements suggested" valueColor="#03BA82" />
          <StatCard label="Avg Match Score" value={`${avgScore}/5`} subtitle="Across all tracked" valueColor={avgScore >= 4.0 ? '#03BA82' : '#FAA82C'} />
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-[1fr_340px] gap-5">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            <TopMatches matches={TOP_MATCHES} />
            <PipelineSummary pipelineCounts={pipelineCounts} total={total} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <NextActions actions={liveActions} />
            <div>
              <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-2">Skill Readiness</div>
              <SkillRadarChart result={DEMO_SKILL_GAP} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run full test suite**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: All tests pass. Pay attention to any test that imports from `DashboardClient` — there should be none since it's a client component and not directly tested.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "^__tests__" | grep -i error
```

Expected: no output

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/DashboardClient.tsx
git commit -m "feat: wire dashboard to live scan status and computed follow-ups"
```

---

## Task 6: Full build verification + final commit

**Files:**
- No new files — verification only

- [ ] **Step 1: Run the full test suite**

```bash
cd "localized-career-coach"
npx jest --no-coverage 2>&1 | tail -30
```

Expected: All tests pass. Count should be 14+ new (followup: 7, scan-store: 7) on top of the existing suite.

- [ ] **Step 2: TypeScript full check (src only)**

```bash
npx tsc --noEmit 2>&1 | grep "^src/" | grep -i error
```

Expected: no output

- [ ] **Step 3: Next.js production build**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` — no type errors, no missing modules

- [ ] **Step 4: Smoke test cron endpoint manually**

With dev server running on port 3000 or 3001:

```bash
# First check: scan status starts at null
curl -s http://localhost:3001/api/scan-status | python3 -m json.tool

# Trigger scan manually
curl -s http://localhost:3001/api/cron/scan | python3 -m json.tool

# Verify status updated
curl -s http://localhost:3001/api/scan-status | python3 -m json.tool
```

Expected sequence:
1. First call: `{"lastScanAt":null,"newJobsCount":0,"totalJobsCount":0,"isScanning":false}`
2. Second call: `{"ok":true,"newJobs":N,"totalJobs":N}` where N ≥ 6 (at minimum 6 mock jobs)
3. Third call: `lastScanAt` is set, `totalJobsCount` ≥ 6

- [ ] **Step 5: Smoke test followup endpoint**

```bash
curl -s http://localhost:3001/api/cron/followup | python3 -m json.tool
```

Expected: `{"ok":true,"actions":[...]}` with 3 actions (offer, interview, follow-up from DEMO_APPLICATIONS)

- [ ] **Step 6: Final commit**

```bash
git add -A
git status  # verify only expected files are staged
git commit -m "feat: plan 5 complete — background scan + followup agents wired to dashboard"
```

---

## Self-Review

### Spec Coverage

| Spec requirement | Covered by |
|---|---|
| Job scanner — every 6h, Greenhouse/Lever/Ashby | Task 3 cron route + vercel.json |
| Match scorer — scores new jobs | `scanAllMENAPortals()` already returns mock+real jobs; score injection is in `job-evaluator.ts` (existing, not in scope for demo) |
| Follow-up reminder — daily, 7+ day stale apps | Task 1 `computeFollowUps` + Task 3 `/api/cron/followup` |
| Dashboard "Agents active" pill → dynamic | Task 4 `ScannerStatus` component |
| Dashboard job count → live | Task 5 `onScanComplete` callback wired to stat card |
| Dashboard next actions → computed | Task 5 `computeFollowUps(DEMO_APPLICATIONS)` |
| "Scan now" manual trigger | Task 4 `ScannerStatus` button |
| Last scanned timestamp | Task 4 `timeSinceScan()` in `ScannerStatus` |

### Placeholder Scan
None found. All steps have complete code blocks.

### Type Consistency
- `ScanState` defined in `src/types/jobs.ts` → used in `scan-store.ts` and `ScannerStatus.tsx` ✓
- `FollowUpAction` defined in `src/types/applications.ts` → returned by `computeFollowUps` → passed to `<NextActions>` as structurally compatible ✓
- `completeScan(jobs: Job[])` in store → called with `Job[]` from `scanAllMENAPortals()` which returns `Promise<Job[]>` ✓
- `onScanComplete(newJobs: number, totalJobs: number)` in `ScannerStatus` → `handleScanComplete(newJobs, totalJobs)` in `DashboardClient` ✓
