/**
 * @jest-environment node
 */
import { POST } from '@/app/api/chat/route'

const mockStream = jest.fn()

jest.mock('@/lib/graph', () => ({
  createGraph: jest.fn(() => ({ stream: mockStream })),
}))

async function collectSSE(response: Response): Promise<string[]> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value)
  }
  return result.split('\n').filter(l => l.startsWith('data: ')).map(l => l.slice(6))
}

describe('POST /api/chat', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 if messages is missing', async () => {
    const req = new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({}) })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 if threadId is missing', async () => {
    const req = new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({ messages: [] }) })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('streams text events for AI text chunks', async () => {
    const mockChunk = { _getType: () => 'ai', content: 'Hello from the AI', tool_calls: [], tool_call_chunks: [] }
    mockStream.mockResolvedValue((async function* () { yield [mockChunk, {}] })())

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }], threadId: 'test-123' }),
    })
    const res = await POST(req)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')
    const events = await collectSSE(res)
    const textEvent = events.find(e => { try { return JSON.parse(e).type === 'text' } catch { return false } })
    expect(textEvent).toBeDefined()
    expect(JSON.parse(textEvent!).content).toBe('Hello from the AI')
    expect(events.at(-1)).toBe('[DONE]')
  })

  it('streams tool_call event when AI initiates a tool call', async () => {
    const mockChunk = { _getType: () => 'ai', content: '', tool_calls: [], tool_call_chunks: [{ name: 'skill_gap_analysis', id: 'call_123', args: '' }] }
    mockStream.mockResolvedValue((async function* () { yield [mockChunk, {}] })())

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Analyze' }], threadId: 'test-456' }),
    })
    const res = await POST(req)
    const events = await collectSSE(res)
    const toolEvent = events.find(e => { try { return JSON.parse(e).type === 'tool_call' } catch { return false } })
    expect(toolEvent).toBeDefined()
    expect(JSON.parse(toolEvent!).name).toBe('skill_gap_analysis')
  })

  it('streams error event and [DONE] when graph throws', async () => {
    mockStream.mockResolvedValue((async function* () { throw new Error('API error') })())

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }], threadId: 'test-789' }),
    })
    const res = await POST(req)
    const events = await collectSSE(res)
    const errorEvent = events.find(e => { try { return JSON.parse(e).type === 'error' } catch { return false } })
    expect(errorEvent).toBeDefined()
    expect(events.at(-1)).toBe('[DONE]')
  })
})
