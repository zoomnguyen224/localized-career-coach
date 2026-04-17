/**
 * @jest-environment node
 */

const mockFromDocuments = jest.fn()

jest.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('langchain/vectorstores/memory', () => ({
  MemoryVectorStore: {
    fromDocuments: mockFromDocuments,
  },
}))

jest.mock('@/lib/vector-store', () => ({
  setVectorStore: jest.fn(),
  getVectorStore: jest.fn(),
  clearVectorStore: jest.fn(),
  saveMarkdownToRedis: jest.fn(),
  getMarkdownFromRedis: jest.fn(),
}))

import { POST } from '@/app/api/embed-cv/route'
import { setVectorStore } from '@/lib/vector-store'

describe('POST /api/embed-cv', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 if markdown is missing', async () => {
    const req = new Request('http://localhost/api/embed-cv', {
      method: 'POST',
      body: JSON.stringify({ threadId: 'thread-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 if threadId is missing', async () => {
    const req = new Request('http://localhost/api/embed-cv', {
      method: 'POST',
      body: JSON.stringify({ markdown: 'some text' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 503 if OPENROUTER_API_KEY is not set', async () => {
    const original = process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_API_KEY

    const req = new Request('http://localhost/api/embed-cv', {
      method: 'POST',
      body: JSON.stringify({ markdown: 'some text', threadId: 'thread-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(503)

    if (original !== undefined) process.env.OPENROUTER_API_KEY = original
  })

  it('chunks, embeds, stores, and returns chunkCount', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    const fakeStore = { similaritySearch: jest.fn() }
    mockFromDocuments.mockResolvedValue(fakeStore)

    const req = new Request('http://localhost/api/embed-cv', {
      method: 'POST',
      body: JSON.stringify({
        markdown: 'Work Experience\n\nSoftware Engineer at Acme Corp 2020-2023\n\nEducation\n\nBS Computer Science',
        threadId: 'thread-abc',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(typeof body.chunkCount).toBe('number')
    expect(body.chunkCount).toBeGreaterThan(0)
    expect(setVectorStore).toHaveBeenCalledWith('thread-abc', fakeStore)
  })
})
