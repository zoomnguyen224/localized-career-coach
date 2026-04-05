# AIParser Embedding Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate vision-based PDF parsing with in-memory embeddings and a `search_resume` agent tool so the LangGraph chat agent can retrieve specific CV details throughout the conversation, with localStorage persistence so the session survives page refreshes.

**Architecture:** PDF → vision model → markdown + structured JSON → chunk+embed → `MemoryVectorStore` keyed by threadId. Agent gains `search_resume(query)` tool that queries the store directly (no HTTP hop). Chat messages and CV markdown are persisted in localStorage; on refresh the store is silently rebuilt from stored markdown.

**Tech Stack:** LangChain `MemoryVectorStore`, `RecursiveCharacterTextSplitter`, `OpenAIEmbeddings` (`text-embedding-3-small`), LangGraph `StateGraph`, Next.js App Router API routes, localStorage.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/vector-store.ts` | **Create** | Module-level singleton Map of `MemoryVectorStore` keyed by threadId |
| `src/app/api/embed-cv/route.ts` | **Create** | POST: chunk markdown → embed → store in vector-store singleton |
| `src/app/api/parse-cv/route.ts` | **Modify** | Return `markdownContent` (raw vision output) alongside structured JSON |
| `src/lib/tools.ts` | **Modify** | Add `createSearchResumeTool(threadId)` factory |
| `src/lib/graph.ts` | **Modify** | Change singleton `graph` export → `createGraph(threadId)` factory |
| `src/lib/system-prompt.ts` | **Modify** | Add `search_resume` tool description |
| `src/app/api/chat/route.ts` | **Modify** | Call `createGraph(threadId)` per-request |
| `src/app/page.tsx` | **Modify** | Stable threadId from localStorage |
| `src/components/chat/ChatInterface.tsx` | **Modify** | localStorage message persistence + CV markdown save + on-mount re-embed |
| `src/types/index.ts` | **Modify** | Add `markdownContent?: string` to `ParsedResumeResult` |
| `.env.example` | **Modify** | Add `OPENAI_API_KEY` |
| `__tests__/lib/graph.test.ts` | **Modify** | Update to use `createGraph` factory |
| `__tests__/app/api/chat/route.test.ts` | **Modify** | Update mock to match `createGraph` |
| `__tests__/app/api/embed-cv/route.test.ts` | **Create** | Tests for embed-cv route |

---

## Task 1: Create vector store singleton module

**Files:**
- Create: `src/lib/vector-store.ts`
- Create: `__tests__/lib/vector-store.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/vector-store.test.ts`:

```ts
/**
 * @jest-environment node
 */
import { setVectorStore, getVectorStore, clearVectorStore } from '@/lib/vector-store'

describe('vector-store', () => {
  afterEach(() => {
    clearVectorStore('thread-1')
    clearVectorStore('thread-2')
  })

  it('returns undefined for unknown threadId', () => {
    expect(getVectorStore('thread-1')).toBeUndefined()
  })

  it('stores and retrieves a value by threadId', () => {
    const fakeStore = { similaritySearch: jest.fn() } as any
    setVectorStore('thread-1', fakeStore)
    expect(getVectorStore('thread-1')).toBe(fakeStore)
  })

  it('isolates stores by threadId', () => {
    const store1 = { id: '1' } as any
    const store2 = { id: '2' } as any
    setVectorStore('thread-1', store1)
    setVectorStore('thread-2', store2)
    expect(getVectorStore('thread-1')).toBe(store1)
    expect(getVectorStore('thread-2')).toBe(store2)
  })

  it('clears a store', () => {
    const fakeStore = {} as any
    setVectorStore('thread-1', fakeStore)
    clearVectorStore('thread-1')
    expect(getVectorStore('thread-1')).toBeUndefined()
  })

  it('replaces an existing store on re-upload', () => {
    const old = { id: 'old' } as any
    const fresh = { id: 'fresh' } as any
    setVectorStore('thread-1', old)
    setVectorStore('thread-1', fresh)
    expect(getVectorStore('thread-1')).toBe(fresh)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "/Users/zoomnguyen/Documents/Dev-Projects/Vibe-App/Localized - AI Career Coach Demo/localized-career-coach"
npx jest __tests__/lib/vector-store.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/vector-store'`

- [ ] **Step 3: Implement `src/lib/vector-store.ts`**

```ts
import type { MemoryVectorStore } from 'langchain/vectorstores/memory'

const stores = new Map<string, MemoryVectorStore>()

export function setVectorStore(threadId: string, store: MemoryVectorStore): void {
  stores.set(threadId, store)
}

export function getVectorStore(threadId: string): MemoryVectorStore | undefined {
  return stores.get(threadId)
}

export function clearVectorStore(threadId: string): void {
  stores.delete(threadId)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/vector-store.test.ts --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/vector-store.ts __tests__/lib/vector-store.test.ts
git commit -m "feat: add vector store singleton module"
```

---

## Task 2: Create `/api/embed-cv` route

**Files:**
- Create: `src/app/api/embed-cv/route.ts`
- Create: `__tests__/app/api/embed-cv/route.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/app/api/embed-cv/route.test.ts`:

```ts
/**
 * @jest-environment node
 */

const mockAddDocuments = jest.fn()
const mockFromDocuments = jest.fn()

jest.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('langchain/vectorstores/memory', () => ({
  MemoryVectorStore: {
    fromDocuments: mockFromDocuments,
  },
}))

jest.mock('@/lib/vector-store', () => ({
  setVectorStore: jest.fn(),
  getVectorStore: jest.fn(),
  clearVectorStore: jest.fn(),
}))

import { POST } from '@/app/api/embed-cv/route'
import { setVectorStore } from '@/lib/vector-store'

describe('POST /api/embed-cv', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 if markdown is missing', async () => {
    const req = new Request('http://localhost/api/embed-cv', {
      method: 'POST',
      body: JSON.stringify({ threadId: 'thread-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 if threadId is missing', async () => {
    const req = new Request('http://localhost/api/embed-cv', {
      method: 'POST',
      body: JSON.stringify({ markdown: 'some text' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 503 if OPENAI_API_KEY is not set', async () => {
    const original = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    const req = new Request('http://localhost/api/embed-cv', {
      method: 'POST',
      body: JSON.stringify({ markdown: 'some text', threadId: 'thread-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(503)

    process.env.OPENAI_API_KEY = original
  })

  it('chunks, embeds, stores, and returns chunkCount', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    const fakeStore = { similaritySearch: jest.fn() }
    mockFromDocuments.mockResolvedValue(fakeStore)

    const req = new Request('http://localhost/api/embed-cv', {
      method: 'POST',
      body: JSON.stringify({
        markdown: 'Work Experience\n\nSoftware Engineer at Acme Corp 2020-2023\n\nEducation\n\nBS Computer Science',
        threadId: 'thread-abc',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(typeof body.chunkCount).toBe('number')
    expect(body.chunkCount).toBeGreaterThan(0)
    expect(setVectorStore).toHaveBeenCalledWith('thread-abc', fakeStore)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/app/api/embed-cv/route.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/app/api/embed-cv/route'`

- [ ] **Step 3: Create `src/app/api/embed-cv/route.ts`**

```ts
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { setVectorStore } from '@/lib/vector-store'

export async function POST(req: Request) {
  let body: { markdown?: string; threadId?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { markdown, threadId } = body
  if (!markdown || !threadId) {
    return Response.json({ error: 'markdown and threadId are required' }, { status: 400 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'Embedding not configured' }, { status: 503 })
  }

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
  const docs = await splitter.createDocuments([markdown])

  const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const store = await MemoryVectorStore.fromDocuments(docs, embeddings)
  setVectorStore(threadId, store)

  return Response.json({ success: true, chunkCount: docs.length })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/app/api/embed-cv/route.test.ts --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/embed-cv/route.ts __tests__/app/api/embed-cv/route.test.ts
git commit -m "feat: add embed-cv route — chunk, embed, store CV in MemoryVectorStore"
```

---

## Task 3: Extend `/api/parse-cv` to return `markdownContent`

**Files:**
- Modify: `src/app/api/parse-cv/route.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `markdownContent` to `ParsedResumeResult` type**

In `src/types/index.ts`, update `ParsedResumeResult`:

```ts
export interface ParsedResumeResult {
  profile: Partial<UserProfile>
  currentSkills: CurrentSkill[]
  rawSummary: string  // 1-2 sentence summary of candidate
  markdownContent?: string  // raw vision model output for embedding
}
```

- [ ] **Step 2: Update `src/app/api/parse-cv/route.ts` to return `markdownContent`**

The full updated file:

```ts
/**
 * POST /api/parse-cv
 * Sends PDF page images to a vision model and returns structured CV data.
 * Uses OpenRouter vision-capable model (defaults to gemini-2.0-flash-001).
 */

const EXTRACTION_PROMPT = `You are analyzing a CV/resume. Extract all information and return ONLY valid JSON — no markdown, no explanation:
{
  "profile": {
    "name": "candidate's full name or null",
    "location": "city, country or null",
    "background": "1-sentence summary of their current role or studies",
    "targetRole": "desired job title if mentioned, otherwise infer from their strongest background",
    "currentLevel": "student|junior|mid|senior"
  },
  "currentSkills": [
    { "name": "skill name", "currentLevel": 5 }
  ],
  "rawSummary": "2-3 sentences describing this candidate's profile, experience depth, and key strengths"
}

Read the entire CV carefully: education, work history, skills sections, certifications, projects, and achievements. Estimate skill levels 1-10 based on experience depth and recency. List all technical, business, and soft skills visible.`

export async function POST(req: Request) {
  const { imageDataUrls, fileName } = await req.json() as {
    imageDataUrls: string[]
    fileName: string
  }

  if (!Array.isArray(imageDataUrls) || imageDataUrls.length === 0) {
    return Response.json({ error: 'No images provided' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return Response.json({ error: 'OpenRouter API key not configured' }, { status: 503 })
  }

  // Use a vision-capable model — flash-001 has better vision than lite
  const model =
    process.env.OPENROUTER_VISION_MODEL ??
    (process.env.OPENROUTER_MODEL?.includes('lite')
      ? 'google/gemini-2.0-flash-001'
      : process.env.OPENROUTER_MODEL) ??
    'google/gemini-2.0-flash-001'

  const imageMessages = imageDataUrls.slice(0, 3).map((url: string) => ({
    type: 'image_url' as const,
    image_url: { url },
  }))

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          content: [{ type: 'text', text: EXTRACTION_PROMPT }, ...imageMessages],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Vision model error:', err)
    return Response.json({ error: 'Vision model error' }, { status: 502 })
  }

  const data = await response.json()
  // Save raw content before JSON extraction — used as markdownContent for embedding
  const content: string = data.choices?.[0]?.message?.content ?? ''

  // Extract JSON — model may wrap in ```json fences
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('No JSON in vision response:', content)
    return Response.json({ error: 'Could not parse model response' }, { status: 502 })
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    // Return markdownContent as the raw vision output for downstream embedding
    return Response.json({ ...parsed, markdownContent: content })
  } catch {
    return Response.json({ error: 'Invalid JSON from model' }, { status: 502 })
  }
}
```

- [ ] **Step 3: Run existing tests to verify nothing broke**

```bash
npx jest --no-coverage
```

Expected: all existing tests still PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/parse-cv/route.ts src/types/index.ts
git commit -m "feat: parse-cv returns markdownContent for downstream embedding"
```

---

## Task 4: Add `createSearchResumeTool` to `tools.ts`

**Files:**
- Modify: `src/lib/tools.ts`
- Modify: `__tests__/lib/tools.test.ts` (add test)

- [ ] **Step 1: Write the updated `__tests__/lib/tools.test.ts`**

Replace the full file. The key changes: add `jest.mock('@/lib/vector-store')` (Jest hoists this), import `createSearchResumeTool` and `vectorStore`, add the new describe block at the end.

```ts
/**
 * @jest-environment node
 */
jest.mock('@/lib/vector-store')

import { skillGapAnalysisTool, learningPathTool, expertMatchTool, careerInsightTool, updateProfileTool, createSearchResumeTool } from '@/lib/tools'
import * as vectorStore from '@/lib/vector-store'

describe('skillGapAnalysisTool', () => {
  it('matches AI/ML Engineer at NEOM for ML target role', async () => {
    const result = await skillGapAnalysisTool.invoke({
      studentSkills: [{ name: 'Python', currentLevel: 4 }],
      targetRole: 'AI/ML Engineer',
    })
    expect(result.role.company).toBe('NEOM')
    expect(result.gaps).toBeInstanceOf(Array)
    expect(result.gaps.length).toBeGreaterThan(0)
    expect(result.overallReadiness).toBeGreaterThanOrEqual(0)
    expect(result.overallReadiness).toBeLessThanOrEqual(100)
  })

  it('computes severity: high if gap >= 4', async () => {
    const result = await skillGapAnalysisTool.invoke({
      studentSkills: [{ name: 'Python', currentLevel: 2 }],
      targetRole: 'AI ML',
    })
    const python = result.gaps.find((g: { skill: string }) => g.skill === 'Python')
    expect(python?.severity).toBe('high')
  })

  it('handles unknown role by matching closest role', async () => {
    const result = await skillGapAnalysisTool.invoke({
      studentSkills: [],
      targetRole: 'data science',
    })
    expect(result.role).toBeDefined()
    expect(result.gaps.length).toBeGreaterThan(0)
  })
})

describe('learningPathTool', () => {
  it('returns 3 phases with skills and resources', async () => {
    const result = await learningPathTool.invoke({
      targetRole: 'Cloud Engineer',
      topGaps: ['AWS', 'Terraform', 'Linux'],
    })
    expect(result.phases).toHaveLength(3)
    result.phases.forEach((phase: { skills: string[]; resources: unknown[] }) => {
      expect(phase.skills.length).toBeGreaterThan(0)
      expect(phase.resources.length).toBeGreaterThan(0)
    })
    expect(result.totalDuration).toBeTruthy()
  })

  it('includes mix of localized and external resources', async () => {
    const result = await learningPathTool.invoke({
      targetRole: 'Cloud Engineer',
      topGaps: ['AWS'],
    })
    const allResources = result.phases.flatMap((p: { resources: Array<{ type: string }> }) => p.resources)
    const types = allResources.map((r: { type: string }) => r.type)
    expect(types).toContain('localized')
    expect(types).toContain('external')
  })
})

describe('expertMatchTool', () => {
  it('returns up to 3 experts with matchScore and matchReason', async () => {
    const result = await expertMatchTool.invoke({
      targetRole: 'Data Analyst',
      careerGoal: 'Work in data analytics at an oil company in Saudi Arabia',
    })
    expect(result.experts.length).toBeGreaterThanOrEqual(1)
    expect(result.experts.length).toBeLessThanOrEqual(3)
    result.experts.forEach((e: { matchScore: number; matchReason: string }) => {
      expect(e.matchScore).toBeGreaterThanOrEqual(0)
      expect(e.matchScore).toBeLessThanOrEqual(100)
      expect(e.matchReason).toBeTruthy()
    })
  })

  it('ranks Fatima Al-Rashidi highly for data/aramco goal', async () => {
    const result = await expertMatchTool.invoke({
      targetRole: 'Data Analyst',
      careerGoal: 'Data science at Saudi Aramco',
    })
    expect(result.experts[0].name).toBe('Fatima Al-Rashidi')
  })
})

describe('careerInsightTool', () => {
  it('returns an insight for python topic', async () => {
    const result = await careerInsightTool.invoke({ topic: 'python' })
    expect(result.stat).toBeTruthy()
    expect(result.source).toBeTruthy()
  })

  it('returns fallback for unknown topic', async () => {
    const result = await careerInsightTool.invoke({ topic: 'completely unknown xyz' })
    expect(result.stat).toBeTruthy()
  })
})

describe('updateProfileTool', () => {
  it('returns the same fields passed in', async () => {
    const result = await updateProfileTool.invoke({ name: 'Ahmed', location: 'Riyadh', targetRole: 'AI/ML Engineer' })
    expect(result.name).toBe('Ahmed')
    expect(result.location).toBe('Riyadh')
    expect(result.targetRole).toBe('AI/ML Engineer')
  })
})

describe('createSearchResumeTool', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns no-context message when no store exists', async () => {
    jest.spyOn(vectorStore, 'getVectorStore').mockReturnValue(undefined)
    const searchTool = createSearchResumeTool('thread-1')
    const result = await searchTool.invoke({ query: 'certifications' })
    const parsed = typeof result === 'string' ? JSON.parse(result) : result
    expect(parsed.message).toBe('No CV context loaded')
  })

  it('returns chunks from vector store', async () => {
    const mockStore = {
      similaritySearch: jest.fn().mockResolvedValue([
        { pageContent: 'AWS Certified Solutions Architect' },
        { pageContent: 'GCP Professional Data Engineer' },
      ]),
    }
    jest.spyOn(vectorStore, 'getVectorStore').mockReturnValue(mockStore as any)
    const searchTool = createSearchResumeTool('thread-2')
    const result = await searchTool.invoke({ query: 'cloud certifications' })
    const parsed = typeof result === 'string' ? JSON.parse(result) : result
    expect(parsed.source).toBe('cv')
    expect(parsed.chunks).toContain('AWS Certified Solutions Architect')
  })
})
```

- [ ] **Step 3: Run the new tests to verify they fail**

```bash
npx jest __tests__/lib/tools.test.ts --no-coverage
```

Expected: FAIL — `createSearchResumeTool is not a function`

- [ ] **Step 4: Add `createSearchResumeTool` to `src/lib/tools.ts`**

Add these imports at the top of `src/lib/tools.ts` (after existing imports):

```ts
import { getVectorStore } from '@/lib/vector-store'
```

Add this factory function before the `allTools` export:

```ts
export function createSearchResumeTool(threadId: string) {
  return tool(
    async ({ query, k = 4 }: { query: string; k?: number }) => {
      const store = getVectorStore(threadId)
      if (!store) return { message: 'No CV context loaded' }
      const docs = await store.similaritySearch(query, k)
      return { chunks: docs.map(d => d.pageContent), source: 'cv' as const }
    },
    {
      name: 'search_resume',
      description: 'Search the uploaded CV for specific details (certifications, projects, companies, dates, experience). Call this when you need precise information from the CV rather than relying on the initial parse summary.',
      schema: z.object({
        query: z.string().describe('What to search for in the CV'),
        k: z.number().optional().describe('Number of results to return (default 4)'),
      }),
    }
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx jest __tests__/lib/tools.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/tools.ts __tests__/lib/tools.test.ts
git commit -m "feat: add createSearchResumeTool factory with vector store retrieval"
```

---

## Task 5: Refactor `graph.ts` to `createGraph(threadId)` factory

**Files:**
- Modify: `src/lib/graph.ts`
- Modify: `__tests__/lib/graph.test.ts`

- [ ] **Step 1: Update `__tests__/lib/graph.test.ts`**

Replace the full file content:

```ts
/**
 * @jest-environment node
 */
import { createGraph } from '@/lib/graph'

describe('LangGraph createGraph', () => {
  it('compiles without throwing', () => {
    const graph = createGraph('test-thread')
    expect(graph).toBeDefined()
  })

  it('has stream and invoke methods', () => {
    const graph = createGraph('test-thread')
    expect(typeof graph.stream).toBe('function')
    expect(typeof graph.invoke).toBe('function')
  })

  it('creates isolated graphs per threadId', () => {
    const g1 = createGraph('thread-1')
    const g2 = createGraph('thread-2')
    expect(g1).not.toBe(g2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/graph.test.ts --no-coverage
```

Expected: FAIL — `createGraph is not a function`

- [ ] **Step 3: Rewrite `src/lib/graph.ts`**

```ts
import { StateGraph, MessagesAnnotation, Annotation } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { SystemMessage, AIMessage } from '@langchain/core/messages'
import { allTools, createSearchResumeTool } from './tools'
import { systemPrompt } from './system-prompt'

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
})

const model = new ChatOpenAI({
  modelName: process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-lite-001',
  openAIApiKey: process.env.OPENROUTER_API_KEY ?? 'placeholder-not-used-in-tests',
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://localized.world',
      'X-Title': 'Localized AI Career Coach',
    },
  },
  temperature: 0.7,
})

// Shared across all graph instances — maintains conversation history per thread_id
const checkpointer = new MemorySaver()

function shouldContinue(state: typeof StateAnnotation.State): 'tools' | '__end__' {
  const lastMessage = state.messages.at(-1) as AIMessage
  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) return 'tools'
  return '__end__'
}

export function createGraph(threadId: string) {
  const searchResumeTool = createSearchResumeTool(threadId)
  const tools = [...allTools, searchResumeTool]
  const modelWithTools = model.bindTools(tools)
  const toolNode = new ToolNode(tools)

  async function callAgent(state: typeof StateAnnotation.State) {
    const response = await modelWithTools.invoke([new SystemMessage(systemPrompt), ...state.messages])
    return { messages: [response] }
  }

  return new StateGraph(StateAnnotation)
    .addNode('agent', callAgent)
    .addNode('tools', toolNode)
    .addEdge('__start__', 'agent')
    .addConditionalEdges('agent', shouldContinue, { tools: 'tools', __end__: '__end__' })
    .addEdge('tools', 'agent')
    .compile({ checkpointer })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/graph.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/graph.ts __tests__/lib/graph.test.ts
git commit -m "refactor: graph.ts — singleton → createGraph(threadId) factory"
```

---

## Task 6: Update system prompt + chat route

**Files:**
- Modify: `src/lib/system-prompt.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `__tests__/app/api/chat/route.test.ts`

- [ ] **Step 1: Update `src/lib/system-prompt.ts`**

In the `## Available Tools` section, add `search_resume` entry after `parse_resume`:

Find:
```
- parse_resume: Extract profile and skills from uploaded CV text
```

Replace with:
```
- parse_resume: Extract profile and skills from uploaded CV text
- search_resume: Search the uploaded CV for specific details (certifications, projects, companies, dates, experience). Call this when you need precise information from the CV that wasn't captured in the initial parse.
```

Also add to `## Behavior Rules` section — insert after rule 3 (the CV upload rule):

Find:
```
3. When a user uploads a CV — immediately call parse_resume with the CV text, then call skill_gap_analysis with the extracted skills and target role.
```

Replace with:
```
3. When a user uploads a CV — immediately call parse_resume with the CV text, then call skill_gap_analysis with the extracted skills and target role.

3b. When you need precise CV details (specific certifications, project names, exact dates, company names, GPA) — call search_resume with a descriptive query rather than guessing from the parse summary.
```

- [ ] **Step 2: Update `__tests__/app/api/chat/route.test.ts`** to mock `createGraph` instead of `graph`

Replace the mock section at the top:

```ts
jest.mock('@/lib/graph', () => ({
  createGraph: jest.fn(() => ({ stream: jest.fn() })),
}))

import { createGraph } from '@/lib/graph'
```

Update the helper that dereferences `graph.stream` to use `createGraph`:

```ts
// Replace: (graph.stream as jest.Mock).mockResolvedValue(...)
// With:    (createGraph as jest.Mock).mockReturnValue({ stream: ... })
```

Full updated test file:

```ts
/**
 * @jest-environment node
 */
import { POST } from '@/app/api/chat/route'

const mockStream = jest.fn()

jest.mock('@/lib/graph', () => ({
  createGraph: jest.fn(() => ({ stream: mockStream })),
}))

async function collectSSE(response: Response): Promise<string[]> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value)
  }
  return result.split('\n').filter(l => l.startsWith('data: ')).map(l => l.slice(6))
}

describe('POST /api/chat', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 if messages is missing', async () => {
    const req = new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({}) })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 if threadId is missing', async () => {
    const req = new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({ messages: [] }) })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('streams text events for AI text chunks', async () => {
    const mockChunk = { _getType: () => 'ai', content: 'Hello from the AI', tool_calls: [], tool_call_chunks: [] }
    mockStream.mockResolvedValue((async function* () { yield [mockChunk, {}] })())

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }], threadId: 'test-123' }),
    })
    const res = await POST(req)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')
    const events = await collectSSE(res)
    const textEvent = events.find(e => { try { return JSON.parse(e).type === 'text' } catch { return false } })
    expect(textEvent).toBeDefined()
    expect(JSON.parse(textEvent!).content).toBe('Hello from the AI')
    expect(events.at(-1)).toBe('[DONE]')
  })

  it('streams tool_call event when AI initiates a tool call', async () => {
    const mockChunk = { _getType: () => 'ai', content: '', tool_calls: [], tool_call_chunks: [{ name: 'skill_gap_analysis', id: 'call_123', args: '' }] }
    mockStream.mockResolvedValue((async function* () { yield [mockChunk, {}] })())

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Analyze' }], threadId: 'test-456' }),
    })
    const res = await POST(req)
    const events = await collectSSE(res)
    const toolEvent = events.find(e => { try { return JSON.parse(e).type === 'tool_call' } catch { return false } })
    expect(toolEvent).toBeDefined()
    expect(JSON.parse(toolEvent!).name).toBe('skill_gap_analysis')
  })

  it('streams error event and [DONE] when graph throws', async () => {
    mockStream.mockResolvedValue((async function* () { throw new Error('API error') })())

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }], threadId: 'test-789' }),
    })
    const res = await POST(req)
    const events = await collectSSE(res)
    const errorEvent = events.find(e => { try { return JSON.parse(e).type === 'error' } catch { return false } })
    expect(errorEvent).toBeDefined()
    expect(events.at(-1)).toBe('[DONE]')
  })
})
```

- [ ] **Step 3: Run updated route test to verify it fails**

```bash
npx jest __tests__/app/api/chat/route.test.ts --no-coverage
```

Expected: FAIL — `createGraph is not a function` (route still uses old `graph`)

- [ ] **Step 4: Update `src/app/api/chat/route.ts`**

```ts
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { createGraph } from '@/lib/graph'
import type { SSEEvent } from '@/types'

const encoder = new TextEncoder()

function send(controller: ReadableStreamDefaultController, event: SSEEvent) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
}

export async function POST(req: Request) {
  let body: { messages?: Array<{ role: string; content: string }>; threadId?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages, threadId } = body
  if (!messages || !threadId) {
    return Response.json({ error: 'messages and threadId are required' }, { status: 400 })
  }

  const graph = createGraph(threadId)
  const lcMessages = messages.map(m =>
    m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
  )

  const config = { configurable: { thread_id: threadId } }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await graph.stream(
          { messages: lcMessages },
          { ...config, streamMode: 'messages' }
        )

        for await (const [chunk, _metadata] of stream) {
          const chunkType = chunk._getType?.()

          if (chunkType === 'ai') {
            if (typeof chunk.content === 'string' && chunk.content) {
              send(controller, { type: 'text', content: chunk.content })
            } else if (Array.isArray(chunk.content)) {
              for (const block of chunk.content) {
                if (block.type === 'text' && block.text) {
                  send(controller, { type: 'text', content: block.text })
                }
              }
            }
          }

          if (chunk.tool_call_chunks?.length) {
            for (const tc of chunk.tool_call_chunks) {
              if (tc.name) send(controller, { type: 'tool_call', name: tc.name, id: tc.id ?? '' })
            }
          }

          if (chunkType === 'tool') {
            try {
              send(controller, { type: 'tool_result', name: chunk.name, id: chunk.tool_call_id, result: JSON.parse(chunk.content) })
            } catch {
              send(controller, { type: 'tool_result', name: chunk.name, id: chunk.tool_call_id, result: chunk.content })
            }
          }
        }
      } catch (e) {
        console.error('[chat/route] stream error:', e)
        send(controller, { type: 'error', message: `Error: ${e instanceof Error ? e.message : String(e)}` })
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

- [ ] **Step 5: Run all tests to verify everything passes**

```bash
npx jest --no-coverage
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/system-prompt.ts src/app/api/chat/route.ts __tests__/app/api/chat/route.test.ts
git commit -m "feat: wire createGraph into chat route, update system prompt with search_resume"
```

---

## Task 7: localStorage persistence — stable threadId + message history

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/chat/ChatInterface.tsx`

- [ ] **Step 1: Update `src/app/page.tsx` for stable threadId**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { UserProfile } from '@/types'

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [threadId, setThreadId] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('localized_thread_id')
    const id = stored ?? crypto.randomUUID()
    if (!stored) localStorage.setItem('localized_thread_id', id)
    setThreadId(id)
  }, [])

  const handleProfileUpdate = (update: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...update }))
  }

  if (!threadId) return null

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar profile={userProfile} />
        <ChatInterface
          threadId={threadId}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add message persistence + CV re-embed to `ChatInterface.tsx`**

Find the `messages` state initialization at the top of `ChatInterface`:

```ts
const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage])
```

Replace with:

```ts
const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage])
const [showStarterCards, setShowStarterCards] = useState(true)
```

Wait — `showStarterCards` is already declared further down. Instead, just update the state initialization and add the effects. Here is the full updated `ChatInterface.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage, UserProfile, ParsedResumeResult } from '@/types'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { StarterCards } from '@/components/chat/StarterCards'
import { QuickActions } from '@/components/chat/QuickActions'
import { pdfToImages, extractTextFromFile } from '@/lib/pdf-utils'

interface ChatInterfaceProps {
  threadId: string
  onProfileUpdate: (profile: Partial<UserProfile>) => void
}

const initialWelcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `مرحباً! I'm your **Localized AI Career Coach**, specialized in MENA job markets and career opportunities across the GCC.\n\nUpload your CV for instant analysis, or tell me about your background and goals — I'll map your skill gaps, build a learning path, and connect you with expert mentors.`,
  toolResults: [],
  segments: [{ type: 'text', content: `مرحباً! I'm your **Localized AI Career Coach**, specialized in MENA job markets and career opportunities across the GCC.\n\nUpload your CV for instant analysis, or tell me about your background and goals — I'll map your skill gaps, build a learning path, and connect you with expert mentors.` }]
}

export function ChatInterface({ threadId, onProfileUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage])
  const [isLoading, setIsLoading] = useState(false)
  const [showStarterCards, setShowStarterCards] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Restore messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`localized_messages_${threadId}`)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[]
        if (parsed.length > 0) {
          setMessages(parsed)
          setShowStarterCards(false)
        }
      }
    } catch {
      // Ignore parse errors — start fresh
    }
  }, [threadId])

  // Persist messages to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(`localized_messages_${threadId}`, JSON.stringify(messages))
    } catch {
      // Ignore write errors (e.g. storage quota exceeded)
    }
  }, [messages, threadId])

  // Re-embed CV markdown on mount if available (restores vector store after refresh)
  useEffect(() => {
    const markdown = localStorage.getItem(`localized_cv_markdown_${threadId}`)
    if (!markdown) return
    fetch('/api/embed-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown, threadId }),
    }).catch(() => {
      // Silent failure — agent will work without vector search
    })
  }, [threadId])

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  /** Stream /api/chat SSE into the last message in state (by assistantId). */
  const streamAgentResponse = async (
    messagesToSend: ChatMessage[],
    assistantId: string
  ) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messagesToSend, threadId })
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed === 'data: [DONE]') { setIsLoading(false); continue }
        if (!trimmed.startsWith('data: ')) continue
        let event: { type: string; content?: string; name?: string; id?: string; result?: unknown; message?: string }
        try { event = JSON.parse(trimmed.slice('data: '.length)) } catch { continue }
        setMessages(prev => {
          const next = [...prev]
          const idx = next.findIndex(m => m.id === assistantId)
          if (idx === -1) return prev
          const last = { ...next[idx] }
          next[idx] = last
          if (event.type === 'text' && event.content) {
            last.content = last.content + event.content
            last.isScanning = false
            const segs = [...last.segments]
            const lastSeg = segs[segs.length - 1]
            if (lastSeg?.type === 'text') {
              segs[segs.length - 1] = { type: 'text', content: lastSeg.content + event.content }
            } else {
              segs.push({ type: 'text', content: event.content })
            }
            last.segments = segs
          } else if (event.type === 'tool_call' && event.id && event.name) {
            last.isScanning = false
            last.toolResults = [...last.toolResults, { id: event.id, toolName: event.name, status: 'loading', result: null }]
            last.segments = [...last.segments, { type: 'tool', toolResultId: event.id }]
          } else if (event.type === 'tool_result' && event.id) {
            last.toolResults = last.toolResults.map(tr =>
              tr.id === event.id ? { ...tr, status: 'done', result: event.result ?? null } : tr
            )
            if (event.name === 'update_profile') onProfileUpdate(event.result as Partial<UserProfile>)
            if (event.name === 'parse_resume') {
              const r = event.result as { profile?: Partial<UserProfile> }
              if (r?.profile) onProfileUpdate(r.profile)
            }
          } else if (event.type === 'error' && event.message) {
            last.isScanning = false
            last.content = last.content + event.message
          }
          return next
        })
      }
    }
    if (buffer.trim() === 'data: [DONE]') setIsLoading(false)
  }

  const sendMessage = async (content: string) => {
    setShowStarterCards(false)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      toolResults: [],
      segments: []
    }
    const updatedMessages = [...messages, userMessage]
    setIsLoading(true)
    const assistantId = (Date.now() + 1).toString()
    const emptyAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolResults: [],
      segments: []
    }
    setMessages([...updatedMessages, emptyAssistant])
    await streamAgentResponse(updatedMessages, assistantId)
  }

  /** Vision-based PDF upload: renders pages to images, sends to /api/parse-cv, then embeds, then agent. */
  const handlePDFVision = async (file: File) => {
    setShowStarterCards(false)
    setIsLoading(true)

    // 1. Render PDF pages to images
    let pageImages: string[] = []
    let pageCount = 0
    try {
      const result = await pdfToImages(file)
      pageImages = result.images
      pageCount = result.pageCount
    } catch {
      try {
        const text = await extractTextFromFile(file)
        if (text.trim()) {
          await handleCVTextUpload(text, file.name)
        } else {
          await handleCVTextUpload(
            `[The file "${file.name}" could not be read. It may not be a valid PDF. Please export your CV as PDF from Word or Google Docs and try again.]`,
            file.name
          )
        }
      } catch {
        await handleCVTextUpload(
          `[The file "${file.name}" could not be read. Please make sure it is a valid PDF — export from Word or Google Docs as PDF and try again.]`,
          file.name
        )
      }
      setIsLoading(false)
      return
    }

    // 2. Snapshot current messages before we add new ones
    const previousMessages = messages

    // 3. Add user message with CV thumbnail + scanning assistant message
    const cvUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Uploaded CV: ${file.name}`,
      toolResults: [],
      segments: [],
      cvAttachment: { fileName: file.name, pageCount, pageImages }
    }
    const assistantId = (Date.now() + 1).toString()
    const scanningAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolResults: [],
      segments: [],
      isScanning: true
    }
    setMessages(prev => [...prev, cvUserMsg, scanningAssistant])

    // 4. Call vision parse endpoint
    let parsedCV: Partial<ParsedResumeResult & { currentSkills: Array<{ name: string; currentLevel: number }> }> = {}
    try {
      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrls: pageImages, fileName: file.name })
      })
      if (res.ok) {
        parsedCV = await res.json()
        if (parsedCV.profile) onProfileUpdate(parsedCV.profile)

        // 5. Embed the CV markdown for vector search (fire-and-forget, non-blocking)
        const markdown = parsedCV.markdownContent
        if (markdown) {
          // Save to localStorage for re-embed on refresh
          try {
            localStorage.setItem(`localized_cv_markdown_${threadId}`, markdown)
          } catch {}
          // Embed in background — don't await, agent call proceeds regardless
          fetch('/api/embed-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown, threadId }),
          }).catch(() => {})
        }
      }
    } catch {
      // Continue even if vision parse fails — agent will still respond
    }

    // 6. Build context message for agent
    const skillsList = (parsedCV as { currentSkills?: Array<{ name: string }> }).currentSkills
      ?.map((s: { name: string }) => s.name)
      .join(', ') ?? ''
    const summary = parsedCV.rawSummary ? `Vision analysis: ${parsedCV.rawSummary}` : ''
    const skillsLine = skillsList ? `Detected skills: ${skillsList}.` : ''
    const agentMessage =
      `I've uploaded my CV (${file.name}). ${summary} ${skillsLine} Please analyze my background, run a skill gap analysis for my target role, and give me a comprehensive career assessment.`.trim()

    // 7. Send to agent
    const agentTextMsg: ChatMessage = {
      id: cvUserMsg.id,
      role: 'user',
      content: agentMessage,
      toolResults: [],
      segments: []
    }
    await streamAgentResponse([...previousMessages, agentTextMsg], assistantId)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const name = file.name.toLowerCase()
    const isPDF = file.type === 'application/pdf' || name.endsWith('.pdf')
    const isDocx = file.type.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')

    if (isPDF) {
      await handlePDFVision(file)
    } else if (isDocx) {
      await handleCVTextUpload(
        `[Word document detected: "${file.name}". For best results, please export your CV as PDF from Word (File → Save As → PDF) or Google Docs (File → Download → PDF), then upload the PDF.]`,
        file.name
      )
    } else {
      try {
        const text = await extractTextFromFile(file)
        if (text.trim()) await handleCVTextUpload(text, file.name)
      } catch {
        await handleCVTextUpload(`[Could not extract text from ${file.name}. Please paste your CV text directly.]`, file.name)
      }
    }
  }

  const handleCVTextUpload = async (text: string, fileName: string) => {
    setShowStarterCards(false)
    const cvMessage = `I've uploaded my CV (${fileName}). Here is the content:\n\n${text.slice(0, 3000)}\n\nPlease analyze my background, extract my profile, then run a skill gap analysis for my target role.`
    await sendMessage(cvMessage)
  }

  const handleCVUpload = async (text: string, fileName: string) => {
    await handleCVTextUpload(text, fileName)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bg">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      <MessageList messages={messages} />
      {showStarterCards && (
        <StarterCards
          onSend={sendMessage}
          onCVUpload={triggerFileUpload}
        />
      )}
      <QuickActions
        onSend={sendMessage}
        onCVUpload={triggerFileUpload}
        isLoading={isLoading}
      />
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        onCVUpload={handleCVUpload}
      />
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/chat/ChatInterface.tsx
git commit -m "feat: localStorage persistence — stable threadId, message history, CV re-embed on refresh"
```

---

## Task 8: Environment variables + final verification

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update `.env.example`**

```bash
# OpenRouter API key — get yours at https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Model to use — must support tool/function calling
# Cheapest options (all support tool calling):
#
#   FREE (rate-limited, great for demos):
#   meta-llama/llama-3.3-70b-instruct:free   FREE        ~200 req/day, solid tool calling
#
#   PAID (sorted by cost):
#   google/gemini-2.0-flash-lite-001         $0.075/M    cheapest paid, 1M ctx, fast
#   google/gemini-2.0-flash-001              $0.10/M     larger context, very reliable
#   meta-llama/llama-3.3-70b-instruct        $0.10/M     excellent reasoning
#   mistralai/mistral-small-2603             $0.15/M     strong instruction following
#   anthropic/claude-3.5-haiku               $0.80/M     best tool calling quality
#
#   ⚠️  AVOID: deepseek/deepseek-chat-v3-0324 does NOT support tool calling on OpenRouter
#
OPENROUTER_MODEL=google/gemini-2.0-flash-lite-001

# Vision model for CV/PDF parsing (must support image input)
# Defaults to flash-001 (better vision than lite) if not set
OPENROUTER_VISION_MODEL=google/gemini-2.0-flash-001

# OpenAI API key — used for CV embedding (text-embedding-3-small)
# Get yours at https://platform.openai.com/api-keys
# If not set, the agent works without vector search (graceful degradation)
OPENAI_API_KEY=your_openai_api_key_here
```

- [ ] **Step 2: Run full test suite one final time**

```bash
npx jest --no-coverage
```

Expected: all tests PASS

- [ ] **Step 3: Verify the dev server starts**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000 with no TypeScript errors

- [ ] **Step 4: Final commit**

```bash
git add .env.example
git commit -m "docs: add OPENAI_API_KEY to env.example for embedding feature"
```
