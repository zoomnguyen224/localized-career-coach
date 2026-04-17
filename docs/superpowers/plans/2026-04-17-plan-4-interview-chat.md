# Plan 4: Interview Prep + Chat Sidebar

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Interview Prep page (session list, practice loop with real AI evaluation, STAR stories, company intel) and the Chat Sidebar drawer (wired to existing SSE chat API, opens from the FAB button).

**Architecture:** Interview Prep is a client-only page with demo data from `src/lib/interview.ts`. The practice loop calls two new API routes (`/api/interview/question` and `/api/interview/evaluate`) that use the Anthropic SDK directly. The Chat Drawer is a slide-in panel managed by a new `AppLayoutClient` wrapper that lifts `isChatOpen` state out of the server layout. The existing `/api/chat` SSE endpoint is reused as-is.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, Anthropic SDK (`@anthropic-ai/sdk`), lucide-react icons, uuid@9

---

## File Map

**New files — types:**
- `src/types/interview.ts` — `QuestionType`, `InterviewSession`, `PracticeQuestion`, `AnswerResult`, `StarStory`, `CompanyProcess`

**New files — library (testable):**
- `src/lib/interview.ts` — `getInterviewSessions`, `DEMO_SESSIONS`, `DEMO_QUESTIONS`, `DEMO_STAR_STORIES`, `DEMO_COMPANY_PROCESS`

**New files — API routes:**
- `src/app/api/interview/question/route.ts` — POST `{company, role, questionType}` → AI-generated question JSON
- `src/app/api/interview/evaluate/route.ts` — POST `{company, role, question, answer}` → AI evaluation JSON

**New files — interview UI:**
- `src/components/interview/CompanyIntelBanner.tsx` — dark navy banner (rounds, duration, offer rate, language)
- `src/components/interview/PracticeTab.tsx` — 3-state practice loop (idle → question → result)
- `src/components/interview/StarStoriesTab.tsx` — STAR story bank cards
- `src/components/interview/IntelTab.tsx` — structured company intel cards
- `src/components/interview/InterviewSessionPanel.tsx` — tabs + banner for active session
- `src/components/interview/InterviewPageClient.tsx` — left session list + right panel

**New files — chat sidebar:**
- `src/components/layout/ChatDrawer.tsx` — slide-in drawer with custom SSE chat client
- `src/components/layout/AppLayoutClient.tsx` — client wrapper that manages `isChatOpen` state

**Modified files:**
- `src/app/(app)/interview/page.tsx` — replace stub with `<InterviewPageClient />`
- `src/app/(app)/layout.tsx` — use `<AppLayoutClient>` instead of inline div
- `src/components/layout/AppSidebar.tsx` — add `onOpenChat` prop, wire FAB onClick
- `src/types/index.ts` — add `export * from './interview'`

**New files — tests:**
- `__tests__/lib/interview.test.ts`

---

## Task 1: Interview types

**Files:**
- Create: `src/types/interview.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create src/types/interview.ts**

```typescript
// src/types/interview.ts

export type QuestionType = 'behavioral' | 'technical' | 'system-design' | 'culture'

export interface InterviewSession {
  id: string
  company: string
  role: string
  appliedAt?: string       // ISO string
  alertMessage?: string
}

export interface PracticeQuestion {
  id: string
  company: string
  role: string
  questionType: QuestionType
  text: string
  evaluationCriteria: string[]
  source?: string
}

export interface AnswerResult {
  score: number            // 0–10
  verdict: string          // "Excellent Answer" | "Strong Answer" | "Good Start" | "Needs Work"
  strengths: string[]
  improvements: string[]
  modelAnswer: string
}

export interface StarStory {
  id: string
  title: string
  tags: string[]
  situation: string
  task: string
  action: string
  result: string
}

export interface CompanyProcess {
  rounds: number
  duration: string         // e.g. "3–4 weeks"
  offerRate: string        // e.g. "12%"
  language: string         // e.g. "English" | "English / Arabic"
}
```

- [ ] **Step 2: Export from index**

Read `src/types/index.ts`, then add at the bottom:

```typescript
export * from './interview'
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
git add src/types/interview.ts src/types/index.ts
git commit -m "feat: add Interview types (InterviewSession, PracticeQuestion, AnswerResult, StarStory)"
```

---

## Task 2: Interview library + TDD

**Files:**
- Create: `src/lib/interview.ts`
- Create: `__tests__/lib/interview.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/lib/interview.test.ts
import { getInterviewSessions } from '@/lib/interview'
import type { Application } from '@/types/applications'

const makeApp = (overrides: Partial<Application> = {}): Application => ({
  id: '1',
  company: 'Test Co',
  jobTitle: 'Engineer',
  matchScore: 4.0,
  status: 'applied',
  lastActivity: new Date().toISOString(),
  alertType: null,
  ...overrides,
})

describe('getInterviewSessions', () => {
  it('returns only applications with status interview', () => {
    const apps = [
      makeApp({ id: '1', status: 'interview' }),
      makeApp({ id: '2', status: 'applied' }),
      makeApp({ id: '3', status: 'interview' }),
    ]
    expect(getInterviewSessions(apps)).toHaveLength(2)
  })

  it('maps to InterviewSession shape with correct fields', () => {
    const apps = [
      makeApp({
        id: '6',
        company: 'Emirates NBD',
        jobTitle: 'Head of AI',
        status: 'interview',
        appliedAt: '2024-01-01T00:00:00.000Z',
        alertMessage: 'Interview tomorrow',
      }),
    ]
    const sessions = getInterviewSessions(apps)
    expect(sessions[0]).toMatchObject({
      id: '6',
      company: 'Emirates NBD',
      role: 'Head of AI',
      appliedAt: '2024-01-01T00:00:00.000Z',
      alertMessage: 'Interview tomorrow',
    })
  })

  it('returns empty array when no interview applications', () => {
    const apps = [
      makeApp({ status: 'applied' }),
      makeApp({ status: 'rejected' }),
      makeApp({ status: 'evaluated' }),
    ]
    expect(getInterviewSessions(apps)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/lib/interview.test.ts --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '@/lib/interview'`

- [ ] **Step 3: Implement src/lib/interview.ts**

```typescript
// src/lib/interview.ts
import type { Application } from '@/types/applications'
import type { InterviewSession, PracticeQuestion, StarStory, CompanyProcess } from '@/types/interview'
import { DEMO_APPLICATIONS } from '@/lib/applications'

// ─── Pure helpers ───────────────────────────────────────────────

export function getInterviewSessions(applications: Application[]): InterviewSession[] {
  return applications
    .filter(a => a.status === 'interview')
    .map(a => ({
      id: a.id,
      company: a.company,
      role: a.jobTitle,
      appliedAt: a.appliedAt,
      alertMessage: a.alertMessage,
    }))
}

// ─── Demo sessions ───────────────────────────────────────────────

export const DEMO_SESSIONS: InterviewSession[] = getInterviewSessions(DEMO_APPLICATIONS)

// ─── Demo questions (pre-loaded, no API call needed for first batch) ─────────

export const DEMO_QUESTIONS: Record<string, PracticeQuestion[]> = {
  'Emirates NBD': [
    {
      id: 'q1',
      company: 'Emirates NBD',
      role: 'Head of AI',
      questionType: 'behavioral',
      text: 'Tell me about a time you had to align multiple stakeholders on an AI strategy that faced internal resistance.',
      evaluationCriteria: ['Stakeholder influence', 'Conflict resolution', 'Business outcome'],
      source: 'Glassdoor 2024',
    },
    {
      id: 'q2',
      company: 'Emirates NBD',
      role: 'Head of AI',
      questionType: 'technical',
      text: 'How would you design an LLM-powered fraud detection system for a large regional bank? Walk me through your architecture.',
      evaluationCriteria: ['System design depth', 'Security awareness', 'Regulatory compliance (CBUAE)'],
      source: 'Technical screening 2024',
    },
    {
      id: 'q3',
      company: 'Emirates NBD',
      role: 'Head of AI',
      questionType: 'system-design',
      text: 'Design a real-time Arabic NLP pipeline that processes customer service chats across UAE and Saudi dialects.',
      evaluationCriteria: ['Dialect awareness', 'Latency/scale thinking', 'Practical tradeoffs'],
      source: 'Engineering interview 2024',
    },
  ],
  'Anghami': [
    {
      id: 'q4',
      company: 'Anghami',
      role: 'AI Product Lead',
      questionType: 'behavioral',
      text: 'Describe how you would prioritize AI features for a consumer music app with 100M users across MENA.',
      evaluationCriteria: ['Product thinking', 'Data-driven prioritization', 'User empathy'],
      source: 'Product interview 2024',
    },
    {
      id: 'q5',
      company: 'Anghami',
      role: 'AI Product Lead',
      questionType: 'culture',
      text: 'How do you stay current with AI developments while also shipping product? What\'s your learning system?',
      evaluationCriteria: ['Continuous learning', 'Practical application', 'Self-awareness'],
      source: 'Culture fit 2024',
    },
  ],
}

// ─── Demo STAR stories ───────────────────────────────────────────

export const DEMO_STAR_STORIES: StarStory[] = [
  {
    id: 's1',
    title: 'Led AI platform migration at scale',
    tags: ['Leadership', 'AI/ML', 'System Design'],
    situation: 'Inherited a legacy ML system with 40% prediction accuracy serving 2M users daily.',
    task: 'Needed to redesign the platform using modern LLM-based architecture without service downtime.',
    action: 'Led a 6-person cross-functional team, built a shadow system in parallel, ran A/B tests over 8 weeks with gradual traffic shifting.',
    result: 'Accuracy improved to 87%, inference latency reduced by 60%, zero-downtime migration completed under budget.',
  },
  {
    id: 's2',
    title: 'Aligned resistant executive stakeholder',
    tags: ['Communication', 'Influence', 'Change Management'],
    situation: 'VP of Operations was blocking an AI automation initiative citing employee displacement concerns.',
    task: 'Needed executive sign-off to automate a manual data pipeline that cost $2M/year to operate.',
    action: 'Arranged 1:1, presented a reskilling plan alongside ROI projections, co-designed the rollout plan with their team, invited them to the pilot launch.',
    result: 'Secured buy-in in 2 weeks. Initiative delivered $2M annual savings, affected team moved into higher-value QA and oversight roles.',
  },
  {
    id: 's3',
    title: 'Shipped multilingual NLP product in 6 weeks',
    tags: ['Execution', 'Arabic NLP', 'Cross-functional'],
    situation: 'Business unit needed an Arabic sentiment analysis tool for social media monitoring before Ramadan campaign.',
    task: 'Build and ship an end-to-end tool with a hard 6-week deadline and no existing Arabic NLP infrastructure.',
    action: 'Selected AraBERT fine-tuned on Egyptian/Gulf dialect corpus, built a lightweight Flask API, embedded directly into Tableau dashboards the marketing team already used.',
    result: 'Shipped day 40 of 42, accuracy 82% on dialect validation set. Used by 3 teams and expanded to 4 more countries the following quarter.',
  },
]

// ─── Per-company interview process (for CompanyIntelBanner) ─────────────────

export const DEMO_COMPANY_PROCESS: Record<string, CompanyProcess> = {
  'Emirates NBD': { rounds: 4, duration: '3–4 weeks', offerRate: '12%', language: 'English' },
  'Anghami': { rounds: 3, duration: '2–3 weeks', offerRate: '18%', language: 'English / Arabic' },
}
```

- [ ] **Step 4: Run tests**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/lib/interview.test.ts --no-coverage 2>&1 | tail -10
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/interview.ts __tests__/lib/interview.test.ts
git commit -m "feat: interview library — getInterviewSessions, demo questions, STAR stories, company process data"
```

---

## Task 3: Interview API routes

**Files:**
- Create: `src/app/api/interview/question/route.ts`
- Create: `src/app/api/interview/evaluate/route.ts`

- [ ] **Step 1: Create question route**

```typescript
// src/app/api/interview/question/route.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: Request) {
  let body: { company: string; role: string; questionType?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { company, role, questionType = 'behavioral' } = body
  if (!company || !role) {
    return Response.json({ error: 'company and role are required' }, { status: 400 })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Generate one ${questionType} interview question for a ${role} position at ${company} in the MENA region.

Return JSON only (no markdown, no code fence):
{
  "question": "the interview question text",
  "type": "${questionType}",
  "evaluationCriteria": ["criterion 1", "criterion 2", "criterion 3"],
  "source": "AI generated for ${company}"
}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    return Response.json(JSON.parse(text))
  } catch {
    return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create evaluate route**

```typescript
// src/app/api/interview/evaluate/route.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: Request) {
  let body: { company: string; role: string; question: string; answer: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { company, role, question, answer } = body
  if (!company || !role || !question || !answer) {
    return Response.json({ error: 'company, role, question, and answer are required' }, { status: 400 })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert interviewer evaluating a candidate for a ${role} position at ${company} in the MENA region.

Question asked: ${question}

Candidate's answer: ${answer}

Evaluate this answer honestly. Return JSON only (no markdown, no code fence):
{
  "score": <integer 0-10>,
  "verdict": "<one of: Excellent Answer | Strong Answer | Good Start | Needs Work>",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "modelAnswer": "A concise 2-3 sentence model answer showing what an ideal response looks like."
}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    const parsed = JSON.parse(text)
    parsed.score = Math.min(10, Math.max(0, Number(parsed.score) || 0))
    return Response.json(parsed)
  } catch {
    return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx tsc --noEmit 2>&1 | grep -E "(interview/question|interview/evaluate)" | head -10
```

No errors expected in new files.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/interview/question/route.ts" "src/app/api/interview/evaluate/route.ts"
git commit -m "feat: interview API routes — question generation and answer evaluation"
```

---

## Task 4: CompanyIntelBanner + PracticeTab

**Files:**
- Create: `src/components/interview/CompanyIntelBanner.tsx`
- Create: `src/components/interview/PracticeTab.tsx`

- [ ] **Step 1: Create CompanyIntelBanner**

```typescript
// src/components/interview/CompanyIntelBanner.tsx
import type { CompanyProcess } from '@/types/interview'

interface CompanyIntelBannerProps {
  company: string
  role: string
  process?: CompanyProcess
}

export function CompanyIntelBanner({ company, role, process }: CompanyIntelBannerProps) {
  const stats = [
    { label: 'Rounds', value: process ? `${process.rounds}` : '—' },
    { label: 'Duration', value: process?.duration ?? '—' },
    { label: 'Offer Rate', value: process?.offerRate ?? '—' },
    { label: 'Language', value: process?.language ?? '—' },
  ]

  return (
    <div className="bg-[#06123C] rounded-[10px] p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#4584FF]/20 flex items-center justify-center text-[11px] font-bold text-white">
          {company.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-[13px] font-extrabold text-white">{company}</div>
          <div className="text-[10px] text-[#8D96B4]">{role}</div>
        </div>
        <div className="ml-auto bg-[#4584FF]/20 px-2 py-1 rounded-full">
          <span className="text-[9px] font-bold text-[#4584FF]">MENA Intel</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white/5 rounded-lg px-2.5 py-2">
            <div className="text-[9px] text-[#8D96B4] font-semibold uppercase tracking-wide">{stat.label}</div>
            <div className="text-[11px] font-bold text-white mt-0.5">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create PracticeTab**

```typescript
// src/components/interview/PracticeTab.tsx
'use client'

import { useState } from 'react'
import type { InterviewSession, PracticeQuestion, AnswerResult } from '@/types/interview'

interface PracticeTabProps {
  session: InterviewSession
  demoQuestions: PracticeQuestion[]
}

type PracticePhase =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'question'; question: PracticeQuestion; answer: string }
  | { phase: 'evaluating'; question: PracticeQuestion; answer: string }
  | { phase: 'result'; question: PracticeQuestion; result: AnswerResult }

const TYPE_COLORS: Record<string, string> = {
  behavioral: 'bg-[#ECF3FF] text-[#4584FF]',
  technical: 'bg-[#E6FAF4] text-[#03BA82]',
  'system-design': 'bg-[#FFF8EC] text-[#FAA82C]',
  culture: 'bg-[#F2F3F6] text-[#727998]',
}

const VERDICT_COLORS: Record<string, string> = {
  'Excellent Answer': '#03BA82',
  'Strong Answer': '#4584FF',
  'Good Start': '#FAA82C',
  'Needs Work': '#F84E4E',
}

export function PracticeTab({ session, demoQuestions }: PracticeTabProps) {
  const [state, setState] = useState<PracticePhase>({ phase: 'idle' })
  const [demoIndex, setDemoIndex] = useState(0)

  async function loadQuestion() {
    setState({ phase: 'loading' })
    if (demoIndex < demoQuestions.length) {
      const q = demoQuestions[demoIndex]
      setDemoIndex(i => i + 1)
      setState({ phase: 'question', question: q, answer: '' })
    } else {
      try {
        const res = await fetch('/api/interview/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: session.company, role: session.role, questionType: 'behavioral' }),
        })
        const q = await res.json()
        setState({ phase: 'question', question: { ...q, id: String(Date.now()) }, answer: '' })
      } catch {
        setState({ phase: 'idle' })
      }
    }
  }

  async function submitAnswer() {
    if (state.phase !== 'question' || !state.answer.trim()) return
    const { question, answer } = state
    setState({ phase: 'evaluating', question, answer })
    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: session.company, role: session.role, question: question.text, answer }),
      })
      const result = await res.json()
      setState({ phase: 'result', question, result })
    } catch {
      setState({ phase: 'question', question, answer })
    }
  }

  if (state.phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="text-3xl">🎯</div>
        <div className="text-[13px] font-bold text-[#06123C]">Ready to practice?</div>
        <div className="text-[11px] text-[#727998] text-center max-w-[240px]">
          Questions sourced from real candidates at {session.company}. Your answers are evaluated by AI.
        </div>
        <button
          onClick={loadQuestion}
          className="bg-[#4584FF] text-white text-[12px] font-bold px-6 py-2.5 rounded-[14px]"
        >
          Start Practice
        </button>
      </div>
    )
  }

  if (state.phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-[12px] text-[#727998] animate-pulse">Loading question…</div>
      </div>
    )
  }

  if (state.phase === 'evaluating') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-[12px] text-[#727998] animate-pulse">Evaluating your answer…</div>
      </div>
    )
  }

  if (state.phase === 'question') {
    const { question, answer } = state
    return (
      <div className="flex flex-col gap-4">
        {/* Question card */}
        <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-4 shadow-[0_5px_60px_rgba(151,155,192,0.2)]">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${TYPE_COLORS[question.questionType] ?? 'bg-[#F2F3F6] text-[#727998]'}`}>
              {question.questionType.charAt(0).toUpperCase() + question.questionType.slice(1)}
            </span>
            {question.source && (
              <span className="text-[9px] text-[#8D96B4]">{question.source}</span>
            )}
          </div>
          <p className="text-[13px] font-semibold text-[#06123C] leading-relaxed mb-3">{question.text}</p>
          <div className="flex flex-wrap gap-1.5">
            {question.evaluationCriteria.map(c => (
              <span key={c} className="text-[9px] text-[#727998] bg-[#F2F3F6] px-2 py-0.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>

        {/* Answer textarea */}
        <textarea
          value={answer}
          onChange={e => setState({ ...state, answer: e.target.value })}
          placeholder="Type your answer here… Use the STAR framework: Situation → Task → Action → Result"
          rows={6}
          className="border border-[#DCDFE8] rounded-[10px] px-3 py-2.5 text-[12px] text-[#06123C] placeholder:text-[#8D96B4] outline-none focus:border-[#4584FF] resize-none leading-relaxed"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={submitAnswer}
            disabled={!answer.trim()}
            className="bg-[#4584FF] text-white text-[12px] font-bold px-5 py-2 rounded-[14px] disabled:opacity-40"
          >
            Submit Answer
          </button>
          <button
            onClick={loadQuestion}
            className="border border-[#DCDFE8] text-[#727998] text-[12px] font-semibold px-4 py-2 rounded-[14px] hover:border-[#4584FF] hover:text-[#4584FF] transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    )
  }

  // result phase
  const { result, question } = state
  const verdictColor = VERDICT_COLORS[result.verdict] ?? '#727998'
  const scorePercent = (result.score / 10) * 100

  return (
    <div className="flex flex-col gap-4">
      {/* Score + verdict */}
      <div className="bg-white border border-[#DCDFE8] rounded-[10px] p-4 shadow-[0_5px_60px_rgba(151,155,192,0.2)] flex items-center gap-4">
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#F2F3F6" strokeWidth="5" />
            <circle
              cx="28" cy="28" r="22" fill="none"
              stroke={verdictColor} strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - scorePercent / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[14px] font-extrabold text-[#06123C]">{result.score}</span>
          </div>
        </div>
        <div>
          <div className="text-[14px] font-extrabold" style={{ color: verdictColor }}>{result.verdict}</div>
          <div className="text-[10px] text-[#727998] mt-0.5">{question.text.slice(0, 60)}…</div>
        </div>
      </div>

      {/* Strengths + Improvements */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#E6FAF4] rounded-[10px] p-3">
          <div className="text-[10px] font-bold text-[#03BA82] mb-2 uppercase tracking-wide">Strengths</div>
          {result.strengths.map((s, i) => (
            <div key={i} className="text-[11px] text-[#06123C] leading-relaxed mb-1">✓ {s}</div>
          ))}
        </div>
        <div className="bg-[#FFF8EC] rounded-[10px] p-3">
          <div className="text-[10px] font-bold text-[#FAA82C] mb-2 uppercase tracking-wide">Improve</div>
          {result.improvements.map((s, i) => (
            <div key={i} className="text-[11px] text-[#06123C] leading-relaxed mb-1">→ {s}</div>
          ))}
        </div>
      </div>

      {/* Model answer */}
      <div className="bg-[#F2F3F6] rounded-[10px] p-3">
        <div className="text-[10px] font-bold text-[#727998] mb-2 uppercase tracking-wide">Model Answer</div>
        <div className="text-[11px] text-[#06123C] leading-relaxed">{result.modelAnswer}</div>
      </div>

      {/* Next question */}
      <button
        onClick={loadQuestion}
        className="bg-[#4584FF] text-white text-[12px] font-bold px-5 py-2.5 rounded-[14px] self-start"
      >
        Next Question →
      </button>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx tsc --noEmit 2>&1 | grep -E "(CompanyIntelBanner|PracticeTab)" | head -10
```

Fix any errors. Pre-existing errors are OK.

- [ ] **Step 4: Commit**

```bash
git add src/components/interview/CompanyIntelBanner.tsx src/components/interview/PracticeTab.tsx
git commit -m "feat: CompanyIntelBanner and PracticeTab with 3-state practice loop"
```

---

## Task 5: StarStoriesTab + IntelTab + InterviewSessionPanel

**Files:**
- Create: `src/components/interview/StarStoriesTab.tsx`
- Create: `src/components/interview/IntelTab.tsx`
- Create: `src/components/interview/InterviewSessionPanel.tsx`

- [ ] **Step 1: Create StarStoriesTab**

```typescript
// src/components/interview/StarStoriesTab.tsx
'use client'

import { useState } from 'react'
import type { StarStory } from '@/types/interview'

interface StarStoriesTabProps {
  stories: StarStory[]
}

export function StarStoriesTab({ stories }: StarStoriesTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <div className="text-2xl">📖</div>
        <div className="text-[12px] text-[#727998]">No STAR stories yet</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {stories.map(story => (
        <div
          key={story.id}
          className="bg-white border border-[#DCDFE8] rounded-[10px] overflow-hidden shadow-[0_2px_12px_rgba(151,155,192,0.1)]"
        >
          <button
            onClick={() => setExpanded(prev => prev === story.id ? null : story.id)}
            className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
          >
            <div>
              <div className="text-[12px] font-bold text-[#06123C]">{story.title}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {story.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-semibold text-[#4584FF] bg-[#ECF3FF] px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
            <span className="text-[#727998] text-[14px] flex-shrink-0 mt-0.5">
              {expanded === story.id ? '▲' : '▼'}
            </span>
          </button>

          {expanded === story.id && (
            <div className="px-4 pb-4 border-t border-[#F2F3F6] pt-3 flex flex-col gap-2.5">
              {(['situation', 'task', 'action', 'result'] as const).map(key => (
                <div key={key}>
                  <div className="text-[9px] font-bold text-[#8D96B4] uppercase tracking-wide mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                  <div className="text-[11px] text-[#06123C] leading-relaxed">{story[key]}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create IntelTab**

```typescript
// src/components/interview/IntelTab.tsx
interface IntelSection {
  title: string
  content: string
  icon: string
}

interface IntelTabProps {
  company: string
}

const COMPANY_INTEL: Record<string, IntelSection[]> = {
  'Emirates NBD': [
    { icon: '🤖', title: 'AI Strategy', content: 'Building a comprehensive AI platform to transform retail banking. Key focus: Arabic NLP for customer service, fraud detection ML, and generative AI for wealth management advisors. Partnered with Google Cloud and Microsoft Azure.' },
    { icon: '🏗️', title: 'Tech Stack', content: 'Predominantly Java/Spring backend, Python ML pipelines, Azure ML platform. Moving to microservices. Engineering teams in Dubai, Cairo, and Bengaluru.' },
    { icon: '🎯', title: 'Hiring Bar', content: 'Strong preference for candidates with banking/fintech experience. Arabic language skills valued but not required. Expect deep system design questions and regulatory compliance awareness (CBUAE, DFSA).' },
    { icon: '📈', title: 'Growth Signals', content: 'AED 2.5B tech transformation budget 2024–2026. Expanding AI Center of Excellence from 30 to 120 engineers. Preparing for ADGM regulatory sandbox participation.' },
    { icon: '⚠️', title: 'Likely Challenges', content: 'Legacy core banking system (Temenos T24) creates integration friction. Strong risk/compliance culture can slow AI deployment cycles. Expect approvals process to be a regular topic in interviews.' },
    { icon: '🌍', title: 'Culture', content: 'Conservative-professional culture. Business Arabic used internally in senior meetings, English at team level. Long tenures common (5+ years). Formal titles and hierarchy respected.' },
  ],
  'Anghami': [
    { icon: '🤖', title: 'AI Strategy', content: 'Personalization at the core — recommendation systems, playlist generation, content discovery. Exploring Arabic lyric generation and regional artist discovery via ML. Small but fast-moving AI team.' },
    { icon: '🏗️', title: 'Tech Stack', content: 'React Native mobile, Node.js/Python backend, AWS infrastructure. Recommendation engine uses collaborative filtering + content embeddings. PostgreSQL + Redis + Kafka.' },
    { icon: '🎯', title: 'Hiring Bar', content: 'Strong product sense expected for PM/product roles. Engineers: Python proficiency, ML systems experience, comfort with ambiguity. Move fast culture — expect questions about how you handle rapid context switching.' },
    { icon: '📈', title: 'Growth Signals', content: 'Post-merger integration with Rotana Music creates MENA\'s largest music catalog. Expanding into podcasts and live audio. Ramadan content campaigns have 2-3x traffic spikes — platform scale matters.' },
    { icon: '⚠️', title: 'Likely Challenges', content: 'Smaller team means high ownership per person. Arabic content rights landscape is complex. Compete with Spotify/Apple Music with limited brand budget — scrappy execution is the culture.' },
    { icon: '🌍', title: 'Culture', content: 'Startup energy inside a scaled company. Flat-ish hierarchy, direct communication. Mix of Beirut, Dubai, Cairo offices. Arabic-English bilingual team. Young team, fast promotions for high performers.' },
  ],
}

const DEFAULT_INTEL: IntelSection[] = [
  { icon: '🤖', title: 'AI Strategy', content: 'Research in progress. Ask your agent to run a deep company research for the latest AI initiatives.' },
  { icon: '🏗️', title: 'Tech Stack', content: 'Details not yet available. Check the company engineering blog or LinkedIn for recent posts.' },
  { icon: '🎯', title: 'Hiring Bar', content: 'No specific intel available. Prepare standard system design and behavioral questions.' },
]

export function IntelTab({ company }: IntelTabProps) {
  const sections = COMPANY_INTEL[company] ?? DEFAULT_INTEL

  return (
    <div className="flex flex-col gap-3">
      {sections.map(section => (
        <div
          key={section.title}
          className="bg-white border border-[#DCDFE8] rounded-[10px] p-4 shadow-[0_2px_12px_rgba(151,155,192,0.08)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px]">{section.icon}</span>
            <span className="text-[11px] font-bold text-[#06123C]">{section.title}</span>
          </div>
          <p className="text-[11px] text-[#727998] leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create InterviewSessionPanel**

```typescript
// src/components/interview/InterviewSessionPanel.tsx
'use client'

import { useState } from 'react'
import type { InterviewSession, PracticeQuestion, StarStory } from '@/types/interview'
import type { CompanyProcess } from '@/types/interview'
import { CompanyIntelBanner } from './CompanyIntelBanner'
import { PracticeTab } from './PracticeTab'
import { StarStoriesTab } from './StarStoriesTab'
import { IntelTab } from './IntelTab'

type Tab = 'practice' | 'stories' | 'intel'

interface InterviewSessionPanelProps {
  session: InterviewSession | null
  demoQuestions: PracticeQuestion[]
  starStories: StarStory[]
  process?: CompanyProcess
}

export function InterviewSessionPanel({
  session,
  demoQuestions,
  starStories,
  process,
}: InterviewSessionPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('practice')

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
        <div className="text-4xl">🎯</div>
        <div className="text-[14px] font-bold text-[#06123C]">Select an interview to prepare</div>
        <div className="text-[12px] text-[#727998]">Choose a company from your upcoming interviews</div>
      </div>
    )
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'practice', label: 'Practice' },
    { id: 'stories', label: 'STAR Stories' },
    { id: 'intel', label: 'Company Intel' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5">
      <CompanyIntelBanner company={session.company} role={session.role} process={process} />

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F2F3F6] rounded-[10px] p-1 mb-5 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-[11px] font-bold py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-[#4584FF] shadow-sm'
                : 'text-[#727998] hover:text-[#06123C]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'practice' && (
        <PracticeTab session={session} demoQuestions={demoQuestions} />
      )}
      {activeTab === 'stories' && (
        <StarStoriesTab stories={starStories} />
      )}
      {activeTab === 'intel' && (
        <IntelTab company={session.company} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx tsc --noEmit 2>&1 | grep -E "(StarStoriesTab|IntelTab|InterviewSessionPanel)" | head -10
```

Fix any errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/interview/StarStoriesTab.tsx src/components/interview/IntelTab.tsx src/components/interview/InterviewSessionPanel.tsx
git commit -m "feat: StarStoriesTab, IntelTab, InterviewSessionPanel with tabs"
```

---

## Task 6: InterviewPageClient + page.tsx

**Files:**
- Create: `src/components/interview/InterviewPageClient.tsx`
- Modify: `src/app/(app)/interview/page.tsx`

- [ ] **Step 1: Create InterviewPageClient**

```typescript
// src/components/interview/InterviewPageClient.tsx
'use client'

import { useState } from 'react'
import type { InterviewSession } from '@/types/interview'
import { DEMO_SESSIONS, DEMO_QUESTIONS, DEMO_STAR_STORIES, DEMO_COMPANY_PROCESS } from '@/lib/interview'
import { InterviewSessionPanel } from './InterviewSessionPanel'

export function InterviewPageClient() {
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(
    DEMO_SESSIONS[0] ?? null
  )

  return (
    <div className="flex h-full">
      {/* Left column — session list */}
      <div className="w-[280px] flex-shrink-0 border-r border-[#DCDFE8] flex flex-col">
        <div className="px-5 pt-6 pb-4 border-b border-[#DCDFE8] flex-shrink-0">
          <h1 className="text-[15px] font-extrabold text-[#06123C]">Interview Prep</h1>
          <p className="text-[11px] text-[#727998] mt-0.5">{DEMO_SESSIONS.length} upcoming</p>
        </div>

        {/* Upcoming interviews */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="text-[9px] font-bold text-[#8D96B4] uppercase tracking-wide px-2 mb-2">Upcoming</div>
          {DEMO_SESSIONS.map(session => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={`w-full text-left px-3 py-3 rounded-[10px] mb-1.5 transition-colors ${
                activeSession?.id === session.id
                  ? 'bg-[#ECF3FF]'
                  : 'hover:bg-[#F2F3F6]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FAA82C] to-[#F84E4E] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {session.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[12px] font-bold truncate ${activeSession?.id === session.id ? 'text-[#4584FF]' : 'text-[#06123C]'}`}>
                    {session.company}
                  </div>
                  <div className="text-[10px] text-[#727998] truncate">{session.role}</div>
                </div>
              </div>
              {session.alertMessage && (
                <div className="text-[9px] text-[#FAA82C] font-semibold mt-1.5 bg-[#FFF8EC] px-2 py-0.5 rounded-lg">
                  {session.alertMessage}
                </div>
              )}
            </button>
          ))}

          {DEMO_SESSIONS.length === 0 && (
            <div className="text-center py-8 text-[11px] text-[#727998]">
              No interviews scheduled.<br />Move an application to Interview status.
            </div>
          )}

          <div className="h-px bg-[#DCDFE8] my-3" />

          <button className="w-full text-[11px] font-semibold text-[#4584FF] text-center py-2 hover:underline">
            + Prep for a new role
          </button>
        </div>
      </div>

      {/* Right column — session panel */}
      <InterviewSessionPanel
        session={activeSession}
        demoQuestions={activeSession ? (DEMO_QUESTIONS[activeSession.company] ?? []) : []}
        starStories={DEMO_STAR_STORIES}
        process={activeSession ? DEMO_COMPANY_PROCESS[activeSession.company] : undefined}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update interview/page.tsx**

Read the current `src/app/(app)/interview/page.tsx`, then replace with:

```typescript
import { InterviewPageClient } from '@/components/interview/InterviewPageClient'

export default function InterviewPage() {
  return <InterviewPageClient />
}
```

- [ ] **Step 3: Build check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npm run build 2>&1 | tail -15
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/interview/InterviewPageClient.tsx "src/app/(app)/interview/page.tsx"
git commit -m "feat: Interview Prep page — session list, practice loop, STAR stories, company intel"
```

---

## Task 7: ChatDrawer + AppLayoutClient + wiring

**Files:**
- Create: `src/components/layout/ChatDrawer.tsx`
- Create: `src/components/layout/AppLayoutClient.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/components/layout/AppSidebar.tsx`

- [ ] **Step 1: Create ChatDrawer**

```typescript
// src/components/layout/ChatDrawer.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const threadIdRef = useRef(uuidv4())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text }
    const assistantId = uuidv4()

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ])
    setInput('')
    setIsLoading(true)

    const historyForApi = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi, threadId: threadIdRef.current }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') continue
          try {
            const event = JSON.parse(payload)
            if (event.type === 'text') {
              accumulated += event.content
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
              )
            }
          } catch {}
        }
      }
    } finally {
      setIsLoading(false)
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m)
      )
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-30"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-[380px] bg-white border-l border-[#DCDFE8] shadow-2xl z-40 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#DCDFE8] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-xs">
              🌍
            </div>
            <div>
              <div className="text-[12px] font-extrabold text-[#06123C]">Career Agent</div>
              <div className="text-[10px] text-[#03BA82] font-semibold">● Online</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#727998] hover:text-[#06123C] transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">👋</div>
              <div className="text-[13px] font-bold text-[#06123C]">Hi Ahmed!</div>
              <div className="text-[11px] text-[#727998] mt-1.5 leading-relaxed">
                Ask me anything about your job search — I can evaluate roles, draft outreach, and more.
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] text-[12px] leading-relaxed px-3 py-2 rounded-[10px] ${
                  msg.role === 'user'
                    ? 'bg-[#4584FF] text-white rounded-br-sm'
                    : 'bg-[#F2F3F6] text-[#06123C] rounded-bl-sm'
                }`}
              >
                {msg.content || (msg.isStreaming
                  ? <span className="inline-block w-4 text-center animate-pulse">●</span>
                  : ''
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#DCDFE8] flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask about your job search…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              disabled={isLoading}
              className="flex-1 border border-[#DCDFE8] rounded-[10px] px-3 py-2 text-[12px] text-[#06123C] placeholder:text-[#8D96B4] outline-none focus:border-[#4584FF] disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-[#4584FF] text-white px-3 py-2 rounded-[10px] disabled:opacity-40 transition-opacity hover:bg-[#3a70e0]"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Create AppLayoutClient**

```typescript
// src/components/layout/AppLayoutClient.tsx
'use client'

import { useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { ChatDrawer } from './ChatDrawer'

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] relative">
      <AppSidebar onOpenChat={() => setIsChatOpen(true)} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 3: Update layout.tsx**

Read the current `src/app/(app)/layout.tsx`, then replace its entire content:

```typescript
import { AppLayoutClient } from '@/components/layout/AppLayoutClient'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutClient>{children}</AppLayoutClient>
}
```

- [ ] **Step 4: Update AppSidebar to accept onOpenChat prop**

Read the current `src/components/layout/AppSidebar.tsx`, then make these two changes:

**Change 1** — add the prop type (add after the import lines at the top):

```typescript
interface AppSidebarProps {
  onOpenChat: () => void
}
```

**Change 2** — change the function signature from:

```typescript
export function AppSidebar() {
```

to:

```typescript
export function AppSidebar({ onOpenChat }: AppSidebarProps) {
```

**Change 3** — wire the FAB button. Change:

```typescript
      <button
        className="absolute bottom-7 right-7 w-[50px] h-[50px] rounded-full bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-xl shadow-lg shadow-blue-400/30 z-50"
        title="Ask your career agent"
      >
        💬
      </button>
```

to:

```typescript
      <button
        onClick={onOpenChat}
        className="absolute bottom-7 right-7 w-[50px] h-[50px] rounded-full bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-xl shadow-lg shadow-blue-400/30 z-50"
        title="Ask your career agent"
      >
        💬
      </button>
```

- [ ] **Step 5: Build check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npm run build 2>&1 | tail -15
```

Expected: Build succeeds. If TypeScript complains about children type in AppLayoutClient, add `import type { ReactNode } from 'react'` and use `ReactNode` for the children type.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ChatDrawer.tsx \
        src/components/layout/AppLayoutClient.tsx \
        "src/app/(app)/layout.tsx" \
        src/components/layout/AppSidebar.tsx
git commit -m "feat: Chat sidebar drawer wired to FAB, AppLayoutClient manages open state"
```

---

## Task 8: Full test suite + build check

- [ ] **Step 1: Run all tests**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest --no-coverage 2>&1 | tail -20
```

Expected:
- All Plan 1 tests pass
- All Plan 2 tests pass
- All Plan 3 tests pass (14 tests in applications.test.ts)
- 3 new Plan 4 tests pass (`__tests__/lib/interview.test.ts`)
- Zero regressions

If any tests fail that aren't pre-existing, diagnose and fix.

- [ ] **Step 2: Build check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npm run build 2>&1 | tail -10
```

Expected: Successful build. Both `/interview` and all other routes compile.

- [ ] **Step 3: Commit if uncommitted changes**

```bash
git status
# If uncommitted changes exist:
git add -A
git commit -m "feat: Plan 4 complete — Interview Prep and Chat Sidebar"
```

---

## Self-Review

**Spec coverage (against `docs/superpowers/specs/2026-04-16-app-revamp-design.md` section 3.6):**

**Section 3.6 Interview Prep:**
- ✅ Left column: upcoming interviews list (from Applications with status=interview) — Task 6 (InterviewPageClient)
- ✅ Practice history / "Prep for a new role" button — Task 6
- ✅ Company intel banner (dark navy): round structure, duration, offer rate, language — Task 4 (CompanyIntelBanner)
- ✅ Tabs: Practice / STAR Stories / Company Intel — Task 5 (InterviewSessionPanel)
- ✅ Practice tab: question card with type chip, answer textarea, submit/skip — Task 4 (PracticeTab)
- ✅ Practice tab: result with score, verdict, strengths/improvements 2-col, model answer — Task 4
- ✅ STAR Stories tab: bank of prepared stories — Task 5 (StarStoriesTab)
- ✅ Company Intel tab: structured research — Task 5 (IntelTab)
- ✅ generate_interview_question + evaluate_interview_answer wired — Task 3 (API routes)
- ✅ Source attribution (e.g. "Glassdoor 2024") — Task 2 (demo data)

**Chat Sidebar (spec section 2.1):**
- ✅ Chat available on every page via FAB (bottom-right) — Task 7 (FAB wiring)
- ✅ Opens as a drawer — Task 7 (ChatDrawer)
- ✅ Streams responses from existing /api/chat endpoint — Task 7

**Not in this plan (by design):**
- Video mock interview — spec marks Coming Soon
- Story bank agent mapping CV proof points to STAR frameworks — Plan 5 (background agents)
- Context-aware page injection into chat system prompt — Plan 5
