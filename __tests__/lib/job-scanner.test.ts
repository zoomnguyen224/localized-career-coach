import { fetchGreenhouseJobs, fetchLeverJobs, buildMockJobs } from '@/lib/agents/job-scanner'

describe('fetchGreenhouseJobs', () => {
  it('returns empty array on network error without throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    const result = await fetchGreenhouseJobs('stc', 'STC', 'KSA')
    expect(result).toEqual([])
  })

  it('parses greenhouse job list into Job array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          { id: 123, title: 'AI Engineer', absolute_url: 'https://boards.greenhouse.io/stc/jobs/123', location: { name: 'Riyadh' } }
        ]
      })
    })
    const result = await fetchGreenhouseJobs('stc', 'STC', 'KSA')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('AI Engineer')
    expect(result[0].atsSource).toBe('greenhouse')
    expect(result[0].company).toBe('STC')
  })
})

describe('fetchLeverJobs', () => {
  it('returns empty array on network error without throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    const result = await fetchLeverJobs('talabat', 'Talabat', 'UAE')
    expect(result).toEqual([])
  })

  it('parses lever posting array into Job array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 'abc123', text: 'LLM Engineer', hostedUrl: 'https://jobs.lever.co/talabat/abc123', categories: { location: 'Dubai' } }
      ])
    })
    const result = await fetchLeverJobs('talabat', 'Talabat', 'UAE')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('LLM Engineer')
    expect(result[0].atsSource).toBe('lever')
  })
})

describe('buildMockJobs', () => {
  it('returns array of jobs with required fields', () => {
    const jobs = buildMockJobs()
    expect(jobs.length).toBeGreaterThan(0)
    jobs.forEach(job => {
      expect(job.id).toBeDefined()
      expect(job.company).toBeDefined()
      expect(job.title).toBeDefined()
      expect(job.atsSource).toBe('mock')
    })
  })
})
