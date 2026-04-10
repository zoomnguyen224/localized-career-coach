# Graph Report - .  (2026-04-10)

## Corpus Check
- Corpus is ~40,272 words - fits in a single context window. You may not need a graph.

## Summary
- 159 nodes · 177 edges · 19 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Localized AI Career Coach` - 8 edges
2. `handleCVTextUpload()` - 5 edges
3. `getConversations()` - 5 edges
4. `AIParser Embedding Design` - 5 edges
5. `handlePDFVision()` - 4 edges
6. `Multi-Conversation Design` - 4 edges
7. `streamAgentResponse()` - 3 edges
8. `sendMessage()` - 3 edges
9. `handleFileChange()` - 3 edges
10. `ExpertItem()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `CV Vision Parsing Pipeline` --semantically_similar_to--> `Gemini Vision CV Parsing`  [INFERRED] [semantically similar]
  README.md → docs/superpowers/specs/2026-04-05-aiparser-embedding-design.md
- `In-Memory Vector Store` --semantically_similar_to--> `search_resume Tool Design`  [INFERRED] [semantically similar]
  README.md → docs/superpowers/specs/2026-04-05-aiparser-embedding-design.md
- `Localized AI Career Coach` --conceptually_related_to--> `Localized.world Design System`  [INFERRED]
  README.md → localized-style.md
- `localStorage Persistence Design` --semantically_similar_to--> `ConversationMeta localStorage Store`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-04-05-aiparser-embedding-design.md → docs/superpowers/specs/2026-04-05-multi-conversation-design.md
- `AIParser Embedding Implementation Plan` --implements--> `AIParser Embedding Design`  [EXTRACTED]
  docs/superpowers/plans/2026-04-05-aiparser-embedding.md → docs/superpowers/specs/2026-04-05-aiparser-embedding-design.md

## Hyperedges (group relationships)
- **CV Processing Pipeline** — readme_cv_vision_parsing, readme_vector_store, spec_aiparser_embedding, spec_aiparser_vision_model, spec_aiparser_search_resume_tool [EXTRACTED 0.90]
- **Next.js Deployment Stack** — icon_vercel_svg, icon_next_svg, agents_nextjs_rules [INFERRED 0.70]
- **Design-Spec-Plan Workflow** — spec_aiparser_embedding, plan_aiparser_embedding, spec_multi_conversation, plan_multi_conversation [EXTRACTED 0.85]

## Communities

### Community 0 - "Agent Graph & Testing"
Cohesion: 0.09
Nodes (3): getMarkdownFromRedis(), getRedisClient(), saveMarkdownToRedis()

### Community 1 - "Generative UI Cards"
Cohesion: 0.08
Nodes (0): 

### Community 2 - "Chat Interface & Input"
Cohesion: 0.13
Nodes (6): handleCVTextUpload(), handleCVUpload(), handleFileChange(), handlePDFVision(), sendMessage(), streamAgentResponse()

### Community 3 - "Architecture & Docs"
Cohesion: 0.12
Nodes (20): AIParser Embedding Implementation Plan, Multi-Conversation Implementation Plan, 11 Specialized Agent Tools, CV Vision Parsing Pipeline, Generative UI Components, LangGraph ReAct Agent, Localized AI Career Coach, MENA/Africa Market Focus (+12 more)

### Community 4 - "UI Primitives"
Cohesion: 0.14
Nodes (0): 

### Community 5 - "Conversation Store"
Cohesion: 0.16
Nodes (6): createConversation(), deleteConversation(), generateId(), getConversations(), touchConversation(), updateTitle()

### Community 6 - "Page Layout & Header"
Cohesion: 0.2
Nodes (0): 

### Community 7 - "Expert Card Component"
Cohesion: 0.47
Nodes (3): ExpertItem(), getAvatarBg(), getMatchBadgeClass()

### Community 8 - "Jest Test Setup"
Cohesion: 0.5
Nodes (0): 

### Community 9 - "Root Layout"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Vercel/Next.js Branding"
Cohesion: 1.0
Nodes (2): Next.js Logo, Vercel Logo

### Community 11 - "Next.js Env Types"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Jest Config"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Type Definitions"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Agent Rules"
Cohesion: 1.0
Nodes (1): Next.js Agent Rules

### Community 16 - "File Icon"
Cohesion: 1.0
Nodes (1): File Icon

### Community 17 - "Globe Icon"
Cohesion: 1.0
Nodes (1): Globe Icon

### Community 18 - "Window Icon"
Cohesion: 1.0
Nodes (1): Window Icon

## Knowledge Gaps
- **14 isolated node(s):** `MENA/Africa Market Focus`, `OpenRouter API Gateway`, `Generative UI Components`, `Figtree Typography`, `Brand Color Palette` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Root Layout`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vercel/Next.js Branding`** (2 nodes): `Next.js Logo`, `Vercel Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Env Types`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Jest Config`** (1 nodes): `jest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Type Definitions`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agent Rules`** (1 nodes): `Next.js Agent Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Icon`** (1 nodes): `File Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Globe Icon`** (1 nodes): `Globe Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Window Icon`** (1 nodes): `Window Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 4 inferred relationships involving `handleCVTextUpload()` (e.g. with `handlePDFVision()` and `handleFileChange()`) actually correct?**
  _`handleCVTextUpload()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `getConversations()` (e.g. with `createConversation()` and `updateTitle()`) actually correct?**
  _`getConversations()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `handlePDFVision()` (e.g. with `handleCVTextUpload()` and `streamAgentResponse()`) actually correct?**
  _`handlePDFVision()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MENA/Africa Market Focus`, `OpenRouter API Gateway`, `Generative UI Components` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agent Graph & Testing` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Generative UI Cards` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Chat Interface & Input` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._