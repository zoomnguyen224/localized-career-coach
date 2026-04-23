# Localized Design System

Single visual standard for the entire app, modeled after `/home`. The chrome, typography, and palette established on the landing page apply to every workspace page.

## Shell

- **TopBar** (`src/components/shell/TopBar.tsx`) — 64px sticky header. Four narrative slots: `Home · Events · Jobs · Career Map`. Right cluster: search, career-agent chat, notifications, avatar.
- **WorkStrip** (`src/components/shell/WorkStrip.tsx`) — 36px secondary row, only on workspace pages. Label `MY WORK` + `Dashboard · Applications · My CV · Interview Prep`.
- **ChatDrawer** — right-side drawer opened from TopBar's chat icon.

Routing lives under `src/app/(shell)/` — the route-group layout (`(shell)/layout.tsx`) resolves the active nav for each path and conditionally renders the WorkStrip.

## Typography

Three families, loaded globally from `src/app/layout.tsx`:

- **Inter** (`--font-inter`, `--brand-font-display` / `--brand-font-ui`) — body, nav, UI.
- **Fraunces** (`--font-fraunces`, `--brand-font-soft`) — display serif for hero `h1` and italic emphasis moments. Use sparingly.
- **JetBrains Mono** (`--font-jetbrains-mono`, `--brand-font-mono`) — labels, timestamps, section numbers, micro-copy.

## Color tokens

All brand tokens use a `--brand-*` prefix to avoid collision with shadcn (`--accent`, `--border`, `--ring`, etc.) and with the legacy Coinbase tokens (`--color-navy: #0a0b0d`, `--color-blue: #0052ff`) still referenced by some generative-ui components until a full migration.

Defined in `src/app/globals.css`:

**Brand**
- `--brand-navy: #0b2b6f` — headings, brand mark, active nav
- `--brand-accent: #1a8fff` — active indicators, primary actions, italic emphasis

**Ink (text)**
- `--brand-ink-0: #0a1330` — primary text
- `--brand-ink-1: #4a5470` — body text
- `--brand-ink-2: #7a849b` — secondary text
- `--brand-ink-3: #b5bcca` — muted / meta

**Surfaces**
- `--brand-bg-0: #ffffff` — card surface
- `--brand-bg-1: #f7f8fb` — page background
- `--brand-bg-2: #eef1f6` — neutral chip bg
- `--brand-bg-paper: #fbfaf6` — canvas

**Lines**
- `--brand-line: #e4e8ef`
- `--brand-line-soft: #eef1f6`

**Severity palette** (for data meaning, not decoration)
- `--brand-severity-ok` / `-soft` — green (matches, confirmed)
- `--brand-severity-med` / `-soft` — amber (watch, in-progress)
- `--brand-severity-high` / `-soft` — rose (gap, at-risk)
- `--brand-severity-info` / `-soft` — accent blue (informational)

Each severity also has a raw color (`--brand-emerald`, `--brand-amber`, `--brand-rose`, `--brand-accent`).

## Primitives

- **Hero** (`src/components/primitives/Hero.tsx`) — Fraunces `h1` + optional Inter subtitle + right-aligned mono byline. Use on every page.
- **SectionLabel** (`src/components/primitives/SectionLabel.tsx`) — `01 · Title · hairline · meta`. Numbers each major section.
- **DataRow** (`src/components/primitives/DataRow.tsx`) — 26px logo + title + sub + tail chip. Building block for job rows, application cards, CV variants, interview sessions.
- **SeverityCard** (`src/components/primitives/SeverityCard.tsx`) — severity tick + label + title + `forYou` body + event list. Use for "here's a situation, here's what it means, here's the evidence."
- **PageShell** (`src/components/shell/PageShell.tsx`) — max-width 1280px container.

## Usage rules

- **One template per page** — Hero at top, then numbered `01 / 02 / 03 …` sections. No per-page chrome experiments.
- **Severity palette is for data meaning**, never decoration. A red tick means a gap, not "this looks nice."
- **Mono for micro-copy** — labels, timestamps, counts, metadata. Not for body reading.
- **Fraunces for emotional moments only** — hero `h1`, italic emphasis on a specific word. Never for body paragraphs or nav.
- **Tailwind arbitrary values** reference CSS vars: `bg-[var(--brand-accent)]`, `text-[var(--brand-ink-0)]`. Avoid new `bg-navy` / `bg-blue` / `bg-green` classes — those resolve to the legacy Coinbase palette still registered in `@theme inline` for generative-ui compatibility. Use `bg-brand-navy`, `bg-brand-accent`, `bg-brand-severity-ok` instead.
- **shadcn primitives** (`src/components/ui/*`) keep their shadcn tokens (`--accent`, `--border`, `--ring`). Don't apply brand tokens to them.

## Legacy tokens (kept for compatibility)

The following still live inside `@theme inline` because `src/components/generative-ui/*` reference them via Tailwind classes (`bg-navy`, `bg-blue`, `bg-green`):

- `--color-navy: #0a0b0d` (maps to Tailwind `navy` utilities — near-black, unrelated to `--brand-navy`)
- `--color-blue: #0052ff`
- `--color-teal`, `--color-green`, `--color-blue-hover`, `--color-bg`, `--color-card`, `--color-border`, `--color-surface`, `--color-muted`

Over time, migrate generative-ui to `--brand-*` tokens and retire these.
