# Multi-Conversation Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conversation list to the sidebar so users can create, switch between, rename, and delete independent chat sessions, each with its own CV context and skill radar.

**Architecture:** All persistence is localStorage-only. Each conversation is a UUID (`threadId`) that already keys messages and CV markdown. A new `ConversationMeta` index tracks titles and timestamps. `page.tsx` owns conversation state and passes callbacks down; `key={activeThreadId}` on `ChatInterface` forces a clean remount on thread switch. A new `/api/title` route auto-generates a 4–6 word title after the first exchange.

**Tech Stack:** Next.js 16, React, TypeScript, localStorage, existing OpenRouter `/api/chat` and `/api/embed-cv` routes, Recharts (already installed), Tailwind CSS.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/conversation-store.ts` | localStorage CRUD for ConversationMeta index |
| Create | `src/app/api/title/route.ts` | LLM call to generate 4–6 word conversation title |
| Create | `src/components/chat/CVSidebarCard.tsx` | Compact CV thumbnail for white sidebar |
| Modify | `src/components/generative-ui/SkillRadarChart.tsx` | Add `compact` prop (height 200, 6 skills, no legend) |
| Modify | `src/app/page.tsx` | Conversation-aware state + all callbacks |
| Modify | `src/components/chat/ChatInterface.tsx` | Add `onSkillGapResult`, `onCVUploaded`, `onTitleGenerated` props |
| Modify | `src/components/layout/Sidebar.tsx` | Conversation list + radar + CV card + prototype footnote |
| Create | `__tests__/lib/conversation-store.test.ts` | Unit tests for store functions |
| Create | `__tests__/app/api/title/route.test.ts` | Unit tests for title route |
| Modify | `__tests__/components/layout/Sidebar.test.tsx` | Update for new props + removed session notice |
| Modify | `__tests__/app/page.test.tsx` | Update for new Sidebar/ChatInterface signatures |

---

## Task 1: Conversation Store

**Files:**
- Create: `src/lib/conversation-store.ts`
- Create: `__tests__/lib/conversation-store.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/conversation-store.test.ts`:

```typescript
/**
 * @jest-environment jsdom
 */

import {
  getConversations,
  createConversation,
  updateTitle,
  touchConversation,
  deleteConversation,
  getActiveThreadId,
  setActiveThreadId,
} from '@/lib/conversation-store'

beforeEach(() => {
  localStorage.clear()
})

describe('getConversations', () => {
  it('returns empty array when nothing stored', () => {
    expect(getConversations()).toEqual([])
  })

  it('returns conversations sorted by updatedAt descending', () => {
    const a = createConversation()
    // bump a's updatedAt by creating b after
    const b = createConversation()
    touchConversation(b.id)
    const result = getConversations()
    expect(result[0].id).toBe(b.id)
  })
})

describe('createConversation', () => {
  it('returns a ConversationMeta with id, title, createdAt, updatedAt', () => {
    const conv = createConversation()
    expect(conv.id).toBeTruthy()
    expect(conv.title).toBe('New Conversation')
    expect(typeof conv.createdAt).toBe('number')
    expect(typeof conv.updatedAt).toBe('number')
  })

  it('persists to getConversations', () => {
    createConversation()
    expect(getConversations()).toHaveLength(1)
  })
})

describe('updateTitle', () => {
  it('changes the title of the matching conversation', () => {
    const conv = createConversation()
    updateTitle(conv.id, 'Product Manager in UAE')
    const updated = getConversations().find(c => c.id === conv.id)
    expect(updated?.title).toBe('Product Manager in UAE')
  })
})

describe('touchConversation', () => {
  it('bumps updatedAt without changing title', () => {
    const conv = createConversation()
    const before = conv.updatedAt
    jest.spyOn(Date, 'now').mockReturnValue(before + 1000)
    touchConversation(conv.id)
    jest.restoreAllMocks()
    const updated = getConversations().find(c => c.id === conv.id)
    expect(updated?.updatedAt).toBeGreaterThan(before)
    expect(updated?.title).toBe('New Conversation')
  })
})

describe('deleteConversation', () => {
  it('removes the conversation from the index', () => {
    const conv = createConversation()
    deleteConversation(conv.id)
    expect(getConversations()).toHaveLength(0)
  })

  it('clears messages and CV markdown keys for that id', () => {
    const conv = createConversation()
    localStorage.setItem(`localized_messages_${conv.id}`, '[]')
    localStorage.setItem(`localized_cv_markdown_${conv.id}`, 'some markdown')
    deleteConversation(conv.id)
    expect(localStorage.getItem(`localized_messages_${conv.id}`)).toBeNull()
    expect(localStorage.getItem(`localized_cv_markdown_${conv.id}`)).toBeNull()
  })

  it('does not delete other conversations', () => {
    const a = createConversation()
    const b = createConversation()
    deleteConversation(a.id)
    expect(getConversations().find(c => c.id === b.id)).toBeTruthy()
  })
})

describe('getActiveThreadId / setActiveThreadId', () => {
  it('returns null when nothing stored', () => {
    expect(getActiveThreadId()).toBeNull()
  })

  it('returns the id that was set', () => {
    setActiveThreadId('abc-123')
    expect(getActiveThreadId()).toBe('abc-123')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/lib/conversation-store.test.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module '@/lib/conversation-store'"

- [ ] **Step 3: Implement the store**

Create `src/lib/conversation-store.ts`:

```typescript
export interface ConversationMeta {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

const CONVERSATIONS_KEY = 'localized_conversations'
const ACTIVE_THREAD_KEY = 'localized_active_thread'

export function getConversations(): ConversationMeta[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as ConversationMeta[]).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function createConversation(): ConversationMeta {
  const conv: ConversationMeta = {
    id: crypto.randomUUID(),
    title: 'New Conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const existing = getConversations()
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify([...existing, conv]))
  } catch {}
  return conv
}

export function updateTitle(id: string, title: string): void {
  const conversations = getConversations()
  try {
    localStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(conversations.map(c => (c.id === id ? { ...c, title } : c)))
    )
  } catch {}
}

export function touchConversation(id: string): void {
  const conversations = getConversations()
  try {
    localStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(conversations.map(c => (c.id === id ? { ...c, updatedAt: Date.now() } : c)))
    )
  } catch {}
}

export function deleteConversation(id: string): void {
  const conversations = getConversations()
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations.filter(c => c.id !== id)))
    localStorage.removeItem(`localized_messages_${id}`)
    localStorage.removeItem(`localized_cv_markdown_${id}`)
  } catch {}
}

export function getActiveThreadId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_THREAD_KEY)
  } catch {
    return null
  }
}

export function setActiveThreadId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_THREAD_KEY, id)
  } catch {}
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest __tests__/lib/conversation-store.test.ts --no-coverage 2>&1 | tail -10
```

Expected: PASS — 10 tests

---

## Task 2: Auto-Title API Route

**Files:**
- Create: `src/app/api/title/route.ts`
- Create: `__tests__/app/api/title/route.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/app/api/title/route.test.ts`:

```typescript
/**
 * @jest-environment node
 */

global.fetch = jest.fn()

import { POST } from '@/app/api/title/route'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.OPENROUTER_API_KEY = 'sk-or-test'
})

describe('POST /api/title', () => {
  it('returns 400 if firstUserMessage is missing', async () => {
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({ firstAssistantMessage: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 if firstAssistantMessage is missing', async () => {
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({ firstUserMessage: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns fallback title if OPENROUTER_API_KEY is not set', async () => {
    delete process.env.OPENROUTER_API_KEY
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({ firstUserMessage: 'hi', firstAssistantMessage: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('New Conversation')
  })

  it('returns trimmed title from OpenRouter', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        choices: [{ message: { content: '  Product Manager in UAE  ' } }],
      }),
    })
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({
        firstUserMessage: 'I want to become a Product Manager',
        firstAssistantMessage: 'Great. UAE has strong PM demand.',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Product Manager in UAE')
  })

  it('returns fallback title if fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network error'))
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({ firstUserMessage: 'hi', firstAssistantMessage: 'hello' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.title).toBe('New Conversation')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest __tests__/app/api/title/route.test.ts --no-coverage 2>&1 | tail -10
```

Expected: FAIL — "Cannot find module '@/app/api/title/route'"

- [ ] **Step 3: Implement the route**

Create `src/app/api/title/route.ts`:

```typescript
export async function POST(req: Request) {
  let body: { firstUserMessage?: string; firstAssistantMessage?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { firstUserMessage, firstAssistantMessage } = body
  if (!firstUserMessage || !firstAssistantMessage) {
    return Response.json({ error: 'firstUserMessage and firstAssistantMessage are required' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return Response.json({ title: 'New Conversation' })
  }

  const model = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-lite-001'

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://localized.world',
        'X-Title': 'Localized AI Career Coach',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: `Summarize this career coaching conversation in 4-6 words. Reply with the title only, no punctuation, no quotes.\n\nUser: ${firstUserMessage.slice(0, 200)}\n\nAssistant: ${firstAssistantMessage.slice(0, 200)}`,
          },
        ],
        max_tokens: 20,
      }),
    })
    const data = await res.json()
    const title = (data.choices?.[0]?.message?.content as string | undefined)?.trim() ?? 'New Conversation'
    return Response.json({ title })
  } catch {
    return Response.json({ title: 'New Conversation' })
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest __tests__/app/api/title/route.test.ts --no-coverage 2>&1 | tail -10
```

Expected: PASS — 5 tests

---

## Task 3: SkillRadarChart Compact Prop

**Files:**
- Modify: `src/components/generative-ui/SkillRadarChart.tsx`
- Modify: `__tests__/components/generative-ui/SkillRadarChart.test.tsx`

- [ ] **Step 1: Read the existing test**

```bash
cat "__tests__/components/generative-ui/SkillRadarChart.test.tsx"
```

- [ ] **Step 2: Add a failing test for compact mode**

Open `__tests__/components/generative-ui/SkillRadarChart.test.tsx` and append:

```typescript
it('renders in compact mode without legend', () => {
  const result: SkillGapResult = {
    role: { id: '1', title: 'PM', company: 'Acme', location: 'Dubai', requiredSkills: [] },
    gaps: Array.from({ length: 8 }, (_, i) => ({
      skill: `Skill ${i}`,
      category: 'technical' as const,
      currentLevel: 5,
      requiredLevel: 8,
      gap: 3,
      severity: 'medium' as const,
      recommendedAction: 'Learn it',
    })),
    overallReadiness: 60,
  }
  const { queryByText } = render(<SkillRadarChart result={result} compact />)
  // Legend shows "Your Level" and "Role Required" — should be absent in compact mode
  expect(queryByText('Your Level')).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run the new test — verify it fails**

```bash
npx jest __tests__/components/generative-ui/SkillRadarChart.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: FAIL

- [ ] **Step 4: Update SkillRadarChart to support compact prop**

Replace the contents of `src/components/generative-ui/SkillRadarChart.tsx`:

```typescript
'use client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend, ResponsiveContainer } from 'recharts'
import type { SkillGapResult } from '@/types'

interface Props {
  result: SkillGapResult
  compact?: boolean
}

export function SkillRadarChart({ result, compact = false }: Props) {
  const { role, gaps, overallReadiness } = result
  const maxSkills = compact ? 6 : 8
  const chartHeight = compact ? 200 : 280

  const chartData = gaps.slice(0, maxSkills).map(gap => ({
    skill: gap.skill.length > 12 ? gap.skill.slice(0, 12) + '…' : gap.skill,
    current: gap.currentLevel,
    required: gap.requiredLevel,
  }))

  const readinessBadgeClass =
    overallReadiness >= 70
      ? 'bg-green/10 text-green font-bold'
      : overallReadiness >= 50
      ? 'bg-amber-50 text-amber-600'
      : 'bg-red-50 text-red-600'

  return (
    <div className="rounded-[10px] shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] bg-white p-4 my-3 w-full max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-navy">{role.title}</p>
          <p className="text-sm text-muted">{role.company} · {role.location}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold rounded-full px-3 py-1 ${readinessBadgeClass}`}>{overallReadiness}%</p>
          <p className="text-xs text-muted">readiness</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#374151', fontSize: compact ? 9 : 11 }} />
          <Radar name="Your Level" dataKey="current" stroke="#4584FF" fill="#4584FF" fillOpacity={0.3} isAnimationActive />
          <Radar name="Role Required" dataKey="required" stroke="#06123C" fill="#06123C" fillOpacity={0.15} isAnimationActive />
          {!compact && <Legend wrapperStyle={{ fontSize: 12 }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npx jest __tests__/components/generative-ui/SkillRadarChart.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: PASS

---

## Task 4: CVSidebarCard Component

**Files:**
- Create: `src/components/chat/CVSidebarCard.tsx`

No separate test — it's a pure presentational component covered by the Sidebar tests in Task 7.

- [ ] **Step 1: Create the component**

Create `src/components/chat/CVSidebarCard.tsx`:

```typescript
'use client'

import { CVAttachment } from '@/types'

interface CVSidebarCardProps {
  attachment: CVAttachment
}

export function CVSidebarCard({ attachment }: CVSidebarCardProps) {
  const { fileName, pageCount, pageImages } = attachment

  return (
    <div className="rounded-[10px] border border-border bg-white p-3">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-navy">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span className="truncate max-w-[160px]">{fileName}</span>
        <span className="text-muted shrink-0">· {pageCount}p</span>
      </div>
      {pageImages[0] && (
        <div className="rounded-[6px] overflow-hidden border border-border">
          <img
            src={pageImages[0]}
            alt="CV preview"
            className="w-full object-top object-cover"
            style={{ maxHeight: 120 }}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep CVSidebarCard
```

Expected: no output (no errors)

---

## Task 5: Update page.tsx

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `__tests__/app/page.test.tsx`

- [ ] **Step 1: Update the page test first**

Replace `__tests__/app/page.test.tsx` with:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import Home from '@/app/page'

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}))

jest.mock('@/components/layout/Sidebar', () => ({
  __esModule: true,
  default: ({
    onNew,
    onSwitch,
  }: {
    onNew: () => void
    onSwitch: (id: string) => void
    activeThreadId: string
  }) => (
    <div data-testid="sidebar">
      <button onClick={onNew}>New</button>
      <button onClick={() => onSwitch('other-id')}>Switch</button>
    </div>
  ),
}))

jest.mock('@/components/chat/ChatInterface', () => ({
  ChatInterface: ({
    threadId,
    onProfileUpdate,
    onSkillGapResult,
  }: {
    threadId: string
    onProfileUpdate: (p: unknown) => void
    onSkillGapResult: (r: unknown) => void
  }) => (
    <div data-testid="chat-interface" data-thread-id={threadId}>
      <button onClick={() => onProfileUpdate({ name: 'Test User' })}>Update Profile</button>
      <button onClick={() => onSkillGapResult({ overallReadiness: 75, gaps: [], role: {} })}>
        Update Gap
      </button>
    </div>
  ),
}))

jest.mock('@/lib/conversation-store', () => ({
  getConversations: jest.fn(() => [{ id: 'test-thread-id', title: 'New Conversation', createdAt: 1, updatedAt: 1 }]),
  createConversation: jest.fn(() => ({ id: 'test-thread-id', title: 'New Conversation', createdAt: 1, updatedAt: 1 })),
  updateTitle: jest.fn(),
  deleteConversation: jest.fn(),
  setActiveThreadId: jest.fn(),
  getActiveThreadId: jest.fn(() => 'test-thread-id'),
  touchConversation: jest.fn(),
}))

Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-thread-id' },
})

describe('Home page', () => {
  it('renders Header component', () => {
    render(<Home />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders Sidebar component', () => {
    render(<Home />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders ChatInterface component', () => {
    render(<Home />)
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
  })

  it('passes activeThreadId to ChatInterface', () => {
    render(<Home />)
    expect(screen.getByTestId('chat-interface')).toHaveAttribute('data-thread-id', 'test-thread-id')
  })

  it('updates userProfile state when onProfileUpdate is called', () => {
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: 'Update Profile' }))
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the updated test — verify it fails (because page.tsx hasn't changed yet)**

```bash
npx jest __tests__/app/page.test.tsx --no-coverage 2>&1 | tail -15
```

Expected: FAIL — various errors about missing props or missing conversation-store mock

- [ ] **Step 3: Replace page.tsx**

Replace `src/app/page.tsx` with:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { UserProfile, SkillGapResult, CVAttachment, ChatMessage } from '@/types'
import {
  getConversations,
  createConversation,
  updateTitle,
  deleteConversation,
  setActiveThreadId,
  getActiveThreadId,
  ConversationMeta,
} from '@/lib/conversation-store'

function deriveSkillGapResult(messages: ChatMessage[]): SkillGapResult | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    for (const tr of messages[i].toolResults ?? []) {
      if (tr.toolName === 'skill_gap_analysis' && tr.status === 'done') {
        return tr.result as SkillGapResult
      }
    }
  }
  return null
}

function deriveCVAttachment(messages: ChatMessage[]): CVAttachment | null {
  for (const msg of messages) {
    if (msg.cvAttachment) return msg.cvAttachment
  }
  return null
}

function loadMessages(threadId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`localized_messages_${threadId}`)
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
  } catch {
    return []
  }
}

export default function Home() {
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const [activeThreadId, setActiveThreadIdState] = useState('')
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [skillGapResult, setSkillGapResult] = useState<SkillGapResult | null>(null)
  const [cvAttachment, setCvAttachment] = useState<CVAttachment | null>(null)

  useEffect(() => {
    let convs = getConversations()
    if (convs.length === 0) {
      convs = [createConversation()]
    }
    setConversations(convs)

    const storedActive = getActiveThreadId()
    const activeId =
      storedActive && convs.find(c => c.id === storedActive) ? storedActive : convs[0].id

    setActiveThreadId(activeId)
    setActiveThreadIdState(activeId)

    const msgs = loadMessages(activeId)
    setSkillGapResult(deriveSkillGapResult(msgs))
    setCvAttachment(deriveCVAttachment(msgs))
  }, [])

  const handleProfileUpdate = useCallback((update: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...update }))
  }, [])

  const handleSkillGapResult = useCallback((result: SkillGapResult) => {
    setSkillGapResult(result)
  }, [])

  const handleCVUploaded = useCallback((attachment: CVAttachment) => {
    setCvAttachment(attachment)
  }, [])

  const handleTitleGenerated = useCallback((id: string, title: string) => {
    updateTitle(id, title)
    setConversations(getConversations())
  }, [])

  const handleNewConversation = useCallback(() => {
    const conv = createConversation()
    setActiveThreadId(conv.id)
    setActiveThreadIdState(conv.id)
    setConversations(getConversations())
    setUserProfile({})
    setSkillGapResult(null)
    setCvAttachment(null)
  }, [])

  const handleSwitchConversation = useCallback((id: string) => {
    setActiveThreadId(id)
    setActiveThreadIdState(id)
    setUserProfile({})
    const msgs = loadMessages(id)
    setSkillGapResult(deriveSkillGapResult(msgs))
    setCvAttachment(deriveCVAttachment(msgs))
  }, [])

  const handleDeleteConversation = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this conversation?')) return
      deleteConversation(id)
      const remaining = getConversations()
      if (remaining.length === 0) {
        const fresh = createConversation()
        setConversations([fresh])
        setActiveThreadId(fresh.id)
        setActiveThreadIdState(fresh.id)
        setUserProfile({})
        setSkillGapResult(null)
        setCvAttachment(null)
      } else {
        setConversations(remaining)
        if (id === activeThreadId) {
          const next = remaining[0].id
          setActiveThreadId(next)
          setActiveThreadIdState(next)
          setUserProfile({})
          const msgs = loadMessages(next)
          setSkillGapResult(deriveSkillGapResult(msgs))
          setCvAttachment(deriveCVAttachment(msgs))
        }
      }
    },
    [activeThreadId]
  )

  const handleRenameConversation = useCallback((id: string, title: string) => {
    updateTitle(id, title)
    setConversations(getConversations())
  }, [])

  if (!activeThreadId) return null

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          profile={userProfile}
          conversations={conversations}
          activeThreadId={activeThreadId}
          skillGapResult={skillGapResult}
          cvAttachment={cvAttachment}
          onNew={handleNewConversation}
          onSwitch={handleSwitchConversation}
          onDelete={handleDeleteConversation}
          onRename={handleRenameConversation}
        />
        <ChatInterface
          key={activeThreadId}
          threadId={activeThreadId}
          onProfileUpdate={handleProfileUpdate}
          onSkillGapResult={handleSkillGapResult}
          onCVUploaded={handleCVUploaded}
          onTitleGenerated={handleTitleGenerated}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest __tests__/app/page.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: PASS — 5 tests

---

## Task 6: Update ChatInterface

**Files:**
- Modify: `src/components/chat/ChatInterface.tsx`
- Modify: `__tests__/components/chat/ChatInterface.test.tsx`

- [ ] **Step 1: Read the existing ChatInterface test**

```bash
cat "__tests__/components/chat/ChatInterface.test.tsx"
```

- [ ] **Step 2: Add failing tests for new callbacks**

Open `__tests__/components/chat/ChatInterface.test.tsx`. Find the existing `describe('ChatInterface', ...)` block. Add these tests inside it (the mock for `onSkillGapResult` and `onCVUploaded` will need to be added to the render call — update ALL existing `render(<ChatInterface ...>)` calls to include the new required props):

For every existing `render(<ChatInterface threadId="t1" onProfileUpdate={...} />)` in the file, change to:
```tsx
render(
  <ChatInterface
    threadId="t1"
    onProfileUpdate={mockProfileUpdate}
    onSkillGapResult={jest.fn()}
    onCVUploaded={jest.fn()}
    onTitleGenerated={jest.fn()}
  />
)
```

Then add:
```tsx
it('accepts onSkillGapResult, onCVUploaded, and onTitleGenerated without error', () => {
  const mockProfileUpdate = jest.fn()
  expect(() =>
    render(
      <ChatInterface
        threadId="test-thread"
        onProfileUpdate={mockProfileUpdate}
        onSkillGapResult={jest.fn()}
        onCVUploaded={jest.fn()}
        onTitleGenerated={jest.fn()}
      />
    )
  ).not.toThrow()
})
```

- [ ] **Step 3: Run the updated test — verify existing tests still pass (they'll fail on missing props)**

```bash
npx jest __tests__/components/chat/ChatInterface.test.tsx --no-coverage 2>&1 | tail -15
```

Expected: FAIL due to missing required props in existing renders

- [ ] **Step 4: Update ChatInterface.tsx**

At the top of `src/components/chat/ChatInterface.tsx`, update the imports and interface:

**Change the import line** (line 4):
```typescript
import { ChatMessage, UserProfile, ParsedResumeResult, SkillGapResult, CVAttachment } from '@/types'
```

**Add to imports** (after existing imports, before the interface):
```typescript
import { touchConversation } from '@/lib/conversation-store'
```

**Replace the `ChatInterfaceProps` interface**:
```typescript
interface ChatInterfaceProps {
  threadId: string
  onProfileUpdate: (profile: Partial<UserProfile>) => void
  onSkillGapResult: (result: SkillGapResult) => void
  onCVUploaded: (attachment: CVAttachment) => void
  onTitleGenerated: (threadId: string, title: string) => void
}
```

**Replace the function signature line**:
```typescript
export function ChatInterface({ threadId, onProfileUpdate, onSkillGapResult, onCVUploaded, onTitleGenerated }: ChatInterfaceProps) {
```

**Add two refs** after the existing `fileInputRef` line:
```typescript
const messagesRef = useRef<ChatMessage[]>([initialWelcomeMessage])
const titleFiredRef = useRef(false)
```

**Add a useEffect to keep messagesRef in sync** — add after the existing "Persist messages" useEffect:
```typescript
// Keep messagesRef in sync for post-stream title generation
useEffect(() => {
  messagesRef.current = messages
}, [messages])
```

**In the `tool_result` handler** inside `streamAgentResponse` (around line 125, after the `parse_resume` block), add:
```typescript
if (event.name === 'skill_gap_analysis') onSkillGapResult(event.result as SkillGapResult)
```

**At the end of `streamAgentResponse`**, after the `while` loop and `if (buffer...)` line, add:
```typescript
// Touch conversation to bump updatedAt in the list
touchConversation(threadId)

// Auto-title: fire once after first exchange (welcome + user + assistant = 3 messages)
const currentMsgs = messagesRef.current
if (!titleFiredRef.current && currentMsgs.length === 3) {
  titleFiredRef.current = true
  const firstUser = currentMsgs[1]?.content ?? ''
  const firstAssistant = currentMsgs[2]?.content ?? ''
  fetch('/api/title', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstUserMessage: firstUser, firstAssistantMessage: firstAssistant }),
  })
    .then(r => r.json())
    .then(({ title }: { title: string }) => { if (title) onTitleGenerated(threadId, title) })
    .catch(() => {})
}
```

**In `handlePDFVision`**, after setting `cvUserMsg` (the line `setMessages(prev => [...prev, cvUserMsg, scanningAssistant])`), add:
```typescript
onCVUploaded({ fileName: file.name, pageCount, pageImages })
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npx jest __tests__/components/chat/ChatInterface.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: PASS

---

## Task 7: Update Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `__tests__/components/layout/Sidebar.test.tsx`

- [ ] **Step 1: Write updated Sidebar tests first**

Replace `__tests__/components/layout/Sidebar.test.tsx` with:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from '@/components/layout/Sidebar'
import { UserProfile } from '@/types'
import { ConversationMeta } from '@/lib/conversation-store'

// QRCodeSVG uses canvas — mock it
jest.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr-code" />,
}))

const baseConversations: ConversationMeta[] = [
  { id: 'conv-1', title: 'Product Manager UAE', createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 'conv-2', title: 'Software Engineer', createdAt: 1699000000000, updatedAt: 1699000000000 },
]

const baseProps = {
  profile: {} as UserProfile,
  conversations: baseConversations,
  activeThreadId: 'conv-1',
  skillGapResult: null,
  cvAttachment: null,
  onNew: jest.fn(),
  onSwitch: jest.fn(),
  onDelete: jest.fn(),
  onRename: jest.fn(),
}

describe('Sidebar', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows em dash for empty profile fields', () => {
    render(<Sidebar {...baseProps} />)
    const emDashes = screen.getAllByText('—')
    expect(emDashes.length).toBeGreaterThanOrEqual(5)
  })

  it('shows profile data when populated', () => {
    const profile: UserProfile = {
      name: 'Sara Al-Rashidi',
      location: 'Dubai, UAE',
      background: 'Software Engineering',
      targetRole: 'Product Manager',
      currentLevel: 'mid',
    }
    render(<Sidebar {...baseProps} profile={profile} />)
    expect(screen.getByText('Sara Al-Rashidi')).toBeInTheDocument()
    expect(screen.getByText('Dubai, UAE')).toBeInTheDocument()
  })

  it('shows prototype disclaimer instead of session memory notice', () => {
    render(<Sidebar {...baseProps} />)
    expect(screen.getByText(/Prototype demo/i)).toBeInTheDocument()
    expect(screen.queryByText(/Session memory active/i)).not.toBeInTheDocument()
  })

  it('renders conversation list', () => {
    render(<Sidebar {...baseProps} />)
    expect(screen.getByText('Product Manager UAE')).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
  })

  it('calls onNew when + New Conversation is clicked', () => {
    const onNew = jest.fn()
    render(<Sidebar {...baseProps} onNew={onNew} />)
    fireEvent.click(screen.getByRole('button', { name: /new conversation/i }))
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('calls onSwitch when a non-active conversation is clicked', () => {
    const onSwitch = jest.fn()
    render(<Sidebar {...baseProps} onSwitch={onSwitch} />)
    fireEvent.click(screen.getByText('Software Engineer'))
    expect(onSwitch).toHaveBeenCalledWith('conv-2')
  })

  it('does not render radar chart when skillGapResult is null', () => {
    render(<Sidebar {...baseProps} skillGapResult={null} />)
    expect(screen.queryByText(/readiness/i)).not.toBeInTheDocument()
  })

  it('does not render CV card when cvAttachment is null', () => {
    render(<Sidebar {...baseProps} cvAttachment={null} />)
    expect(screen.queryByText(/\.pdf/i)).not.toBeInTheDocument()
  })

  it('renders CV filename when cvAttachment is provided', () => {
    const cvAttachment = {
      fileName: 'Zoom_Nguyen.pdf',
      pageCount: 2,
      pageImages: [],
    }
    render(<Sidebar {...baseProps} cvAttachment={cvAttachment} />)
    expect(screen.getByText('Zoom_Nguyen.pdf')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the new tests — verify they fail**

```bash
npx jest __tests__/components/layout/Sidebar.test.tsx --no-coverage 2>&1 | tail -15
```

Expected: FAIL — missing props, wrong text content

- [ ] **Step 3: Replace Sidebar.tsx**

Replace the full contents of `src/components/layout/Sidebar.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { UserProfile, SkillGapResult, CVAttachment } from '@/types'
import { ConversationMeta } from '@/lib/conversation-store'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import { CVSidebarCard } from '@/components/chat/CVSidebarCard'

interface SidebarProps {
  profile: UserProfile
  conversations: ConversationMeta[]
  activeThreadId: string
  skillGapResult: SkillGapResult | null
  cvAttachment: CVAttachment | null
  onNew: () => void
  onSwitch: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
}

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-navy font-medium">{value ?? <span className="text-muted">—</span>}</p>
    </div>
  )
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const CHANNELS = [
  {
    id: 'telegram',
    label: 'Telegram',
    url: 'https://t.me/localized_career_bot',
    color: '#229ED9',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.03 9.57c-.144.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.278 13.5l-2.937-.918c-.638-.2-.65-.638.136-.943l11.47-4.423c.53-.193.994.13.615 1.031z" />
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    url: 'https://wa.me/966500000000?text=Hi%20Localized%20Career%20Coach',
    color: '#25D366',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
]

export default function Sidebar({
  profile,
  conversations,
  activeThreadId,
  skillGapResult,
  cvAttachment,
  onNew,
  onSwitch,
  onDelete,
  onRename,
}: SidebarProps) {
  const [activeChannel, setActiveChannel] = useState<'telegram' | 'whatsapp'>('telegram')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const channel = CHANNELS.find(c => c.id === activeChannel)!

  const startRename = (conv: ConversationMeta) => {
    setRenamingId(conv.id)
    setRenameValue(conv.title)
  }

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  return (
    <aside className="w-72 bg-white border-r border-border flex flex-col flex-shrink-0 hidden md:flex overflow-y-auto">

      {/* Conversation list */}
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[8px] border border-border text-xs font-semibold text-navy hover:bg-gray-50 transition-colors mb-3"
        >
          <span className="text-base leading-none">+</span> New Conversation
        </button>

        <div className="space-y-0.5">
          {conversations.map(conv => {
            const isActive = conv.id === activeThreadId
            return (
              <div
                key={conv.id}
                className={`group flex items-start justify-between rounded-[8px] px-2 py-2 cursor-pointer transition-colors ${
                  isActive ? 'bg-blue/5 border-l-2 border-blue' : 'hover:bg-gray-50'
                }`}
                onClick={() => !isActive && onSwitch(conv.id)}
              >
                <div className="flex-1 min-w-0">
                  {renamingId === conv.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      className="text-xs font-semibold text-navy w-full bg-transparent border-b border-blue outline-none"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <p
                      className={`text-xs font-semibold truncate ${isActive ? 'text-navy' : 'text-navy/70'}`}
                      onDoubleClick={e => { e.stopPropagation(); startRename(conv) }}
                    >
                      {conv.title}
                    </p>
                  )}
                  <p className="text-[10px] text-muted mt-0.5">{formatTimestamp(conv.updatedAt)}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
                  className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 text-muted hover:text-red-500 transition-opacity flex-shrink-0"
                  aria-label="Delete conversation"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Profile */}
      <div className="p-4 flex-shrink-0">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Your Profile</h2>
        <ProfileField label="Name" value={profile.name} />
        <ProfileField label="Location" value={profile.location} />
        <ProfileField label="Background" value={profile.background} />
        <ProfileField label="Target Role" value={profile.targetRole} />
        <ProfileField label="Experience Level" value={profile.currentLevel} />
      </div>

      {/* Skill Radar — shown when available */}
      {skillGapResult && (
        <div className="px-3 pb-3 flex-shrink-0">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">Skill Readiness</h2>
          <SkillRadarChart result={skillGapResult} compact />
        </div>
      )}

      {/* CV Card — shown when available */}
      {cvAttachment && (
        <div className="px-3 pb-3 flex-shrink-0">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">CV Uploaded</h2>
          <CVSidebarCard attachment={cvAttachment} />
        </div>
      )}

      {/* Continue on Mobile */}
      <div className="mx-4 mb-3 rounded-[10px] border border-border p-3 flex-shrink-0 mt-auto">
        <p className="text-xs font-semibold text-navy mb-1">Continue on Mobile</p>
        <p className="text-xs text-muted mb-3">Scan to chat with your coach on the go</p>

        <div className="flex gap-1 mb-3">
          {CHANNELS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.id as 'telegram' | 'whatsapp')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                activeChannel === c.id ? 'text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
              style={activeChannel === c.id ? { backgroundColor: c.color } : undefined}
            >
              <span style={activeChannel === c.id ? { color: 'white' } : { color: c.color }}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="p-2 bg-white border border-border rounded-[8px]">
            <QRCodeSVG value={channel.url} size={100} fgColor={channel.color} bgColor="#FFFFFF" level="M" />
          </div>
          <p className="text-xs text-muted text-center">Scan to open {channel.label}</p>
        </div>
      </div>

      {/* Prototype footnote */}
      <p className="text-[10px] text-muted text-center pb-3 px-4">
        Prototype demo — some data is illustrative only.
      </p>
    </aside>
  )
}
```

- [ ] **Step 4: Run Sidebar tests — verify they pass**

```bash
npx jest __tests__/components/layout/Sidebar.test.tsx --no-coverage 2>&1 | tail -15
```

Expected: PASS — 9 tests

---

## Task 8: Full Test Suite + TypeScript Check

- [ ] **Step 1: Run TypeScript check**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx tsc --noEmit 2>&1
```

Expected: no errors. If there are errors, fix them before proceeding.

- [ ] **Step 2: Run all tests**

```bash
npx jest --no-coverage 2>&1 | tail -30
```

Expected: all tests PASS. If any fail, fix them before building Docker.

- [ ] **Step 3: Build and restart Docker**

```bash
docker compose up --build -d 2>&1 | tail -20
```

Expected: container starts successfully on port 3001.

- [ ] **Step 4: Smoke test in browser**

Open http://localhost:3001 and verify:
1. Sidebar shows "+ New Conversation" button and one conversation in the list
2. Typing a message and receiving a reply shows the conversation auto-titled after the first exchange
3. Clicking "+ New Conversation" opens a fresh chat, previous conversation still in list
4. Switching back to the old conversation restores its messages
5. Refreshing the page restores the active conversation and list
6. Uploading a CV shows the CV card in the sidebar
7. After skill gap analysis runs, the radar chart appears in the sidebar
8. Deleting a conversation removes it from the list
9. Double-clicking a conversation title lets you rename it inline
10. Prototype disclaimer appears at the bottom of the sidebar
