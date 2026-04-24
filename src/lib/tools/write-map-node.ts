// src/lib/tools/write-map-node.ts
//
// `write_map_node` — the 12th LangGraph tool (11th in `allTools`, plus the
// per-thread `search_resume`). Lets the interview agent record evidence of a
// weakness, strength, or genuine gap against a specific Career Map node.
//
// Persistence model: the server does NOT write to any store. The Career Map
// lives entirely in the browser's localStorage (see `src/lib/career-map/store.ts`
// and CLAUDE.md — "Session model: entirely client-side via localStorage"). The
// tool's job is to validate the patch and echo it back through the SSE
// `tool_result` channel. A future client-side handler (Task 4b) picks up the
// `write_map_node` tool_result and applies the patch locally via `saveGraph`.
//
// Output shape intentionally wraps the patch in `{ ok, patch }` so the client
// handler has a single, predictable envelope: read `result.ok`, then mutate
// from `result.patch`.

import { tool } from '@langchain/core/tools'
import { z } from 'zod'

// ── shared types ─────────────────────────────────────────────────────────

/** Valid statuses accepted by `write_map_node`. Mirrors a strict subset of
 *  `NodeStatus` from `src/lib/career-map/types.ts`: we explicitly exclude
 *  'unknown' — the agent must commit to a classification or stay silent. */
export type WriteMapNodeStatus = 'weak' | 'confirmed' | 'gap'

export interface WriteMapNodePatch {
  nodeId: string
  status: WriteMapNodeStatus
  evidence: string
  confidenceDelta: number
  /** ISO timestamp — when the agent emitted the patch. */
  at: string
}

export interface WriteMapNodeResult {
  ok: true
  patch: WriteMapNodePatch
}

// ── zod schema ───────────────────────────────────────────────────────────

const writeMapNodeSchema = z.object({
  nodeId: z
    .string()
    .min(1)
    .describe(
      "Stable id of the career-map node the observation maps to, e.g. 'skill:sql-window-fns'. Use ONLY an id listed in the learner's map context — never invent one."
    ),
  status: z
    .enum(['weak', 'confirmed', 'gap'])
    .describe(
      "New status for the node based on interview evidence. 'weak' = attempted but made errors revealing a genuine gap. 'confirmed' = answered correctly and thoroughly, upgrading a prior gap. 'gap' = couldn't engage at all."
    ),
  evidence: z
    .string()
    .min(1)
    .describe(
      'One-line citation: mock question summary + specific observed error or correct pattern. Example: "Mock Q2 · SQL window functions — wrote ROW_NUMBER() without PARTITION BY".'
    ),
  confidenceDelta: z
    .number()
    .min(-1)
    .max(1)
    .describe(
      'Directional confidence adjustment for the node, -1..+1. Positive for correct answers, negative for observed weakness, 0 if you only want to record evidence without shifting confidence.'
    ),
})

// ── tool description (load-bearing — guides agent behaviour) ─────────────

const TOOL_DESCRIPTION = `Record a Career Map weakness, gap, or confirmation based on observed interview evidence.

Call ONLY when:
- You have a specific skill the learner demonstrated weakness OR strength on.
- The weakness/strength maps to a named node in the learner's Career Map (provided in context at session start).
- You can cite specific evidence (mock question number, question topic, observed error or correct answer pattern).

Status values:
- "weak": learner attempted but made errors revealing a genuine gap.
- "confirmed": learner answered correctly and thoroughly, upgrading an existing gap.
- "gap": learner didn't attempt or couldn't engage at all.

Do NOT invent nodeIds. Use ONLY nodeIds listed in the map context at session start.
If you can't attribute weakness to a named node, stay silent. No hand-wavy "work on communication."`

// ── tool ─────────────────────────────────────────────────────────────────

/**
 * LangGraph tool that records a single Career Map node update based on
 * interview evidence. Pure transform: validates the input via Zod, stamps an
 * ISO timestamp, and returns a `{ ok, patch }` envelope for the SSE stream.
 *
 * Does NOT touch localStorage or any server-side store. The browser handler
 * (Task 4b) is responsible for applying the patch.
 */
export const writeMapNodeTool = tool(
  async (input): Promise<WriteMapNodeResult> => {
    // Zod has already validated the input by the time we're in here, but we
    // re-type locally to keep the handler self-contained.
    const { nodeId, status, evidence, confidenceDelta } = input

    return {
      ok: true,
      patch: {
        nodeId,
        status,
        evidence,
        confidenceDelta,
        at: new Date().toISOString(),
      },
    }
  },
  {
    name: 'write_map_node',
    description: TOOL_DESCRIPTION,
    schema: writeMapNodeSchema,
  }
)

/** Re-exported so tests can assert against the exact schema description
 *  without taking a dependency on Zod internals. */
export { writeMapNodeSchema, TOOL_DESCRIPTION }
