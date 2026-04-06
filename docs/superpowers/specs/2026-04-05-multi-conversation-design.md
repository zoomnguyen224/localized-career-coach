# Multi-Conversation Support — Design Spec

## Goal

Allow users to maintain multiple independent chat sessions, switch between them, and see their skill radar and uploaded CV pinned in the sidebar — all without authentication, using localStorage as the sole persistence layer.

## Architecture

All state lives in the browser. No server-side conversation storage. Each conversation is a UUID (`threadId`) that keys three localStorage entries: message history, CV markdown (for re-embedding), and CV attachment metadata. A conversation index tracks metadata (id, title, timestamps).

**Tech Stack:** Next.js, React, localStorage, LangGraph `MemorySaver` (already keyed by threadId server-side), existing OpenRouter `/api/chat` and `/api/embed-cv` routes.

---

## Data Layer — `src/lib/conversation-store.ts`

Pure localStorage utility. No React, no side effects.

```
localStorage keys:
  localized_conversations        → ConversationMeta[]  (index)
  localized_active_thread        → string              (active threadId)
  localized_messages_{id}        → ChatMessage[]       (already exists)
  localized_cv_markdown_{id}     → string              (already exists)
```

```ts
interface ConversationMeta {
  id: string         // UUID
  title: string      // auto-generated or user-renamed
  createdAt: number  // Date.now()
  updatedAt: number  // updated on each message
}
```

**Exports:**
- `getConversations(): ConversationMeta[]` — sorted by updatedAt desc
- `createConversation(): ConversationMeta` — generates UUID, appends to index
- `updateTitle(id: string, title: string): void`
- `touchConversation(id: string): void` — bumps updatedAt
- `deleteConversation(id: string): void` — removes from index + clears all three keyed entries for that id
- `getActiveThreadId(): string | null`
- `setActiveThreadId(id: string): void`

---

## Auto-Title — `/api/title`

**POST** `{ firstUserMessage: string, firstAssistantMessage: string }`  
**Returns** `{ title: string }` — 4–6 words, e.g. "Product Manager in UAE"

Called by ChatInterface after the **first** complete assistant response (when `messages.length === 3`: welcome + first user + first assistant). Fires in the background; on success calls `onTitleGenerated(threadId, title)` prop. On failure, title stays as `"New Conversation"`.

Uses `OPENROUTER_MODEL` (same as chat). Prompt: *"Summarize this career coaching conversation in 4–6 words. Reply with the title only, no punctuation."*

---

## `page.tsx` — conversation-aware state

```ts
const [conversations, setConversations] = useState<ConversationMeta[]>([])
const [activeThreadId, setActiveThreadId] = useState('')
const [userProfile, setUserProfile] = useState<UserProfile>({})
const [skillGapResult, setSkillGapResult] = useState<SkillGapResult | null>(null)
const [cvAttachment, setCvAttachment] = useState<CVAttachment | null>(null)
```

**On mount:**
1. Load conversations from store. If empty, create the first one.
2. Set `activeThreadId` from `getActiveThreadId()` (or first conversation).
3. Derive `skillGapResult` and `cvAttachment` from restored messages (see below).

**On thread switch:**
- Save active thread id to store.
- Reset `userProfile`, `skillGapResult`, `cvAttachment` to empty/null.
- Derive `skillGapResult` + `cvAttachment` from the new thread's stored messages:
  - `skillGapResult`: last message where any `toolResult.toolName === 'skill_gap_analysis'`
  - `cvAttachment`: first message where `cvAttachment` field is set

**Callbacks passed to children:**
- `onProfileUpdate` — existing
- `onSkillGapResult(result: SkillGapResult)` → `setSkillGapResult`
- `onCVUploaded(attachment: CVAttachment)` → `setCvAttachment`
- `onTitleGenerated(id: string, title: string)` → updates store + refreshes `conversations` state
- `onNewConversation()` — creates conversation, switches active thread, resets profile/gap/cv state
- `onSwitchConversation(id: string)` — switches active thread
- `onDeleteConversation(id: string)` — deletes from store; if deleting active, switch to most recent remaining (or create new)
- `onRenameConversation(id: string, title: string)` — updates store + refreshes state

---

## `ChatInterface.tsx` — additions

**New props:**
```ts
onSkillGapResult: (result: SkillGapResult) => void
onCVUploaded: (attachment: CVAttachment) => void
onTitleGenerated: (threadId: string, title: string) => void
```

**`tool_result` handler** (line ~125): add alongside existing `update_profile` / `parse_resume` checks:
```ts
if (event.name === 'skill_gap_analysis') onSkillGapResult(event.result as SkillGapResult)
```

**CV upload** (after `cvAttachment` is set on user message): call `onCVUploaded(cvAttachment)`.

**After first assistant response** (when `messages.length === 3`): call `/api/title` in background, then `onTitleGenerated`.

**On threadId change** (existing `useEffect([threadId])`): already restores messages and re-embeds CV. No changes needed beyond the reset handled in `page.tsx`.

**`touchConversation`**: call `touchConversation(threadId)` after each assistant response completes.

---

## `Sidebar.tsx` — conversation list + sidebar widgets

**New props:**
```ts
conversations: ConversationMeta[]
activeThreadId: string
skillGapResult: SkillGapResult | null
cvAttachment: CVAttachment | null
onNew: () => void
onSwitch: (id: string) => void
onDelete: (id: string) => void
onRename: (id: string, title: string) => void
```

**Layout (top to bottom):**

```
[ + New Conversation ]         ← button, full width

──────────────────────
● Product Manager in UAE       ← active: bold title, blue left border
  Apr 5, 2:30 PM         [🗑]  ← muted timestamp, trash on hover
──────────────────────
  Software Engineer path
  Apr 4, 11:00 AM        [🗑]
──────────────────────         ← scrollable if list grows

Your Profile
Name / Location / Background / Target Role / Experience Level

[Skill Readiness radar chart]  ← rendered only when skillGapResult != null
                                  compact prop: height=200, max 6 skills

[CV Uploaded card]             ← rendered only when cvAttachment != null
                                  new CVSidebarCard component (white bg, light border)

Continue on Mobile / QR

Prototype demo — some data is illustrative only.   ← muted footnote, replaces old notice
```

**Rename UX:** click on an active conversation title → input appears inline, blur or Enter saves.

**Delete:** `window.confirm('Delete this conversation?')` → call `onDelete`.

---

## `SkillRadarChart.tsx` — compact prop

Add `compact?: boolean` prop:
- `compact`: `height={200}`, `gaps.slice(0, 6)`, no Legend (space too tight), smaller font on axis labels.
- Default behaviour unchanged (existing chat cards unaffected).

---

## `CVSidebarCard.tsx` — new component

Compact CV card for the white sidebar (distinct from existing `CVPreviewCard` which is styled for dark chat bubbles).

```
┌──────────────────────────────┐
│ 📄 Zoom_Nguyen.pdf · 2 pages │
│ [small thumbnail, ~100px wide]│
└──────────────────────────────┘
```

Light border, white background, rounded corners. Single thumbnail (first page only at ~100px wide).

---

## Files

| Action | Path |
|--------|------|
| Create | `src/lib/conversation-store.ts` |
| Create | `src/app/api/title/route.ts` |
| Create | `src/components/chat/CVSidebarCard.tsx` |
| Modify | `src/app/page.tsx` |
| Modify | `src/components/chat/ChatInterface.tsx` |
| Modify | `src/components/layout/Sidebar.tsx` |
| Modify | `src/components/generative-ui/SkillRadarChart.tsx` |

---

## Testing

- `__tests__/lib/conversation-store.test.ts` — unit tests for all store functions (create, delete cleans all keys, getConversations sorts by updatedAt, etc.)
- `__tests__/app/api/title/route.test.ts` — mocks OpenRouter, verifies title is returned and trimmed
- Manual: create 3 conversations, switch between them, verify messages/CV/radar restore correctly per thread; delete active conversation switches to next; rename persists on refresh
