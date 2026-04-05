# Localized AI Career Coach

**A proof-of-concept that AI-first product strategy is not a roadmap item — it ships today.**

This is a fully working AI career coach built for Localized's MENA/Africa student and graduate audience. It is not a chatbot wrapper. It is a LangGraph ReAct agent that reasons, uses tools, streams its work in real time, and materializes analysis as interactive visual components directly inside the conversation. The demo is purpose-built to answer one question for leadership: *what does an AI-native product actually look like in our market?*

---

## The Core Idea

Traditional career platforms show students a list of jobs and a skills checklist. This demo shows what happens when you replace that with an agent that can *think* about a student's specific situation — read their CV visually, understand the MENA job market, identify their gaps, map a learning path, match them to mentors, benchmark their salary expectations, and coach them through an interview — all in a single, fluid conversation.

The UI is not a form. The AI output is not text. The analysis *becomes* the interface.

---

## How It Works

### Agent Flow

```
User uploads CV (PDF)
        │
        ▼
  pdfjs-dist renders each page
  to canvas → base64 JPEG images
        │
        ▼
  /api/parse-cv
  sends images to Gemini Vision
  (google/gemini-2.0-flash-001)
        │
        ▼
  Structured profile extracted
  Sidebar populated in real time
  (update_profile tool)
        │
        ▼
  User sends message to /api/chat
        │
        ▼
  ┌─────────────────────────────┐
  │   LangGraph ReAct Agent     │
  │                             │
  │  START → [agent node]       │
  │              │              │
  │    ┌─────────┴──────────┐   │
  │    │ tool_calls?        │   │
  │    │                    │   │
  │   YES                   NO  │
  │    │                    │   │
  │    ▼                   END  │
  │  [tools node]               │
  │    │                        │
  │    └──── back to agent      │
  └─────────────────────────────┘
        │
        ▼
  SSE stream emits events:
  text | tool_call | tool_result | [DONE]
        │
        ▼
  Client renders ordered segments:
  text paragraphs + React components
  in exact streaming sequence
```

### Streaming Protocol

The server emits newline-delimited JSON events over a single SSE connection. The client maintains an ordered segment queue — text and visual components are inserted at the precise position they arrived in the stream, preserving the agent's narrative flow.

```
data: {"type":"text","content":"Let me analyze your skill gaps..."}
data: {"type":"tool_call","tool":"skill_gap_analysis","input":{...}}
data: {"type":"tool_result","tool":"skill_gap_analysis","result":{...}}
data: {"type":"text","content":"Here is your personalized learning path..."}
data: {"type":"tool_call","tool":"learning_path","input":{...}}
data: {"type":"tool_result","tool":"learning_path","result":{...}}
data: [DONE]
```

### Session Memory

LangGraph's `MemorySaver` checkpointer persists the full message history per `thread_id`. The agent maintains complete context across the conversation — follow-up questions, profile updates, and iterative analysis all build on prior turns without re-uploading or re-stating context.

---

## Agent Tools (10 Capabilities)

The ReAct agent is equipped with ten tools that map directly to the career coaching workflow. Each tool call is visible in the UI — the student sees the agent reasoning, not just a final answer.

| # | Tool | What It Does |
|---|------|-------------|
| 1 | `parse_resume` | Vision-based CV parsing: PDF pages are rendered to base64 images and sent to a vision model. Extracts structured profile, work history, education, and skills without any form parsing or text extraction heuristics. |
| 2 | `skill_gap_analysis` | Compares the student's current skill set against the requirements of their target MENA role. Returns a gap table and the data for a radar chart rendered inline. |
| 3 | `learning_path` | Builds a 3-phase personalized learning timeline. Each phase maps specific skills to courses on Localized and curated external resources, with realistic time estimates. |
| 4 | `expert_match` | Matches the student to expert mentors from the MENA network based on target industry, specialization, and experience level. Returns ranked mentor cards with profile details. |
| 5 | `job_market_scan` | Scans a curated database of real MENA job postings (Aramco, Careem, STC, NEOM, Noon, etc.) and scores each against the student's profile. Returns ranked matches with fit rationale. |
| 6 | `generate_interview_question` | Generates role-specific and company-specific interview questions calibrated to the student's experience level and target position. |
| 7 | `evaluate_interview_answer` | Scores the student's answer to an interview question across multiple dimensions, provides detailed feedback, and surfaces a model answer for comparison. |
| 8 | `salary_benchmark` | Shows salary ranges by level (junior/mid/senior) and country (KSA, UAE, Qatar, Kuwait) for the target role, with market context. |
| 9 | `career_insight` | Surfaces MENA-specific market intelligence — for example, "Python is required in 78% of Saudi data engineering roles" or "Vision 2030 has driven 3x growth in cloud roles in KSA since 2022." |
| 10 | `update_profile` | Updates the student's profile sidebar in real time as the agent learns more about the student through conversation. |

---

## Generative UI

This is the demo's most important architectural decision. Tool results do not produce text summaries — they produce data that is rendered as purpose-built React components, inline, in the order they appear in the stream.

| Tool Result | Visual Component |
|-------------|-----------------|
| `skill_gap_analysis` | Recharts `RadarChart` showing current vs. required skill levels across dimensions, plus a sortable gap table |
| `learning_path` | 3-phase vertical timeline with phase headers, resource cards, estimated durations, and Localized vs. external resource tags |
| `expert_match` | Mentor cards with avatar, name, company (Aramco, Careem, STC, KACST, Noon), specialization tags, and match rationale |
| `job_market_scan` | Job cards with role title, company, location, match score bar, and fit summary |
| `salary_benchmark` | Grouped bar chart (Recharts) showing salary ranges by level across GCC countries |
| `parse_resume` | CV thumbnail strip showing each uploaded page as a rendered image, confirming what the AI "saw" |

The rendering engine maps `tool_result` events to component types at runtime. Adding a new tool and its visual output requires registering one entry in the component map — the streaming and ordering infrastructure handles the rest.

---

## MENA Market Intelligence

The demo is not a generic career tool with a MENA skin. The agent's knowledge is grounded in the specific dynamics of GCC and broader MENA labor markets:

- **Nationalization policy awareness** — Saudization (Nitaqat) and Emiratization requirements are factored into job match context and career advice
- **Vision 2030 sector priorities** — Energy transition, tourism, fintech, and technology sectors are weighted in career pathway recommendations
- **Real company roles** — Job database includes actual positions at Aramco, Careem, STC, NEOM, Noon, and others, not synthetic placeholders
- **MENA expert network** — 8 mentors with profiles grounded in real institutions: Saudi Aramco, Careem, STC, KACST, Noon, and regional universities
- **GCC salary data** — Salary benchmarks are broken down by KSA, UAE, Qatar, and Kuwait with level-specific ranges

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend framework | Next.js 15 (App Router) | SSR, API routes, streaming response handling |
| AI agent runtime | LangGraph.js (ReAct) | Agent loop, tool dispatch, session memory via MemorySaver |
| LLM routing | OpenRouter | Unified API for model access and cost control |
| Chat model | `google/gemini-2.0-flash-lite-001` | Low-latency, low-cost conversational reasoning |
| Vision model | `google/gemini-2.0-flash-001` | Multimodal CV parsing from rendered page images |
| PDF rendering | pdfjs-dist | Client-side PDF → canvas → base64 JPEG pipeline |
| Streaming transport | Server-Sent Events (SSE) | Real-time agent event stream to the browser |
| Data visualization | Recharts | Radar charts, bar charts, salary benchmarks rendered from tool results |
| Containerization | Docker + docker-compose | Single-command deployment, environment isolation |

---

## Why This Architecture

**LangGraph over a simple chat loop.** The ReAct graph gives the agent genuine reasoning structure. It can call multiple tools in sequence, use earlier tool results to inform later decisions, and know when it has enough information to stop. A chain or a prompt-stuffed API call cannot do this reliably.

**Vision parsing over text extraction.** PDF text extraction is brittle — it breaks on columns, tables, logos, and non-standard fonts. Rendering pages to images and asking a vision model to read them produces structured output that matches what a human would extract. The agent sees the CV the same way a recruiter does.

**Generative UI over text output.** A salary range described in a sentence is forgettable. A bar chart broken down by country and level is actionable. The difference between a chatbot and a product is whether the output does work for the user. Visual components do work; text summaries do not.

**SSE over WebSockets.** For a request-response agent loop, SSE is sufficient and operationally simpler — no persistent connection management, works through standard HTTP infrastructure, trivially cacheable at the edge.

---

## Deployment

The full application runs as a single `docker-compose up` command. The only required configuration is an `OPENROUTER_API_KEY` environment variable. No external database, no vector store, no managed services — session memory is in-process via LangGraph's MemorySaver, which is appropriate for a demo and trivially swappable for Redis or Postgres persistence in production.

---

*Built as a CEO/CTO demo for Localized — April 2026.*
