# Plan 3: Applications Kanban + Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Applications kanban board (5-column drag-and-drop with alert flags) and the Dashboard page (stat cards, pipeline summary, top matches, skill radar, next actions).

**Architecture:** All state lives in React client components with demo data (no DB in Plan 3). Applications page uses HTML5 native drag-and-drop — no external library. Dashboard derives stats from the same DEMO_APPLICATIONS constant via `computeStats()`. The existing `SkillRadarChart` component from `src/components/generative-ui/` is reused directly. Pure logic functions (`moveApplication`, `computeStats`, score/border helpers) are extracted to `src/lib/applications.ts` for TDD.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, HTML5 drag-and-drop API, recharts (already installed for SkillRadarChart)

---

## File Map

**New files — types:**
- `src/types/applications.ts` — `Application`, `ApplicationStatus`, `AlertType`

**New files — logic (testable):**
- `src/lib/applications.ts` — `moveApplication`, `computeStats`, `scoreColorClass`, `cardLeftBorderClass`, `timeSince`, `DEMO_APPLICATIONS`, `COLUMNS`

**New files — applications UI:**
- `src/components/applications/ApplicationCard.tsx` — draggable card with alert border, score badge, offer banner (`'use client'`)
- `src/components/applications/KanbanColumn.tsx` — column with drop zone, header, card list
- `src/components/applications/AddApplicationModal.tsx` — modal form to add new application (`'use client'`)
- `src/components/applications/ApplicationsPageClient.tsx` — state orchestrator: drag state, add modal (`'use client'`)

**New files — dashboard UI:**
- `src/components/dashboard/StatCard.tsx` — single stat card (label, value, subtitle)
- `src/components/dashboard/PipelineSummary.tsx` — horizontal pipeline count bar
- `src/components/dashboard/TopMatches.tsx` — 3 hardcoded top job matches
- `src/components/dashboard/NextActions.tsx` — 3 agent-suggested tasks
- `src/components/dashboard/DashboardClient.tsx` — assembles all dashboard components (`'use client'`)

**Modified files:**
- `src/app/(app)/applications/page.tsx` — replace stub with `<ApplicationsPageClient />`
- `src/app/(app)/dashboard/page.tsx` — replace stub with `<DashboardClient />`
- `src/types/index.ts` — add `export * from './applications'`
- `src/app/page.tsx` — change redirect from `/jobs` to `/dashboard`

**New files — tests:**
- `__tests__/lib/applications.test.ts`

---

## Task 1: Application types

**Files:**
- Create: `src/types/applications.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create applications.ts**

```typescript
// src/types/applications.ts

export type ApplicationStatus = 'evaluated' | 'applied' | 'interview' | 'offer' | 'rejected'
export type AlertType = 'follow-up' | 'interview' | 'deadline' | null

export interface Application {
  id: string
  company: string
  jobTitle: string
  matchScore: number        // 0–5.0
  status: ApplicationStatus
  appliedAt?: string        // ISO string
  lastActivity: string      // ISO string
  alertType: AlertType
  alertMessage?: string
  salaryOffer?: string      // e.g. "AED 45,000/mo"
  offerDeadline?: string    // ISO string
  notes?: string
}
```

- [ ] **Step 2: Export from index**

Open `src/types/index.ts` and add at the bottom:

```typescript
export * from './applications'
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
git add src/types/applications.ts src/types/index.ts
git commit -m "feat: add Application types (ApplicationStatus, AlertType, Application)"
```

---

## Task 2: Pure logic functions (TDD)

**Files:**
- Create: `src/lib/applications.ts`
- Create: `__tests__/lib/applications.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/applications.test.ts
import {
  moveApplication,
  computeStats,
  scoreColorClass,
  cardLeftBorderClass,
} from '@/lib/applications'
import type { Application } from '@/types/applications'

const makeApp = (overrides: Partial<Application> = {}): Application => ({
  id: '1',
  company: 'STC',
  jobTitle: 'LLM Engineer',
  matchScore: 4.2,
  status: 'applied',
  lastActivity: new Date(Date.now() - 86400000).toISOString(),
  alertType: null,
  ...overrides,
})

describe('moveApplication', () => {
  it('updates the status of the matching application', () => {
    const apps = [makeApp({ id: '1', status: 'applied' }), makeApp({ id: '2', status: 'evaluated' })]
    const result = moveApplication(apps, '1', 'interview')
    expect(result.find(a => a.id === '1')!.status).toBe('interview')
  })

  it('leaves other applications unchanged', () => {
    const apps = [makeApp({ id: '1' }), makeApp({ id: '2', status: 'evaluated' })]
    const result = moveApplication(apps, '1', 'offer')
    expect(result.find(a => a.id === '2')!.status).toBe('evaluated')
  })

  it('updates lastActivity on the moved application', () => {
    const before = new Date(Date.now() - 86400000).toISOString()
    const apps = [makeApp({ id: '1', lastActivity: before })]
    const result = moveApplication(apps, '1', 'interview')
    expect(result[0].lastActivity).not.toBe(before)
  })
})

describe('computeStats', () => {
  it('counts sent as applied + interview + offer + rejected', () => {
    const apps = [
      makeApp({ status: 'evaluated' }),
      makeApp({ status: 'applied' }),
      makeApp({ status: 'interview' }),
      makeApp({ status: 'offer' }),
      makeApp({ status: 'rejected' }),
    ]
    const stats = computeStats(apps)
    expect(stats.sent).toBe(4)
  })

  it('computes average match score rounded to 1 decimal', () => {
    const apps = [makeApp({ matchScore: 4.0 }), makeApp({ matchScore: 5.0 })]
    const stats = computeStats(apps)
    expect(stats.avgScore).toBe(4.5)
  })

  it('returns pipeline counts per status', () => {
    const apps = [
      makeApp({ status: 'evaluated' }),
      makeApp({ status: 'evaluated' }),
      makeApp({ status: 'applied' }),
    ]
    const stats = computeStats(apps)
    expect(stats.pipelineCounts.evaluated).toBe(2)
    expect(stats.pipelineCounts.applied).toBe(1)
    expect(stats.pipelineCounts.interview).toBe(0)
  })

  it('returns zeros for empty array', () => {
    const stats = computeStats([])
    expect(stats.sent).toBe(0)
    expect(stats.avgScore).toBe(0)
  })
})

describe('scoreColorClass', () => {
  it('returns green class for score >= 4.0', () => {
    expect(scoreColorClass(4.0)).toContain('03BA82')
    expect(scoreColorClass(4.7)).toContain('03BA82')
  })

  it('returns amber class for score >= 3.5 and < 4.0', () => {
    expect(scoreColorClass(3.5)).toContain('FAA82C')
    expect(scoreColorClass(3.9)).toContain('FAA82C')
  })

  it('returns red class for score < 3.5', () => {
    expect(scoreColorClass(3.4)).toContain('F84E4E')
    expect(scoreColorClass(2.0)).toContain('F84E4E')
  })
})

describe('cardLeftBorderClass', () => {
  it('returns blue border for interview alert', () => {
    expect(cardLeftBorderClass('interview', 'interview')).toContain('4584FF')
  })

  it('returns amber border for follow-up alert', () => {
    expect(cardLeftBorderClass('follow-up', 'applied')).toContain('FAA82C')
  })

  it('returns amber border for deadline alert', () => {
    expect(cardLeftBorderClass('deadline', 'offer')).toContain('FAA82C')
  })

  it('returns transparent border for null alert on non-offer status', () => {
    expect(cardLeftBorderClass(null, 'applied')).toContain('transparent')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/lib/applications.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/applications'`

- [ ] **Step 3: Implement src/lib/applications.ts**

```typescript
// src/lib/applications.ts
import type { Application, ApplicationStatus, AlertType } from '@/types/applications'

// ─── Pure helpers ───────────────────────────────────────────────

export function moveApplication(
  apps: Application[],
  id: string,
  newStatus: ApplicationStatus
): Application[] {
  return apps.map(app =>
    app.id === id
      ? { ...app, status: newStatus, lastActivity: new Date().toISOString() }
      : app
  )
}

export function computeStats(applications: Application[]): {
  sent: number
  avgScore: number
  pipelineCounts: Record<ApplicationStatus, number>
} {
  const SENT_STATUSES: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected']
  const sent = applications.filter(a => SENT_STATUSES.includes(a.status)).length
  const avgScore =
    applications.length === 0
      ? 0
      : Math.round((applications.reduce((s, a) => s + a.matchScore, 0) / applications.length) * 10) / 10
  const pipelineCounts: Record<ApplicationStatus, number> = {
    evaluated: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  }
  for (const app of applications) {
    pipelineCounts[app.status]++
  }
  return { sent, avgScore, pipelineCounts }
}

export function scoreColorClass(score: number): string {
  if (score >= 4.0) return 'text-[#03BA82] bg-[#E6FAF4]'
  if (score >= 3.5) return 'text-[#FAA82C] bg-[#FFF8EC]'
  return 'text-[#F84E4E] bg-[#FFF0F0]'
}

export function cardLeftBorderClass(alertType: AlertType, status: ApplicationStatus): string {
  if (alertType === 'interview') return 'border-l-[#4584FF]'
  if (alertType === 'follow-up' || alertType === 'deadline') return 'border-l-[#FAA82C]'
  if (status === 'offer') return 'border-l-[#03BA82]'
  return 'border-l-transparent'
}

export function timeSince(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

// ─── Column config ───────────────────────────────────────────────

export const COLUMNS: Array<{
  status: ApplicationStatus
  label: string
  color: string
  headerBg: string
}> = [
  { status: 'evaluated', label: 'Evaluated', color: '#727998', headerBg: '#F2F3F6' },
  { status: 'applied',   label: 'Applied',   color: '#4584FF', headerBg: '#ECF3FF' },
  { status: 'interview', label: 'Interview', color: '#FAA82C', headerBg: '#FFF8EC' },
  { status: 'offer',     label: 'Offer',     color: '#03BA82', headerBg: '#E6FAF4' },
  { status: 'rejected',  label: 'Rejected',  color: '#F84E4E', headerBg: '#FFF0F0' },
]

// ─── Demo data ───────────────────────────────────────────────────

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString()
const ahead = (days: number) => new Date(Date.now() + days * 86400000).toISOString()

export const DEMO_APPLICATIONS: Application[] = [
  {
    id: '1', company: 'NEOM', jobTitle: 'AI Platform Engineer',
    matchScore: 4.7, status: 'evaluated', lastActivity: d(1), alertType: null,
  },
  {
    id: '2', company: 'Geidea', jobTitle: 'ML Engineer',
    matchScore: 3.8, status: 'evaluated', lastActivity: d(2), alertType: null,
  },
  {
    id: '3', company: 'STC', jobTitle: 'LLM Engineer',
    matchScore: 4.5, status: 'applied', appliedAt: d(8),
    lastActivity: d(8), alertType: 'follow-up',
    alertMessage: 'No response in 8 days — follow up today',
  },
  {
    id: '4', company: 'Careem', jobTitle: 'AI Infrastructure Lead',
    matchScore: 4.2, status: 'applied', appliedAt: d(5),
    lastActivity: d(5), alertType: null,
  },
  {
    id: '5', company: 'Talabat', jobTitle: 'Senior ML Engineer',
    matchScore: 3.9, status: 'applied', appliedAt: d(2),
    lastActivity: d(2), alertType: null,
  },
  {
    id: '6', company: 'Emirates NBD', jobTitle: 'Head of AI',
    matchScore: 4.8, status: 'interview', appliedAt: d(10),
    lastActivity: d(1), alertType: 'interview',
    alertMessage: 'Technical interview tomorrow at 2pm',
  },
  {
    id: '7', company: 'Anghami', jobTitle: 'AI Product Lead',
    matchScore: 4.1, status: 'interview', appliedAt: d(8),
    lastActivity: d(3), alertType: null,
  },
  {
    id: '8', company: 'NEOM Tech', jobTitle: 'Principal AI Engineer',
    matchScore: 4.9, status: 'offer', appliedAt: d(20),
    lastActivity: d(1), alertType: 'deadline',
    alertMessage: 'Decision deadline in 2 days',
    salaryOffer: 'AED 45,000/mo', offerDeadline: ahead(2),
  },
  {
    id: '9', company: 'Amazon MENA', jobTitle: 'Applied Scientist',
    matchScore: 3.5, status: 'rejected', appliedAt: d(15),
    lastActivity: d(7), alertType: null,
  },
  {
    id: '10', company: 'Noon', jobTitle: 'ML Platform Engineer',
    matchScore: 3.2, status: 'rejected', appliedAt: d(12),
    lastActivity: d(5), alertType: null,
  },
]
```

- [ ] **Step 4: Run tests**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/lib/applications.test.ts --no-coverage
```
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/applications.ts __tests__/lib/applications.test.ts
git commit -m "feat: application logic helpers — moveApplication, computeStats, color helpers, demo data"
```

---

## Task 3: ApplicationCard component

**Files:**
- Create: `src/components/applications/ApplicationCard.tsx`

- [ ] **Step 1: Create ApplicationCard**

```typescript
// src/components/applications/ApplicationCard.tsx
'use client'

import { Application } from '@/types/applications'
import { scoreColorClass, cardLeftBorderClass, timeSince } from '@/lib/applications'

interface ApplicationCardProps {
  application: Application
  onDragStart: (id: string) => void
}

export function ApplicationCard({ application, onDragStart }: ApplicationCardProps) {
  const initials = application.company
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      draggable
      onDragStart={() => onDragStart(application.id)}
      className={`bg-white border border-[#DCDFE8] border-l-4 ${cardLeftBorderClass(application.alertType, application.status)}
        rounded-[10px] p-3.5 cursor-grab active:cursor-grabbing select-none
        shadow-[0_2px_12px_rgba(151,155,192,0.12)] hover:shadow-[0_4px_20px_rgba(151,155,192,0.2)] transition-shadow`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4584FF] to-[#06123C] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-[#06123C] truncate">{application.company}</div>
          <div className="text-[10px] text-[#727998] truncate">{application.jobTitle}</div>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${scoreColorClass(application.matchScore)}`}>
          {application.matchScore.toFixed(1)}
        </span>
      </div>

      {/* Alert message */}
      {application.alertMessage && (
        <div className="text-[10px] text-[#FAA82C] font-semibold bg-[#FFF8EC] px-2 py-1 rounded-lg mb-2 leading-relaxed">
          {application.alertMessage}
        </div>
      )}

      {/* Offer banner */}
      {application.status === 'offer' && application.salaryOffer && (
        <div className="bg-[#E6FAF4] border border-[#03BA82]/20 rounded-lg px-2 py-1.5 mb-2">
          <div className="text-[11px] font-bold text-[#03BA82]">{application.salaryOffer}</div>
          {application.offerDeadline && (
            <div className="text-[9px] text-[#727998] mt-0.5">
              Deadline: {new Date(application.offerDeadline).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Last activity */}
      <div className="text-[9px] text-[#8D96B4]">{timeSince(application.lastActivity)}</div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx tsc --noEmit 2>&1 | grep "ApplicationCard" || echo "No errors in ApplicationCard"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/applications/ApplicationCard.tsx
git commit -m "feat: ApplicationCard — draggable kanban card with alert borders and offer banner"
```

---

## Task 4: KanbanColumn + AddApplicationModal

**Files:**
- Create: `src/components/applications/KanbanColumn.tsx`
- Create: `src/components/applications/AddApplicationModal.tsx`

- [ ] **Step 1: Create KanbanColumn**

```typescript
// src/components/applications/KanbanColumn.tsx
import { Application, ApplicationStatus } from '@/types/applications'
import { ApplicationCard } from './ApplicationCard'

interface KanbanColumnProps {
  status: ApplicationStatus
  label: string
  color: string
  headerBg: string
  applications: Application[]
  onDrop: (status: ApplicationStatus) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (id: string) => void
}

export function KanbanColumn({
  status, label, color, headerBg, applications,
  onDrop, onDragOver, onDragStart,
}: KanbanColumnProps) {
  return (
    <div
      className="flex flex-col w-[240px] flex-shrink-0 h-full"
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-[10px] mb-3 flex-shrink-0"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[11px] font-bold" style={{ color }}>{label}</span>
        </div>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {applications.length}
        </span>
      </div>

      {/* Cards */}
      <div
        className={`flex flex-col gap-2.5 flex-1 overflow-y-auto min-h-[80px] rounded-[10px] p-1
          ${status === 'rejected' ? 'opacity-65' : ''}`}
      >
        {applications.map(app => (
          <ApplicationCard key={app.id} application={app} onDragStart={onDragStart} />
        ))}

        {applications.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-[#DCDFE8] rounded-[10px] flex items-center justify-center">
            <span className="text-[10px] text-[#8D96B4]">Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create AddApplicationModal**

```typescript
// src/components/applications/AddApplicationModal.tsx
'use client'

import { useState } from 'react'
import type { Application, ApplicationStatus } from '@/types/applications'

interface AddApplicationModalProps {
  onAdd: (app: Omit<Application, 'id' | 'lastActivity'>) => void
  onClose: () => void
}

export function AddApplicationModal({ onAdd, onClose }: AddApplicationModalProps) {
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [matchScore, setMatchScore] = useState('4.0')
  const [status, setStatus] = useState<ApplicationStatus>('evaluated')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !jobTitle.trim()) return
    onAdd({
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      matchScore: Math.min(5, Math.max(0, parseFloat(matchScore) || 0)),
      status,
      alertType: null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-[10px] p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="text-[14px] font-extrabold text-[#06123C] mb-4">Add Application</div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="border border-[#DCDFE8] rounded-[10px] px-3 py-2 text-[12px] text-[#06123C] placeholder:text-[#8D96B4] outline-none focus:border-[#4584FF]"
            required
            autoFocus
          />
          <input
            type="text"
            placeholder="Job title"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            className="border border-[#DCDFE8] rounded-[10px] px-3 py-2 text-[12px] text-[#06123C] placeholder:text-[#8D96B4] outline-none focus:border-[#4584FF]"
            required
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-[#727998] mb-1 block">Match Score (0–5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={matchScore}
                onChange={e => setMatchScore(e.target.value)}
                className="w-full border border-[#DCDFE8] rounded-[10px] px-3 py-2 text-[12px] text-[#06123C] outline-none focus:border-[#4584FF]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-[#727998] mb-1 block">Stage</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ApplicationStatus)}
                className="w-full border border-[#DCDFE8] rounded-[10px] px-3 py-2 text-[12px] text-[#06123C] outline-none focus:border-[#4584FF] bg-white"
              >
                <option value="evaluated">Evaluated</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-[12px] text-[#727998] font-semibold px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#4584FF] text-white text-[12px] font-bold px-5 py-2 rounded-[14px]"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx tsc --noEmit 2>&1 | grep -E "(KanbanColumn|AddApplicationModal)" || echo "No errors in new components"
```

- [ ] **Step 4: Commit**

```bash
git add src/components/applications/KanbanColumn.tsx src/components/applications/AddApplicationModal.tsx
git commit -m "feat: KanbanColumn with drop zone and AddApplicationModal form"
```

---

## Task 5: ApplicationsPageClient + page wiring

**Files:**
- Create: `src/components/applications/ApplicationsPageClient.tsx`
- Modify: `src/app/(app)/applications/page.tsx`

- [ ] **Step 1: Create ApplicationsPageClient**

```typescript
// src/components/applications/ApplicationsPageClient.tsx
'use client'

import { useState } from 'react'
import { Application, ApplicationStatus } from '@/types/applications'
import { moveApplication, DEMO_APPLICATIONS, COLUMNS } from '@/lib/applications'
import { KanbanColumn } from './KanbanColumn'
import { AddApplicationModal } from './AddApplicationModal'
import { v4 as uuidv4 } from 'uuid'

export function ApplicationsPageClient() {
  const [applications, setApplications] = useState<Application[]>(DEMO_APPLICATIONS)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  function handleDragStart(id: string) {
    setDraggingId(id)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(status: ApplicationStatus) {
    if (!draggingId) return
    setApplications(prev => moveApplication(prev, draggingId, status))
    setDraggingId(null)
  }

  function handleAddApplication(app: Omit<Application, 'id' | 'lastActivity'>) {
    const newApp: Application = {
      ...app,
      id: uuidv4(),
      lastActivity: new Date().toISOString(),
    }
    setApplications(prev => [newApp, ...prev])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#06123C]">Applications</h1>
          <p className="text-[12px] text-[#727998] mt-0.5">
            {applications.length} applications · drag cards to update status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="border border-[#DCDFE8] text-[#727998] text-[12px] font-semibold px-4 py-2 rounded-[14px] hover:border-[#4584FF] hover:text-[#4584FF] transition-colors"
          >
            Pattern analysis
            <span className="ml-1.5 text-[9px] bg-[#F2F3F6] text-[#8D96B4] px-1.5 py-0.5 rounded-full font-bold">SOON</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#4584FF] text-white text-[12px] font-bold px-4 py-2 rounded-[14px]"
          >
            + Add application
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 px-7 pb-6 flex-1 overflow-x-auto">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            color={col.color}
            headerBg={col.headerBg}
            applications={applications.filter(a => a.status === col.status)}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      {showAddModal && (
        <AddApplicationModal
          onAdd={handleAddApplication}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update applications/page.tsx**

Read the file first, then replace entire content:

```typescript
// src/app/(app)/applications/page.tsx
import { ApplicationsPageClient } from '@/components/applications/ApplicationsPageClient'

export default function ApplicationsPage() {
  return <ApplicationsPageClient />
}
```

- [ ] **Step 3: Build check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npm run build 2>&1 | tail -10
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/applications/ApplicationsPageClient.tsx "src/app/(app)/applications/page.tsx"
git commit -m "feat: Applications kanban — 5-column drag-and-drop with demo data"
```

---

## Task 6: Dashboard StatCard + PipelineSummary

**Files:**
- Create: `src/components/dashboard/StatCard.tsx`
- Create: `src/components/dashboard/PipelineSummary.tsx`

- [ ] **Step 1: Create StatCard**

```typescript
// src/components/dashboard/StatCard.tsx
interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  valueColor?: string
}

export function StatCard({ label, value, subtitle, valueColor = '#06123C' }: StatCardProps) {
  return (
    <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)] flex flex-col gap-1">
      <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em]">{label}</div>
      <div className="text-[28px] font-extrabold leading-none" style={{ color: valueColor }}>{value}</div>
      {subtitle && <div className="text-[11px] text-[#727998]">{subtitle}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Create PipelineSummary**

```typescript
// src/components/dashboard/PipelineSummary.tsx
import type { ApplicationStatus } from '@/types/applications'
import { COLUMNS } from '@/lib/applications'

interface PipelineSummaryProps {
  pipelineCounts: Record<ApplicationStatus, number>
  total: number
}

export function PipelineSummary({ pipelineCounts, total }: PipelineSummaryProps) {
  return (
    <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
      <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-4">Pipeline</div>

      {/* Progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-4 gap-0.5">
        {COLUMNS.map(col => {
          const count = pipelineCounts[col.status]
          const pct = total > 0 ? (count / total) * 100 : 0
          if (pct === 0) return null
          return (
            <div
              key={col.status}
              className="h-full rounded-sm transition-all"
              style={{ width: `${pct}%`, backgroundColor: col.color }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {COLUMNS.map(col => (
          <div key={col.status} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
            <span className="text-[11px] text-[#727998]">{col.label}</span>
            <span className="text-[11px] font-bold text-[#06123C]">{pipelineCounts[col.status]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx tsc --noEmit 2>&1 | grep -E "(StatCard|PipelineSummary)" || echo "No errors in dashboard components"
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/StatCard.tsx src/components/dashboard/PipelineSummary.tsx
git commit -m "feat: Dashboard StatCard and PipelineSummary components"
```

---

## Task 7: Dashboard TopMatches + NextActions

**Files:**
- Create: `src/components/dashboard/TopMatches.tsx`
- Create: `src/components/dashboard/NextActions.tsx`

- [ ] **Step 1: Create TopMatches**

```typescript
// src/components/dashboard/TopMatches.tsx
interface TopMatch {
  company: string
  jobTitle: string
  location: string
  matchScore: number
  isNew?: boolean
}

interface TopMatchesProps {
  matches: TopMatch[]
}

const LOGO_COLORS: Record<string, string> = {
  NEOM: '#06123C', STC: '#00B14F', EMIR: '#D71921',
  CARE: '#00A651', TALA: '#FF6600', GEID: '#7B2D8B',
}

function logoColor(company: string): string {
  const key = company.slice(0, 4).toUpperCase()
  return LOGO_COLORS[key] ?? '#4584FF'
}

function scoreColor(score: number): string {
  if (score >= 4.0) return 'text-[#03BA82] bg-[#E6FAF4]'
  if (score >= 3.5) return 'text-[#FAA82C] bg-[#FFF8EC]'
  return 'text-[#F84E4E] bg-[#FFF0F0]'
}

export function TopMatches({ matches }: TopMatchesProps) {
  return (
    <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em]">Top Matches Today</div>
        <a href="/jobs" className="text-[11px] text-[#4584FF] font-semibold hover:underline">View all →</a>
      </div>
      <div className="flex flex-col gap-3">
        {matches.map((match, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: logoColor(match.company) }}
            >
              {match.company.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-[#06123C] truncate">{match.jobTitle}</div>
              <div className="text-[10px] text-[#727998]">{match.company} · {match.location}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {match.isNew && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#4584FF]" />
              )}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${scoreColor(match.matchScore)}`}>
                {match.matchScore.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create NextActions**

```typescript
// src/components/dashboard/NextActions.tsx
interface NextAction {
  label: string
  description: string
  type: 'follow-up' | 'interview' | 'offer' | 'apply'
  href?: string
}

interface NextActionsProps {
  actions: NextAction[]
}

const ACTION_COLORS: Record<NextAction['type'], { bg: string; text: string; dot: string }> = {
  'follow-up': { bg: '#FFF8EC', text: '#FAA82C', dot: '#FAA82C' },
  'interview':  { bg: '#ECF3FF', text: '#4584FF', dot: '#4584FF' },
  'offer':      { bg: '#E6FAF4', text: '#03BA82', dot: '#03BA82' },
  'apply':      { bg: '#F2F3F6', text: '#727998', dot: '#727998' },
}

export function NextActions({ actions }: NextActionsProps) {
  return (
    <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-5 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
      <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] mb-4">Next Actions</div>
      <div className="flex flex-col gap-2.5">
        {actions.map((action, i) => {
          const colors = ACTION_COLORS[action.type]
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-[10px] cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: colors.bg }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: colors.dot }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate" style={{ color: colors.text }}>{action.label}</div>
                <div className="text-[10px] text-[#727998] mt-0.5 leading-relaxed">{action.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx tsc --noEmit 2>&1 | grep -E "(TopMatches|NextActions)" || echo "No errors"
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/TopMatches.tsx src/components/dashboard/NextActions.tsx
git commit -m "feat: Dashboard TopMatches and NextActions components"
```

---

## Task 8: DashboardClient + page wiring + update root redirect

**Files:**
- Create: `src/components/dashboard/DashboardClient.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create DashboardClient**

```typescript
// src/components/dashboard/DashboardClient.tsx
'use client'

import { computeStats, DEMO_APPLICATIONS } from '@/lib/applications'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import type { SkillGapResult } from '@/types'
import { StatCard } from './StatCard'
import { PipelineSummary } from './PipelineSummary'
import { TopMatches } from './TopMatches'
import { NextActions } from './NextActions'

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

const NEXT_ACTIONS = [
  {
    label: 'Follow up with STC — LLM Engineer',
    description: 'No response in 8 days. Send a polite check-in.',
    type: 'follow-up' as const,
  },
  {
    label: 'Prepare for Emirates NBD interview',
    description: 'Technical interview tomorrow at 2pm. Review system design.',
    type: 'interview' as const,
  },
  {
    label: 'Review NEOM Tech offer',
    description: 'AED 45,000/mo offer. Decision deadline in 2 days.',
    type: 'offer' as const,
  },
]

export function DashboardClient() {
  const { sent, avgScore, pipelineCounts } = computeStats(DEMO_APPLICATIONS)
  const total = DEMO_APPLICATIONS.length

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#06123C]">Dashboard</h1>
          <p className="text-[12px] text-[#727998] mt-0.5">Good morning, Ahmed — here's your job search summary</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F2F3F6] px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[#03BA82] animate-pulse" />
          <span className="text-[11px] text-[#727998] font-semibold">Agents active</span>
        </div>
      </div>

      <div className="px-7 pb-6 flex flex-col gap-5">
        {/* Stat cards row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Job Matches" value="12" subtitle="3 new today" valueColor="#4584FF" />
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
            <NextActions actions={NEXT_ACTIONS} />
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

- [ ] **Step 2: Update dashboard/page.tsx**

Read the file, then replace entire content:

```typescript
// src/app/(app)/dashboard/page.tsx
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default function DashboardPage() {
  return <DashboardClient />
}
```

- [ ] **Step 3: Update root redirect to /dashboard**

Read `src/app/page.tsx`, then replace entire content:

```typescript
// src/app/page.tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
```

- [ ] **Step 4: Build check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npm run build 2>&1 | tail -15
```
Expected: Build succeeds with no TypeScript errors in new files.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/DashboardClient.tsx \
        "src/app/(app)/dashboard/page.tsx" \
        src/app/page.tsx
git commit -m "feat: Dashboard — stat cards, pipeline summary, top matches, next actions, skill radar"
```

---

## Task 9: Full test suite + build check

- [ ] **Step 1: Run all tests**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest --no-coverage 2>&1 | tail -20
```
Expected: All Plan 1 + Plan 2 tests still pass + 12 new Plan 3 tests pass. Zero regressions.

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -10
```
Expected: Successful build.

- [ ] **Step 3: Commit (if uncommitted changes)**

```bash
git status
# If uncommitted changes exist:
git add -A
git commit -m "feat: Plan 3 complete — Applications kanban and Dashboard"
```

---

## Self-Review

**Spec coverage check (against `docs/superpowers/specs/2026-04-16-app-revamp-design.md`):**

**Section 3.4 Applications:**
- ✅ 5 kanban columns (Evaluated/Applied/Interview/Offer/Rejected) — Task 4 (KanbanColumn) + Task 5 (COLUMNS config)
- ✅ Column colors (gray/blue/amber/green/red faded) — Task 2 (COLUMNS in applications.ts)
- ✅ Application card: company logo, title, match score, status chips, time since last update — Task 3 (ApplicationCard)
- ✅ Amber left border = agent-flagged urgent — Task 2 (cardLeftBorderClass)
- ✅ Blue left border = active interview — Task 2 (cardLeftBorderClass)
- ✅ Agent alerts on card — Task 3 (alertMessage display)
- ✅ Offer card = green border + offer banner with salary + deadline — Task 3
- ✅ Pattern analysis button (Coming Soon badge) — Task 5 (ApplicationsPageClient)
- ✅ Add application button — Task 4 (AddApplicationModal) + Task 5
- ✅ Cards draggable between columns — Task 5 (HTML5 drag-and-drop)
- ✅ Rejected column 65% opacity — Task 4 (KanbanColumn)

**Section 3.2 Dashboard:**
- ✅ 4 stat cards (Job Matches, Applications Sent, Profile Readiness, Avg Match Score) — Task 6 + Task 8
- ✅ Agent status pill (top right) — Task 8 (DashboardClient)
- ✅ Top Matches Today (3 highest-scoring new jobs) — Task 7 + Task 8
- ✅ Pipeline Summary (count per kanban stage) — Task 6 + Task 8
- ✅ Skill Radar Chart (existing component reused) — Task 8
- ✅ Next Actions (3 agent-suggested tasks) — Task 7 + Task 8

**Not in this plan (by design):**
- Auto status update from email — Plan 5 (background agents)
- Real autonomous job scanner surfacing new count — Plan 5
- Pattern analysis agent — Plan 5
