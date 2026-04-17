# Job Action Connections — Design Spec

## Goal

Wire the existing Job Detail panel so users can act on a job (generate CV, track application, prep interview) without manually navigating between pages. Zero structural changes to the layout.

## Problem

The app has 5 pages that work independently. When a user finds a good job in `/jobs`, they must:
1. Remember the job title and company
2. Navigate to `/cv` and retype the job details
3. Navigate to `/applications` and manually add an entry
4. Navigate to `/interview` and retype the company name

The `JobDetail` component already has an "Agent Actions" section — but it has emoji icons, two items marked "Coming soon", and none of the actions are actually wired up.

## What Changes

### 1. `JobDetail.tsx` — Agent Actions section

Replace the current emoji + "Coming soon" action rows with 4 clean, functional rows using SVG icons:

| Action | Behaviour |
|---|---|
| **Generate tailored CV** | `router.push('/cv?jobTitle=<title>&company=<company>')` |
| **Mark as applied** | `POST /api/applications` with job data → button shows "Applied ✓" on success |
| **Interview prep** | `router.push('/interview?company=<company>')` |
| **Draft outreach message** | Opens the chat drawer with a pre-filled prompt for this company |

Visual changes only in this component:
- SVG icons replace emojis (file icon, checkmark, info circle, chat bubble)
- No "Coming soon" badges — all 4 actions are live
- "Mark as applied" button shows a green "Applied" status chip after click

### 2. `POST /api/applications/route.ts` — New endpoint

Accepts a job payload and appends it to the in-memory applications store as a new entry with status `Applied`.

Request body:
```typescript
{
  company: string
  jobTitle: string
  location: string
  url: string
  matchScore?: number
}
```

Response: `{ ok: true, id: string }`

Error (409): `{ error: 'Already tracked' }` if company + jobTitle already exists.

### 3. `/cv` page — Read URL params

`CVPageClient.tsx` reads `?jobTitle` and `?company` from `useSearchParams()` and pre-fills the job target input so the user doesn't retype.

If params are absent, the page behaves exactly as today.

### 4. `/interview` page — Read URL params

`InterviewPageClient.tsx` reads `?company` from `useSearchParams()` and pre-selects / pre-fills the company field.

If param is absent, the page behaves exactly as today.

## What Does NOT Change

- Sidebar navigation
- Page layouts and routing structure
- All other components on every page
- The existing "Apply now" external link button
- The "Evaluate with agent" flow in JobDetail

## Architecture

Context is passed via URL query params — no global state, no new context providers, no localStorage.

```
/jobs (JobDetail)
  ├── "Generate CV" → router.push('/cv?jobTitle=X&company=Y')
  ├── "Mark applied" → POST /api/applications → in-memory store
  ├── "Interview prep" → router.push('/interview?company=Y')
  └── "Draft outreach" → opens ChatDrawer with pre-filled message
```

## Data Flow — Mark as Applied

```
JobDetail
  └── handleMarkApplied()
        └── POST /api/applications { company, jobTitle, location, url, matchScore }
              └── appendToApplicationsStore(entry)
                    └── returns { ok: true, id }
        └── setState → button shows "Applied" chip
```

The applications store (`src/lib/applications.ts`) gains an `appendApplication()` function alongside the existing `DEMO_APPLICATIONS` array, operating on a module-level mutable array for the demo.

## Files Touched

| File | Type | Change |
|---|---|---|
| `src/components/jobs/JobDetail.tsx` | Modify | Wire up 4 action rows, add `handleMarkApplied`, remove emojis |
| `src/app/api/applications/route.ts` | Create | POST handler — append to store, 409 on duplicate |
| `src/lib/applications.ts` | Modify | Add `appendApplication()` and mutable `liveApplications` array |
| `src/components/cv/CVPageClient.tsx` | Modify | Read `useSearchParams`, pre-fill job target |
| `src/components/cv/ProfileColumn.tsx` | Possibly modify | Expose a job target input if not already present |
| `src/components/interview/InterviewPageClient.tsx` | Modify | Read `useSearchParams`, pre-fill company |

## Out of Scope

- Persisting applications to a database (still in-memory demo)
- Onboarding flow for new users
- Any changes to Dashboard, Applications kanban, or CV generation logic
- LinkedIn outreach actually finding a contact (chat drawer pre-fill only)
