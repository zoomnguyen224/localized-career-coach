# Localized AI Career Coach

**A proof-of-concept that AI-first product strategy is not a roadmap item — it ships today.**

This is a fully working AI career coach built for Localized's MENA/Africa student and graduate audience. It is not a chatbot wrapper. It is a LangGraph ReAct agent that reads CVs with computer vision, reasons about MENA market data, uses 11 specialized tools, streams its work in real time, and materializes analysis as interactive visual components directly inside the conversation.

The demo is purpose-built to answer one question for leadership: *what does an AI-native career product actually look like in our market?*

---

## The Core Idea

Traditional career platforms show students a list of jobs and a skills checklist. This demo shows what happens when you replace that with an agent that can *think* about a student's specific situation — read their CV visually like a human recruiter would, understand the MENA job market, identify their skill gaps, map a personalized learning path, match them to expert mentors, benchmark their salary expectations, and coach them through real interview questions — all in a single, fluid conversation.

The UI is not a form. The AI output is not text. The analysis *becomes* the interface.

---

## Architecture

### Full Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│                                                                  │
│  User uploads PDF CV                                             │
│         │                                                        │
│         ▼                                                        │
│  pdfjs-dist (client-side)                                        │
│  Renders each PDF page to <canvas>                               │
│  Exports each page as base64 JPEG image                          │
│         │                                                        │
│         │  [ page images array ]                                 │
└─────────┼────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/parse-cv                                              │
│                                                                  │
│  Gemini Vision  (google/gemini-2.0-flash-001)                   │
│  Reads page images as a human recruiter would                    │
│                                                                  │
│  Returns:                                                        │
│  ├── Structured profile  (name, location, target role)          │
│  ├── Skills array        (name + inferred proficiency level)    │
│  ├── Work history        (companies, roles, dates, projects)    │
│  ├── Education           (degrees, institutions, certifications) │
│  └── Full markdown       (complete CV as structured text)       │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ├──────────────────────────────────────────────────────┐
           │  (immediate)                    (background, async)  │
           ▼                                                       ▼
  Sidebar populated                   POST /api/embed-cv
  instantly with                      Splits CV markdown into
  name, role, skills                  500-token chunks
                                      Embeds via text-embedding-3-small
                                      Stores in in-memory vector store
                                      keyed by thread_id

           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/chat                                                  │
│                                                                  │
│  Full conversation history sent each turn (client-managed)      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              LangGraph ReAct Agent                         │  │
│  │                                                            │  │
│  │   [system prompt: MENA market expert persona + rules]     │  │
│  │                    │                                       │  │
│  │              ┌─────▼──────┐                               │  │
│  │     ┌───────►│ agent node │◄──────────────────┐           │  │
│  │     │        └─────┬──────┘                   │           │  │
│  │     │              │                           │           │  │
│  │     │    tool_calls present?                   │           │  │
│  │     │         │           │                    │           │  │
│  │     │        YES          NO                   │           │  │
│  │     │         │           │                    │           │  │
│  │     │         ▼          END                   │           │  │
│  │     │   ┌───────────┐                          │           │  │
│  │     │   │ tools node│                          │           │  │
│  │     │   │           │──── result ──────────────┘           │  │
│  │     │   └─────┬─────┘                                      │  │
│  │     └─────────┘  (loop until no more tool calls)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          │  SSE event stream                     │
│        ┌─────────────────┼───────────────────┐                  │
│        │                 │                   │                   │
│   { type: text }   { type: tool_call }  { type: tool_result }   │
│   streamed token    name + id            name + id + result      │
│   by token          on invocation        on completion           │
└──────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GENERATIVE UI RENDERER                        │
│                                                                  │
│  Ordered segment queue preserves exact stream sequence:         │
│                                                                  │
│  "Let me analyze your skill gaps..."  ← text segment            │
│  ┌──────────────────────────────────┐                           │
│  │  Skill Gap Radar Chart + Table   │ ← React component         │
│  └──────────────────────────────────┘                           │
│  "Here is your 3-phase learning path..."  ← text segment        │
│  ┌──────────────────────────────────┐                           │
│  │  Learning Path Timeline          │ ← React component         │
│  └──────────────────────────────────┘                           │
│  "I found 3 mentors who match your profile..."                   │
│  ┌──────────────────────────────────┐                           │
│  │  Expert Mentor Cards             │ ← React component         │
│  └──────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

### Vision CV Parser — How It Actually Works

Most CV parsers use text extraction (PDF → text → regex). This breaks on columns, tables, multi-language layouts, logos, and non-standard fonts — all common in MENA CVs.

This demo takes a different approach: **render the PDF pages to images, then ask a vision model to read them.**

```
PDF file (any layout, any language)
        │
        ▼
pdfjs-dist  ── runs entirely in the browser, no server upload needed
        │      Renders each page to an HTML <canvas> element
        │      Exports each canvas as a JPEG data URL (base64)
        ▼
[ page_1.jpg, page_2.jpg, ... ]  ── one image per PDF page
        │
        ▼
Gemini Vision  (google/gemini-2.0-flash-001)
        │
        │  Prompt: "You are a professional CV parser.
        │   Extract: name, location, target role,
        │   work history, education, skills with
        │   proficiency levels, certifications.
        │   Also return the full CV as structured markdown."
        │
        ▼
{
  profile:  { name, location, targetRole, experienceYears },
  currentSkills: [ { name: "Python", currentLevel: 9 }, ... ],
  workHistory:   [ { company, role, start, end, highlights } ],
  education:     [ { degree, institution, year } ],
  markdownContent: "# Zoom Nguyen\n## Experience\n..."
}
```

The structured profile populates the sidebar instantly. The markdown is then chunked and embedded into a per-session in-memory vector store, enabling the agent to do **semantic search over the CV** throughout the conversation — retrieving exact company names, project details, certifications, and dates on demand without hallucinating.

---

### Semantic CV Search

After parsing, the full CV markdown is split into 500-token chunks and embedded using `text-embedding-3-small` via OpenRouter. The resulting `MemoryVectorStore` is held in-process and keyed to the conversation thread.

The agent's `search_resume` tool queries this store with natural language:

```
"search_resume: certifications cloud architecture work experience"
     │
     ▼
Similarity search over CV chunks
     │
     ▼
Returns top-k most relevant passages
e.g. "AWS Solutions Architect cert (2023), Azure deployments at [Company]..."
```

This allows the agent to answer precise follow-up questions ("which company did you use Azure with?") without hallucinating, even when the initial `parse_resume` extraction missed a detail.

---

### SSE Streaming Protocol

The server emits newline-delimited JSON events over a single SSE connection. Three event types drive the entire UI:

```
data: {"type":"text","content":"Let me analyze your skills against..."}
data: {"type":"tool_call","name":"skill_gap_analysis","id":"call_abc"}
data: {"type":"tool_result","name":"skill_gap_analysis","id":"call_abc","result":{...}}
data: {"type":"text","content":"Your strongest gap is Machine Learning..."}
data: {"type":"tool_call","name":"learning_path","id":"call_def"}
data: {"type":"tool_result","name":"learning_path","id":"call_def","result":{...}}
data: [DONE]
```

The client maintains a segment queue. `text` events append to the current text segment. `tool_call` events open a loading placeholder. `tool_result` events resolve the placeholder into the rendered React component. The ordering is preserved exactly — the agent's narrative flow is the UI's layout.

---

### Session Management

Conversation history is managed entirely on the client via localStorage. Each thread gets its own message list, profile state, and CV embedding. The server is stateless — the full history is sent with every request. This means:

- No server-side session state to manage or expire
- Multiple independent conversations per browser
- Full history survives page refresh (messages + CV markdown re-embedded on mount)
- Auto-generated conversation titles via a lightweight LLM call after the first exchange

---

## Agent Tools (11 Capabilities)

The ReAct agent has 11 tools that map directly to the career coaching workflow. Every tool call is visible in the UI — the student watches the agent reason, not just receive an answer.

| # | Tool | What It Does |
|---|------|-------------|
| 1 | `parse_resume` | Regex + heuristic extraction from CV text. Fast structured pass: name, contact, skills with estimated proficiency levels, work history. Runs first after CV upload. |
| 2 | `search_resume` | Semantic vector search over the embedded CV. Called with a natural language query to retrieve precise details: certifications, project names, company context, dates. Fills gaps the parser misses. |
| 3 | `skill_gap_analysis` | Compares the student's inferred skill levels against the requirements for their target MENA role. Returns the data for an inline radar chart and a sortable gap table with priority and action for each skill. |
| 4 | `learning_path` | Builds a 3-phase personalized learning timeline. Each phase targets specific gaps, maps to Localized courses and external resources (Coursera, fast.ai, etc.), with realistic hour estimates. |
| 5 | `expert_match` | Matches the student to expert mentors from the MENA network. Considers target industry, specialization, experience level, and geography. Returns ranked mentor cards with profile and match rationale. |
| 6 | `job_market_scan` | Scans a curated database of real MENA job postings (Aramco, Careem, STC, NEOM, Noon, stc pay, and others) and scores each against the student's current profile. Returns ranked matches with fit rationale and gaps per role. |
| 7 | `generate_interview_question` | Generates role-specific, company-specific interview questions calibrated to the student's experience level and target position. Covers technical, behavioral, and MENA market-specific angles. |
| 8 | `evaluate_interview_answer` | Scores the student's answer across multiple dimensions (content, structure, specificity, MENA context), provides detailed feedback, and surfaces a model answer for comparison. |
| 9 | `salary_benchmark` | Shows salary ranges by level (junior/mid/senior) and country (KSA, UAE, Qatar, Kuwait) for the target role. Includes certification premium data and market context (Vision 2030 demand signals, Saudization impact). |
| 10 | `career_insight` | Surfaces real MENA market intelligence: "Python is required in 78% of Saudi data engineering roles" or "Vision 2030 has driven 3x growth in cloud roles in KSA since 2022." Called when a statistic would strengthen a recommendation. |
| 11 | `update_profile` | Updates the student's profile sidebar in real time as the agent learns more through conversation. Called silently alongside substantive responses — the sidebar stays current without interrupting the flow. |

---

## Generative UI

This is the demo's most important architectural decision. Tool results do not produce text summaries — they produce data rendered as purpose-built React components, inline, in the exact order they appear in the stream.

| Tool Result | Visual Component |
|-------------|-----------------|
| `skill_gap_analysis` | Recharts `RadarChart` overlaying current vs. required levels, plus a sortable gap table with priority badges and action items per skill |
| `learning_path` | 3-phase vertical timeline: phase headers with estimated duration, resource cards with Localized vs. external tags, skill targets per phase |
| `expert_match` | Mentor cards: avatar, name, current company (Aramco, Careem, STC, KACST, Noon), specialization tags, experience summary, match rationale |
| `job_market_scan` | Job cards: role title, company logo placeholder, location, match score bar, required vs. present skills, fit summary |
| `salary_benchmark` | Grouped bar chart (Recharts): salary ranges by seniority level across KSA, UAE, Qatar, Kuwait — with certification premium callout |
| `parse_resume` | CV thumbnail strip: each uploaded PDF page rendered as a visual image, confirming exactly what the AI "saw" |

Adding a new tool with visual output requires: (1) a tool definition in `tools.ts`, (2) a React component in `generative-ui/`, (3) one entry in the component registry. The streaming and ordering infrastructure handles the rest.

---

## MENA Market Intelligence

The demo is not a generic career tool with a MENA skin. The agent's knowledge is grounded in the specific dynamics of GCC and broader MENA labor markets:

- **Nationalization policy** — Saudization (Nitaqat) and Emiratization (Nafis) requirements are factored into job match context and career advice. The agent knows which roles face quota pressure and which sectors have local talent shortages.
- **Vision 2030 sectors** — Energy transition, tourism, fintech, technology, and entertainment are weighted in career pathway recommendations. The agent cites specific mega-projects (NEOM, Red Sea Project, stc pay) as concrete destinations.
- **Real company roles** — Job database includes actual positions at Saudi Aramco, Careem, STC, NEOM, Noon, and others — not synthetic placeholders.
- **MENA expert network** — 8 mentor profiles grounded in real institutions: Saudi Aramco, Careem, STC, KACST, Noon, and regional universities.
- **GCC salary data** — Salary benchmarks broken down by KSA, UAE, Qatar, and Kuwait with level-specific ranges and certification premiums.
- **Arabic professional culture** — The agent uses Arabic phrases naturally (مرحباً, ممتاز, شكراً), understands wasta dynamics, and frames advice in regional professional context.

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend framework | Next.js 16 (App Router) | SSR, API routes, streaming response handling |
| AI agent runtime | LangGraph.js (ReAct) | Agent loop, tool dispatch, stateless per-request graph |
| LLM routing | OpenRouter | Unified API for model access and cost control |
| Chat model | `google/gemini-2.0-flash-lite-001` | Low-latency conversational reasoning + tool use |
| Vision model | `google/gemini-2.0-flash-001` | Multimodal CV parsing from rendered page images |
| Embedding model | `openai/text-embedding-3-small` | CV semantic search index via OpenRouter |
| PDF rendering | pdfjs-dist | Client-side PDF → canvas → base64 JPEG — no server upload |
| Vector store | LangChain MemoryVectorStore | In-process per-thread CV embedding store |
| Streaming transport | Server-Sent Events (SSE) | Real-time agent event stream to the browser |
| Data visualization | Recharts | Radar charts, bar charts rendered from tool results |
| Session persistence | localStorage | Client-managed conversation history, CV markdown, profile state |
| Containerization | Docker + docker-compose | Single-command deployment, environment isolation |

---

## Why This Architecture

**Vision parsing over text extraction.** PDF text extraction is brittle — it breaks on columns, tables, logos, Arabic text, and non-standard fonts, all common in MENA CVs. Rendering pages to images and asking a vision model to read them produces structured output that matches what a human recruiter would extract. The agent sees the CV the same way a person does.

**Two-pass CV understanding.** `parse_resume` gives fast structured extraction upfront. `search_resume` gives precise retrieval for follow-up questions ("what was your role at [company]?"). The vector store means the agent never has to hallucinate CV details it didn't initially capture.

**LangGraph over a simple chat loop.** The ReAct graph gives the agent genuine reasoning structure. It can call multiple tools in sequence, use earlier tool results to inform later decisions, and know when to stop. A chain or prompt-stuffed API call cannot do this reliably — it either over-calls tools or fails to chain reasoning across them.

**Generative UI over text output.** A salary range described in a sentence is forgettable. A bar chart broken down by country and level is actionable. The difference between a chatbot and a product is whether the output does work for the user.

**Stateless server, client-managed history.** The full conversation history lives in the browser (localStorage). The server receives it on every request, processes it fresh, and returns the next segment. No session state to manage or expire, no database dependency. The demo works across page refreshes and survives server restarts cleanly.

**SSE over WebSockets.** For a request-response agent loop, SSE is sufficient and operationally simpler — no persistent connection management, works through standard HTTP infrastructure, trivially deployable behind any reverse proxy.

---

## Deployment

```bash
# Requires .env with:
# OPENROUTER_API_KEY=sk-or-...
# OPENROUTER_MODEL=google/gemini-2.0-flash-lite-001       (optional)
# OPENROUTER_VISION_MODEL=google/gemini-2.0-flash-001     (optional)
# OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small (optional)

docker compose up --build
# → http://localhost:3001
```

Single container. No external database. No managed vector store. No auth service. The only hard dependency is an OpenRouter API key with access to Gemini and embedding models. Swap `OPENROUTER_MODEL` to use any model on OpenRouter without changing application code.

---

*Built as a CEO/CTO demo for Localized — April 2026.*
