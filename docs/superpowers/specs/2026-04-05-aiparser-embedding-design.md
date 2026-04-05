# AIParser Embedding Integration Design

**Date:** 2026-04-05
**Project:** Localized AI Career Coach Demo
**Status:** Approved

## Summary

Port the aiparser vision+embedding framework from LungCareAI into the Career Coach Demo. PDF resumes are parsed by a vision model into rich markdown, chunked and embedded into an in-memory vector store, and the chat agent gains a `search_resume` tool for on-demand retrieval throughout the conversation. Chat messages and CV markdown are persisted in `localStorage` so the experience survives page refreshes.

---

## Architecture

```
PDF upload
    │
    ├─ pdfToImages() [existing, client-side, pdfjs-dist]
    │       │
    │       ▼
    │  POST /api/parse-cv [existing — extended]
    │  vision model → { profile, currentSkills, rawSummary, markdownContent }
    │       │
    │       ▼
    │  POST /api/embed-cv [NEW]
    │  markdown → RecursiveCharacterTextSplitter
    │           → OpenAIEmbeddings (text-embedding-3-small)
    │           → MemoryVectorStore
    │           stored in Map<threadId, VectorStore> singleton
    │       │
    │       ▼
    │  localStorage: save markdownContent + threadId + messages
    │
Chat agent (LangGraph graph.ts)
    ├─ search_resume({ query }) [NEW TOOL]
    │  → POST /api/search-resume → similarity search → top-k chunks
    ├─ parse_resume [existing, unchanged — quick structured extraction]
    └─ all other tools [unchanged]

Page refresh:
    localStorage → restore threadId + messages
                → if CV markdown exists: silently POST /api/embed-cv
                → vector store rebuilt, conversation continues
```

---

## Section 1: `/api/parse-cv` Extension

**Change:** return `markdownContent` alongside the existing structured JSON.

The vision model already returns raw text in `choices[0].message.content`. Currently we immediately parse it as JSON. We change the prompt slightly so the model returns two things — the JSON and the full markdown reading — OR we make a second simpler call that just returns the markdown.

**Decision:** single call, modified prompt. The model returns JSON as before, but we also keep the raw `content` before JSON extraction as `markdownContent`.

**Input:** `{ imageDataUrls: string[], fileName: string }`

**Output:**
```ts
{
  profile: { name, location, background, targetRole, currentLevel },
  currentSkills: Array<{ name: string, currentLevel: number }>,
  rawSummary: string,
  markdownContent: string   // NEW: full text content from vision model
}
```

**Note:** `markdownContent` is the raw vision model output before JSON extraction — it contains the full CV reading in natural language, which is richer for semantic search than the structured JSON fields.

---

## Section 2: `/api/embed-cv` (New Route)

**File:** `src/app/api/embed-cv/route.ts`

**Responsibility:** chunk → embed → store in-memory vector store keyed by threadId.

**Chunking:**
- Library: `RecursiveCharacterTextSplitter` from `langchain/text_splitter`
- Chunk size: 500 characters
- Overlap: 50 characters
- CV sections (Education, Experience, Skills, etc.) map naturally to paragraph breaks

**Embedding:**
- Model: `text-embedding-3-small` via `OpenAIEmbeddings` from `@langchain/openai`
- API: direct OpenAI (`api.openai.com`), uses `OPENAI_API_KEY` env var
- Dimension: 1536

**Storage:**
- `MemoryVectorStore` from `langchain/vectorstores/memory`
- Module-level `Map<string, MemoryVectorStore>` singleton (keyed by `threadId`)
- Replaces existing entry on re-upload (new CV clears old vectors)

**Input:** `{ markdown: string, threadId: string }`

**Output:** `{ success: true, chunkCount: number }`

**Error handling:** if `OPENAI_API_KEY` is missing, return `{ error: 'Embedding not configured' }` with 503. Client degrades gracefully — agent still works, just without vector search.

---

## Section 3: `/api/search-resume` (New Route)

**File:** `src/app/api/search-resume/route.ts`

**Responsibility:** run similarity search against the thread's vector store, return top-k chunks.

**Input:** `{ query: string, threadId: string, k?: number }`

**Output:** `{ chunks: string[] }` (default k=4)

If no vector store exists for the threadId (e.g., no CV uploaded): return `{ chunks: [], message: 'No CV context loaded' }`.

---

## Section 4: `search_resume` Agent Tool

**File:** `src/lib/tools.ts` — add `searchResumeTool`

```ts
search_resume({ query: string }) → { chunks: string[], source: 'cv' } | { message: string }
```

The tool POSTs to `/api/search-resume` with the current `threadId`. The threadId is injected via tool config or passed through the graph state.

**When the agent calls it:**
- Looking up specific CV details: certifications, project names, exact dates, company names
- After initial parse, when a follow-up question requires precise CV context
- When a tool result references something from the CV that needs verification

**System prompt addition:**
```
- search_resume: Search the uploaded CV for specific details (certifications, projects, companies, dates). 
  Call this when you need precise information from the CV rather than relying on the initial parse summary.
```

**threadId injection:** Tools are stateless in the current setup. `searchResumeTool` needs the `threadId` to query the right vector store. Solution: export a `createSearchResumeTool(threadId: string)` factory from `tools.ts`. The chat route passes `threadId` (from the request body) into `createGraph(threadId)`, which creates the graph with a thread-scoped `searchResumeTool`. The graph singleton in `graph.ts` becomes a factory function.

**Placement in `allTools`:** added after `parseResumeTool`.

---

## Section 5: localStorage Persistence

**Keys (all scoped to a stable threadId):**
- `localized_thread_id` — the threadId, generated once, persisted forever
- `localized_messages_{threadId}` — serialized `ChatMessage[]`
- `localized_cv_markdown_{threadId}` — raw markdown string from `/api/parse-cv`

**ThreadId change:** currently generated as `crypto.randomUUID()` on each page load in `page.tsx`. Change to: read from `localStorage` first, generate and save if not present.

**Message persistence:**
- In `ChatInterface.tsx`: `useEffect` on `messages` → write to localStorage
- On mount: read from localStorage, initialize state (skip the welcome message if history exists)

**CV re-embedding on load:**
- On mount: if `localized_cv_markdown_{threadId}` exists → silently POST `/api/embed-cv`
- No visible UI for this — it's a background restore
- If embed fails (API key missing), conversation still loads — agent just falls back to text-based tools

**CV markdown save:**
- After successful `/api/parse-cv` response → save `markdownContent` to localStorage
- After new CV upload → overwrite existing key

---

## Section 6: Environment Variables

New required variable:
```
OPENAI_API_KEY=sk-...
```

Add to `.env.example`. The existing `OPENROUTER_API_KEY` is unchanged (still used for chat + vision model).

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/parse-cv/route.ts` | Return `markdownContent` in response |
| `src/app/api/embed-cv/route.ts` | New: chunk + embed + store |
| `src/app/api/search-resume/route.ts` | New: similarity search endpoint |
| `src/lib/tools.ts` | Add `createSearchResumeTool(threadId)` factory, export in `allTools` |
| `src/lib/graph.ts` | Change from singleton to `createGraph(threadId)` factory |
| `src/app/api/chat/route.ts` | Pass `threadId` to `createGraph(threadId)` |
| `src/lib/system-prompt.ts` | Add `search_resume` tool description |
| `src/app/page.tsx` | Stable threadId from localStorage |
| `src/components/chat/ChatInterface.tsx` | localStorage message persistence + CV markdown save + on-mount re-embed |
| `.env.example` | Add `OPENAI_API_KEY` |
| `package.json` | Add `langchain` text splitter import (already in deps) |

---

## Error & Degradation Paths

| Scenario | Behavior |
|----------|----------|
| `OPENAI_API_KEY` missing | `/api/embed-cv` returns 503, client skips embedding silently, agent works without `search_resume` |
| Vision parse fails | Falls back to text extraction (existing behavior) |
| Vector store missing for threadId | `search_resume` returns `{ message: 'No CV context loaded' }`, agent responds gracefully |
| localStorage unavailable | Fresh session on each load (SSR/private browsing) |
| CV re-embed fails on refresh | Conversation loads fine, agent uses text-based tools only |

---

## Out of Scope

- Persistent server-side vector store (Pinecone, Supabase)
- Embedding documents other than the user's CV
- Multi-user isolation beyond threadId keying
- Streaming from `/api/embed-cv`
