/**
 * @jest-environment node
 */
import { POST } from '@/app/api/jobs/evaluate/route'

jest.mock('@/lib/agents/job-evaluator', () => ({
  evaluateJob: jest.fn().mockResolvedValue({
    overall: 4.5, cvMatch: 4.8, roleAlignment: 4.6,
    compensation: 4.2, culturalSignals: 4.0,
    redFlags: null, recommendation: 'Strong match', archetype: 'LLMOps',
    skillsMatch: []
  })
}))

describe('POST /api/jobs/evaluate', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/jobs/evaluate', {
      method: 'POST',
      body: JSON.stringify({ jobTitle: 'AI Engineer' }), // missing jobDescription, company, cvMarkdown
      headers: { 'Content-Type': 'application/json' }
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns evaluation result with 200 status', async () => {
    const req = new Request('http://localhost/api/jobs/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle: 'AI Engineer',
        jobDescription: 'Build LLM systems...',
        company: 'STC',
        cvMarkdown: '# Ahmed Nasser\nAI Engineer',
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    const response = await POST(req)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.overall).toBe(4.5)
    expect(data.recommendation).toBe('Strong match')
  })
})
