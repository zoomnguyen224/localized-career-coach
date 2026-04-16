/**
 * @jest-environment node
 */
import { GET } from '@/app/api/jobs/scan/route'

jest.mock('@/lib/agents/job-scanner', () => ({
  scanAllMENAPortals: jest.fn().mockResolvedValue([
    {
      id: 'test-1', externalId: 'test-1', atsSource: 'mock',
      company: 'STC', companySlug: 'stc', title: 'AI Engineer',
      location: 'Riyadh', country: 'KSA', url: 'https://stc.com',
      remoteType: 'hybrid', roleCategory: 'ai-ml',
    }
  ])
}))

describe('GET /api/jobs/scan', () => {
  it('returns jobs array with 200 status', async () => {
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.jobs)).toBe(true)
    expect(data.jobs).toHaveLength(1)
    expect(data.jobs[0].company).toBe('STC')
  })
})
