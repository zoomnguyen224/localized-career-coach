# Localized — App Revamp Design Spec
**Date:** 2026-04-16  
**Status:** Approved  
**Market:** MENA / GCC (Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman)  
**Purpose:** Demo-quality revamp for job application pitch + foundation for real users

---

## 1. Vision

Transform Localized from a chat-only demo into an **app-first career platform** where agents run everything in the background. The chat becomes a context-aware sidebar — always available, never the only interface. Every page has agents behind it.

**Design principle:** The user sees a product. The agent does the work.

---

## 2. Architecture

### 2.1 Interaction Model

**App-first, chat-as-sidebar (Approach B)**

- Full page-based navigation with 5 core pages
- Chat available on every page via FAB (bottom-right), opens as a drawer
- Chat is context-aware: knows which page, which job, which application is active
- No action requires going through chat — but chat can trigger any agent action conversationally

### 2.2 Agent Types

**Triggered agents** — user initiates via button or chat:
- Job evaluation (score A–F against CV)
- CV generation (keyword injection → tailored PDF)
- LinkedIn outreach drafting (find contact → write message)
- Company deep research (AI strategy, culture, funding)
- Interview question generation + answer evaluation
- Pattern analysis (rejection trends across applications)

**Autonomous agents** — run on schedule, surface results in UI:
- Job scanner — every 6 hours, hits Greenhouse / Lever / Ashby APIs for MENA companies
- Match scorer — scores all new jobs against user profile after each scan
- Follow-up reminder — daily, flags applications with no activity for 7+ days
- Profile learner — after each chat session, extracts new facts and updates user profile silently

### 2.3 Context Bundle

Every agent receives:
```
user.cv            — parsed CV from onboarding
user.profile       — target role, location, skills, experience level
user.applications  — current tracker state
current.page       — which page the user is on
current.focus      — which job/application is selected (if any)
```

### 2.4 Reuse Map — career-agent-cli + Localized existing assets

**CRITICAL RULE: Never write a new agent prompt from scratch if one already exists in career-agent-cli `modes/` or Localized `src/lib/tools.ts`. Load the file, pass as system prompt.**

#### From career-agent-cli `modes/` — load as system prompt per agent call

| Agent | Source file | What it provides |
|---|---|---|
| Job evaluation (scoring) | `modes/oferta.md` + `modes/_shared.md` | Full A-F block scoring, archetype detection (6 types), CV-to-JD gap analysis, comp benchmarking, red flags, legitimacy check |
| CV keyword injection | `modes/pdf.md` | Keyword extraction (15–20), summary rewrite, bullet reordering, ATS rules, paper format detection |
| Job scanner | `modes/scan.md` | 3-level discovery: ATS APIs (Level 2) + Playwright scraping (Level 1) + WebSearch (Level 3). ATS API endpoints for Greenhouse / Lever / Ashby / BambooHR / Workday already documented |
| LinkedIn outreach | `modes/contacto.md` | Contact classification (recruiter / hiring manager / peer), 3-sentence message framework per type |
| Company deep research | `modes/deep.md` | 6-axis research prompt: AI strategy, recent moves, engineering culture, likely challenges, growth signals, interview intel |
| Interview intel | `modes/interview-prep.md` | Glassdoor/Blind/LeetCode search queries, process overview, STAR story mapping |
| Pattern analysis | `modes/patterns.md` | Rejection pattern detection across applications, filter update recommendations |
| Follow-up timing | `modes/followup.md` + `followup-cadence.mjs` | Cadence rules per status, optimal follow-up timing |
| Archetype + scoring rules | `modes/_shared.md` | Scoring system (1–5 scale), 6 archetypes (FDE/SA/PM/LLMOps/Agentic/Transformation), interpretation thresholds |
| User persona | `modes/_profile.md` | User's target archetypes, narrative, negotiation stance — MENA version to be created as `modes/mena-profile.md` |

#### From Localized `src/lib/tools.ts` — keep all existing LangChain tools

| Tool | Keep as-is | Enhancement |
|---|---|---|
| `skill_gap_analysis` | ✅ yes | Feed real job requirements from ATS scan instead of mock MENA_ROLES |
| `learning_path` | ✅ yes | No change |
| `expert_match` | ✅ yes | No change (mock data fine for demo) |
| `career_insight` | ✅ yes | No change |
| `update_profile` | ✅ yes | Persist to Supabase instead of in-memory |
| `parse_resume` | ✅ yes | No change |
| `search_resume` | ✅ yes | No change (vector search already works) |
| `job_market_scan` | ⚠️ replace mock | Replace mock MENA_JOB_LISTINGS with real ATS API calls using `scan.md` Level 2 logic |
| `generate_interview_question` | ✅ yes | No change |
| `evaluate_interview_answer` | ✅ yes | No change |
| `salary_benchmark` | ✅ yes | No change (mock data fine for demo) |

#### New tools to add (follow same LangChain pattern in `tools.ts`)

| New tool | Prompt source | What it does |
|---|---|---|
| `evaluate_job_offer` | `modes/oferta.md` + `modes/_shared.md` | Full A-F scoring, returns structured result for Jobs page score bars |
| `generate_tailored_cv` | `modes/pdf.md` | Keyword injection → HTML → returns HTML string for PDF conversion |
| `draft_linkedin_outreach` | `modes/contacto.md` | Returns contact type + drafted message |
| `research_company` | `modes/deep.md` | Returns structured 6-axis company intel |
| `scan_mena_portals` | `modes/scan.md` Level 2 | HTTP calls to Greenhouse/Lever/Ashby, returns job list |
| `analyze_patterns` | `modes/patterns.md` | Returns rejection pattern analysis |

#### From career-agent-cli scripts — reuse logic directly

| Script | Reuse how |
|---|---|
| `generate-pdf.mjs` | Copy into Localized as `/src/lib/generate-pdf.mjs` — called by CV generation API route |
| `check-liveness.mjs` | Run server-side to validate job URLs before storing |
| `merge-tracker.mjs` | Logic informs DB upsert strategy (never duplicate company+role) |
| `templates/cv-template.html` | Copy into Localized `public/cv-template.html` — base for PDF generation |
| `fonts/` | Copy into Localized `public/fonts/` — Space Grotesk + DM Sans for CV |

### 2.5 Tech Stack (no changes to existing)

- **Frontend:** Next.js (existing)
- **AI orchestration:** LangChain tools in `src/lib/tools.ts` (existing pattern — new agents = new tools)
- **Streaming:** Vercel AI SDK (existing)
- **CV vector search:** OpenAI embeddings + MemoryVectorStore + Redis (existing)
- **Job scanning:** Direct HTTP to Greenhouse / Lever / Ashby public APIs (new)
- **PDF generation:** Playwright on server or Browserless.io (new)
- **Background jobs:** Next.js cron routes `/api/cron/*` (new)
- **Database:** Supabase (new — replaces in-memory state)

---

## 3. Page Architecture

### Navigation
Left sidebar, always visible. 5 items + divider + settings. Collapses to icon-only on small screens.

```
Logo
────
⬡  Dashboard
💼  Jobs         [badge: new count]
📋  Applications
📄  My CV
🎯  Interview Prep
────
⚙️  Settings

[User avatar + name + role at bottom]
```

### 3.1 Onboarding (`/onboarding`)
- Chat-driven wizard for new users only
- Step 1: Upload CV (PDF or paste text) → agent parses → shows extracted profile for confirmation
- Step 2: Set target role + location + salary expectation
- Step 3: Redirect to Dashboard
- Existing `parse_resume` + `embed-cv` API routes handle this already

---

### 3.2 Dashboard (`/`)

**Purpose:** Daily summary. What happened overnight. What to do next.

**Layout:** Page header → 4 stat cards → 2-column (left: job matches + pipeline summary, right: skill radar + next actions)

**Components:**
- Agent status pill (top right) — shows when background scan is running with pulse dot
- **Stat cards (4):** Job Matches, Applications Sent, Profile Readiness %, Avg Match Score
- **Top Matches Today:** 3 highest-scoring new jobs with match scores, "View all →" link
- **Pipeline Summary:** Count per kanban stage (Evaluated / Applied / Interview / Offer / Rejected)
- **Skill Radar Chart:** Hexagonal radar, overall readiness %, skill chips (green = strong, red = gap)
- **Next Actions:** 3 agent-suggested tasks, each clickable to trigger the relevant agent

**Agents behind this page:**
- Autonomous job scanner surfaces new count
- Match scorer populates "Top Matches Today"
- Follow-up reminder feeds into Next Actions card

---

### 3.3 Jobs (`/jobs`)

**Purpose:** Browse all agent-scanned job listings. Evaluate, research, act.

**Layout:** Page header → filter bar → two-panel (job list left 360px, job detail right)

**Filter bar:**
- Role chips: All / AI·ML / Product / Data
- Quality filter: Strong match (4.0+)
- Remote only toggle
- Country chips: UAE / KSA / Qatar
- Results count (right-aligned)

**Job list panel:**
- Cards sorted by match score descending
- Each card: company logo, title, company + location, match score, skill chips
- Blue dot on cards from latest scan
- Selected card highlights with blue border

**Job detail panel:**
- Company logo, title, company, location
- Meta pills: work type, salary range, "Vision 2030 role" badge, ATS source + posted date
- Action buttons: Apply now (primary), Generate CV (secondary), Save (ghost)
- **Agent Match Analysis:** Overall score + 5 bar dimensions (CV match, Role alignment, Compensation, Culture signals, Red flags)
- **Agent Actions:** Generate tailored CV / Draft LinkedIn outreach / Deep company research / Interview prep (coming soon badge)
- **Skills match:** Dot-coded list (green = strong, amber = partial, red = gap) with notes per skill

**Data sources:**
- Real: Greenhouse, Lever, Ashby public APIs for tracked MENA companies
- Mock (demo): Pre-loaded job cards for STC, Talabat, Careem, NEOM, Emirates NBD, Geidea

---

### 3.4 Applications (`/applications`)

**Purpose:** Track the full pipeline. Spot what needs attention.

**Layout:** Page header → kanban board (horizontal scroll)

**Header actions:**
- Pattern analysis button (triggers `analyze-patterns` agent)
- Add application button

**Kanban columns (5):**

| Column | Color | Purpose |
|---|---|---|
| Evaluated | Gray | Scored but not yet applied |
| Applied | Blue | Submitted, awaiting response |
| Interview | Amber | Active interview process |
| Offer | Green | Offer received |
| Rejected | Red (faded) | Closed, 65% opacity |

**Application card:**
- Company logo, job title, company name
- Match score (color-coded)
- Status chips + time since last update
- **Amber left border** = agent-flagged urgent (deadline, no response > 7 days)
- **Blue left border** = active interview
- **Agent alerts** on card: "Follow up today", "Interview at 3pm", "Deadline tomorrow"
- **Offer card** = green border + offer banner with salary + decision deadline

**Agents behind this page:**
- Follow-up reminder generates urgent flags
- Cards draggable between columns (status update triggers `update_profile` agent)

---

### 3.5 My CV (`/cv`)

**Purpose:** Manage master CV. Generate and download tailored versions per job.

**Layout:** Page header → 3-column (profile left 260px, CV preview center, generated CVs right 240px)

**Left column:**
- Profile card: avatar, name, role, location, CV completeness bar
- Skill bars: top 5 skills with level (1–10), color-coded (blue = strong, amber = developing, red = gap)
- Agent suggestions card: 3 specific improvements to the master CV

**Center column:**
- Tailored banner: "Showing tailored version for [job] · N keywords injected · N% ATS score"
- Live CV preview with injected keywords highlighted in blue
- ATS-safe layout: single column, standard headers, selectable text

**Right column:**
- List of previously generated CVs
- Each entry: company + role, generated date, ATS score, keyword count
- Preview + Download PDF buttons per entry
- "Generate for a new job" dashed button at bottom

**Agents behind this page:**
- CV generation agent: reads master CV → extracts JD keywords → rewrites → outputs HTML → PDF via Playwright
- Agent suggestions: reads CV vs recent job evaluations → identifies common gaps

---

### 3.6 Interview Prep (`/interview`)

**Purpose:** Practice for specific upcoming interviews. Real questions from Glassdoor/Blind. Scored feedback.

**Layout:** Page header → 2-column (interviews list left 280px, active session right)

**Left column:**
- Upcoming interviews (from Applications tracker, status = Interview)
- Practice history: sessions count, avg score per company
- "Prep for a new role" button

**Right column — active session:**
- **Company intel banner** (dark navy): pulled from Glassdoor/Blind/LinkedIn — round structure, duration, offer rate, language preference (Arabic/English). This is the MENA-specific edge.
- **Tabs:** Practice / STAR Stories / Company Intel
- **Practice tab:**
  - Question card: question number, type chip (Behavioral/Technical), question text sourced from real candidates, evaluation criteria chips
  - Answer textarea with prompt hint
  - Submit / Skip actions + source attribution ("Glassdoor 2024")
  - Previous answer result: score circle, verdict, strengths vs improvements (2-col), agent model answer
- **STAR Stories tab:** Bank of prepared stories from CV, tagged by skill/theme
- **Company Intel tab:** Structured research (AI strategy, culture, stack, hiring bar)

**Agents behind this page:**
- `generate_interview_question` + `evaluate_interview_answer` tools (already exist)
- WebSearch agent for company intel (Glassdoor, Blind, LinkedIn, engineering blog)
- Story bank agent: maps CV proof points to STAR frameworks per role

---

## 4. Design System

Strictly follows existing Localized design system:

| Token | Value |
|---|---|
| Font | Figtree (Google Fonts) |
| Background | `#F8F9FB` |
| Card | `#FFFFFF` with `box-shadow: 0 5px 60px rgba(151,155,192,0.2)` |
| Border | `#DCDFE8` |
| Primary blue | `#4584FF` |
| Success green | `#03BA82` |
| Warning amber | `#FAA82C` |
| Error red | `#F84E4E` |
| Text primary | `#06123C` |
| Text muted | `#727998` |
| Card radius | `10px` |
| Button radius | `14px` |
| Pill radius | `9999px` |

Light mode only. No dark mode.

---

## 5. Real vs Demo/Coming Soon

| Feature | Real (works) | Demo / Coming Soon |
|---|---|---|
| CV upload + parsing | ✅ existing | — |
| Skill gap analysis | ✅ existing | — |
| Chat coaching | ✅ existing | — |
| Job evaluation scoring | ✅ build | — |
| ATS job scanning (Greenhouse/Lever/Ashby) | ✅ build | — |
| Interview practice + scoring | ✅ existing | — |
| Skill radar chart | ✅ existing component | — |
| Application kanban UI | ✅ build (UI only) | Auto status from email |
| CV PDF generation | ✅ build | — |
| Salary benchmarks | Mock (looks real) | Real market data |
| Expert matching | Mock (looks real) | Real expert network |
| LinkedIn outreach | ✅ build | Auto-send |
| Deep company research | ✅ build | — |
| Autonomous daily scan | Coming Soon badge | Full background automation |
| Video mock interview | Coming Soon badge | — |
| Pattern analysis | Coming Soon badge | — |

---

## 6. What's NOT in scope (v1)

- Auth / multi-user (single demo user)
- Billing / usage metering
- Mobile layout
- Indeed / LinkedIn scraping
- Form auto-fill (Chrome extension)
- Email notifications
- Multi-language modes (MENA Arabic focus only)

---

## 7. Implementation Order

Build in this sequence — each step is independently demoable:

1. **Navigation shell** — left sidebar, routing, page stubs, chat FAB
2. **Dashboard page** — stat cards, top matches (mock data), radar chart, next actions
3. **Jobs page** — two-panel layout, real ATS data for 3–5 companies, job evaluation agent
4. **CV page** — three-column layout, CV preview, tailored generation + PDF download
5. **Applications kanban** — 5 columns, drag cards, agent alert flags
6. **Interview Prep page** — company intel banner, practice loop (existing tools)
7. **Background job scanner** — cron route, ATS APIs, new match notifications
8. **Chat sidebar** — context-aware drawer, wired to current page state
