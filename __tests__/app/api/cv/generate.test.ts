/**
 * @jest-environment node
 */
import { POST } from '@/app/api/cv/generate/route'

jest.mock('@/lib/agents/cv-generator', () => ({
  generateTailoredCV: jest.fn().mockResolvedValue({
    keywords: ['LLM', 'RAG'],
    keywordsInjected: 2,
    atsScore: 85,
    html: '<html><body>Tailored CV</body></html>',
  }),
}))

describe('POST /api/cv/generate', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/cv/generate', {
      method: 'POST',
      body: JSON.stringify({ cvMarkdown: '# Test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns generation result with 200 status', async () => {
    const req = new Request('http://localhost/api/cv/generate', {
      method: 'POST',
      body: JSON.stringify({
        cvMarkdown: '# Ahmed Nasser',
        jobTitle: 'LLM Engineer',
        jobDescription: 'Build RAG systems',
        company: 'STC',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.atsScore).toBe(85)
    expect(data.keywords).toEqual(['LLM', 'RAG'])
  })
})
