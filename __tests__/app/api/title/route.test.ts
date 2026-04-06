/**
 * @jest-environment node
 */

global.fetch = jest.fn()

import { POST } from '@/app/api/title/route'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.OPENROUTER_API_KEY = 'sk-or-test'
})

describe('POST /api/title', () => {
  it('returns 400 if firstUserMessage is missing', async () => {
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({ firstAssistantMessage: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 if firstAssistantMessage is missing', async () => {
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({ firstUserMessage: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns fallback title if OPENROUTER_API_KEY is not set', async () => {
    delete process.env.OPENROUTER_API_KEY
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({ firstUserMessage: 'hi', firstAssistantMessage: 'hello' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('New Conversation')
  })

  it('returns trimmed title from OpenRouter', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        choices: [{ message: { content: '  Product Manager in UAE  ' } }],
      }),
    })
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({
        firstUserMessage: 'I want to become a Product Manager',
        firstAssistantMessage: 'Great. UAE has strong PM demand.',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Product Manager in UAE')
  })

  it('returns fallback title if fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network error'))
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: JSON.stringify({ firstUserMessage: 'hi', firstAssistantMessage: 'hello' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.title).toBe('New Conversation')
  })
})
