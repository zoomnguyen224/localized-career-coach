/**
 * @jest-environment node
 */
import { writeMapNodeTool } from '@/lib/tools/write-map-node'
import { allTools } from '@/lib/tools'

describe('writeMapNodeTool — shape + metadata', () => {
  it('exposes the exact tool name the SSE registry will match on', () => {
    // Critical: the Task 4b client-side handler will dispatch on this literal
    // name. If it drifts, write-back silently breaks.
    expect(writeMapNodeTool.name).toBe('write_map_node')
  })

  it('carries a description that instructs the agent to use provided ids only', () => {
    // We don't snapshot the whole string — but the anti-hallucination rules
    // are load-bearing enough to assert on.
    expect(writeMapNodeTool.description).toMatch(/do not invent nodeids/i)
    expect(writeMapNodeTool.description).toMatch(/cite specific evidence|cite evidence|citation|observed/i)
    expect(writeMapNodeTool.description).toMatch(/silent|silence/i)
  })

  it('is registered in the shared `allTools` array', () => {
    const names = allTools.map((t) => t.name)
    expect(names).toContain('write_map_node')
  })
})

describe('writeMapNodeTool.invoke — valid inputs', () => {
  it('returns { ok: true, patch } with the submitted fields echoed back', async () => {
    const before = Date.now()
    const result = await writeMapNodeTool.invoke({
      nodeId: 'skill:sql-window-fns',
      status: 'weak',
      evidence:
        'Mock Q2 · SQL window functions — wrote ROW_NUMBER() without PARTITION BY',
      confidenceDelta: -0.3,
    })
    const after = Date.now()

    expect(result).toMatchObject({
      ok: true,
      patch: {
        nodeId: 'skill:sql-window-fns',
        status: 'weak',
        evidence:
          'Mock Q2 · SQL window functions — wrote ROW_NUMBER() without PARTITION BY',
        confidenceDelta: -0.3,
      },
    })

    // Timestamp is a fresh ISO string within the test window.
    const ts = Date.parse(result.patch.at)
    expect(Number.isFinite(ts)).toBe(true)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
    expect(result.patch.at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    )
  })

  it("accepts 'confirmed' and positive deltas for upgrade events", async () => {
    const result = await writeMapNodeTool.invoke({
      nodeId: 'skill:sql',
      status: 'confirmed',
      evidence: 'Mock Q3 · SQL joins — correctly used LEFT JOIN with COALESCE',
      confidenceDelta: 0.4,
    })
    expect(result.patch.status).toBe('confirmed')
    expect(result.patch.confidenceDelta).toBe(0.4)
  })

  it("accepts 'gap' for unattempted questions", async () => {
    const result = await writeMapNodeTool.invoke({
      nodeId: 'skill:airflow',
      status: 'gap',
      evidence: "Mock Q5 · Airflow DAGs — learner said 'I haven't used Airflow'",
      confidenceDelta: 0,
    })
    expect(result.patch.status).toBe('gap')
  })

  it('is deterministic for everything except the timestamp', async () => {
    const input = {
      nodeId: 'skill:sql-window-fns',
      status: 'weak' as const,
      evidence: 'Mock Q1 · window fns — missing OVER()',
      confidenceDelta: -0.2,
    }
    const a = await writeMapNodeTool.invoke(input)
    const b = await writeMapNodeTool.invoke(input)
    expect(a.patch.nodeId).toBe(b.patch.nodeId)
    expect(a.patch.status).toBe(b.patch.status)
    expect(a.patch.evidence).toBe(b.patch.evidence)
    expect(a.patch.confidenceDelta).toBe(b.patch.confidenceDelta)
    // `at` can differ by ms; that's expected.
  })
})

describe('writeMapNodeTool.invoke — Zod rejections', () => {
  // LangChain's `tool()` wraps the handler in a `DynamicStructuredTool` that
  // validates input against the Zod schema before invoking the handler.
  // Invalid shapes must reject, not silently pass through.

  it('rejects an unknown status enum value', async () => {
    await expect(
      writeMapNodeTool.invoke({
        nodeId: 'skill:sql',
        // @ts-expect-error — deliberately bad input for the runtime check.
        status: 'maybe',
        evidence: 'some evidence',
        confidenceDelta: 0,
      })
    ).rejects.toThrow()
  })

  it('rejects confidenceDelta > 1', async () => {
    await expect(
      writeMapNodeTool.invoke({
        nodeId: 'skill:sql',
        status: 'weak',
        evidence: 'some evidence',
        confidenceDelta: 2,
      })
    ).rejects.toThrow()
  })

  it('rejects confidenceDelta < -1', async () => {
    await expect(
      writeMapNodeTool.invoke({
        nodeId: 'skill:sql',
        status: 'weak',
        evidence: 'some evidence',
        confidenceDelta: -1.5,
      })
    ).rejects.toThrow()
  })

  it('rejects an empty nodeId', async () => {
    await expect(
      writeMapNodeTool.invoke({
        nodeId: '',
        status: 'weak',
        evidence: 'some evidence',
        confidenceDelta: 0,
      })
    ).rejects.toThrow()
  })

  it('rejects an empty evidence string', async () => {
    await expect(
      writeMapNodeTool.invoke({
        nodeId: 'skill:sql',
        status: 'weak',
        evidence: '',
        confidenceDelta: 0,
      })
    ).rejects.toThrow()
  })

  it('rejects a missing field', async () => {
    await expect(
      // @ts-expect-error — deliberately missing `confidenceDelta`.
      writeMapNodeTool.invoke({
        nodeId: 'skill:sql',
        status: 'weak',
        evidence: 'some evidence',
      })
    ).rejects.toThrow()
  })
})

describe('writeMapNodeTool — server-side purity', () => {
  it('does not touch localStorage (localStorage is undefined in the node env)', async () => {
    // This test runs in `@jest-environment node` — localStorage is not
    // defined on `globalThis` there. If the tool ever tried to call
    // `window.localStorage.setItem`, the invocation would throw a
    // ReferenceError. Asserting it resolves cleanly is our purity guard.
    expect(typeof (globalThis as { localStorage?: unknown }).localStorage).toBe(
      'undefined'
    )
    await expect(
      writeMapNodeTool.invoke({
        nodeId: 'skill:sql',
        status: 'weak',
        evidence: 'Mock Q2 — missed OVER()',
        confidenceDelta: -0.2,
      })
    ).resolves.toMatchObject({ ok: true })
  })
})
