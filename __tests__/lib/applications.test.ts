import {
  moveApplication,
  computeStats,
  scoreColorClass,
  cardLeftBorderClass,
} from '@/lib/applications'
import type { Application } from '@/types/applications'

const makeApp = (overrides: Partial<Application> = {}): Application => ({
  id: '1',
  company: 'STC',
  jobTitle: 'LLM Engineer',
  matchScore: 4.2,
  status: 'applied',
  lastActivity: new Date(Date.now() - 86400000).toISOString(),
  alertType: null,
  ...overrides,
})

describe('moveApplication', () => {
  it('updates the status of the matching application', () => {
    const apps = [makeApp({ id: '1', status: 'applied' }), makeApp({ id: '2', status: 'evaluated' })]
    const result = moveApplication(apps, '1', 'interview')
    expect(result.find(a => a.id === '1')!.status).toBe('interview')
  })

  it('leaves other applications unchanged', () => {
    const apps = [makeApp({ id: '1' }), makeApp({ id: '2', status: 'evaluated' })]
    const result = moveApplication(apps, '1', 'offer')
    expect(result.find(a => a.id === '2')!.status).toBe('evaluated')
  })

  it('updates lastActivity on the moved application', () => {
    const before = new Date(Date.now() - 86400000).toISOString()
    const apps = [makeApp({ id: '1', lastActivity: before })]
    const result = moveApplication(apps, '1', 'interview')
    expect(result[0].lastActivity).not.toBe(before)
  })
})

describe('computeStats', () => {
  it('counts sent as applied + interview + offer + rejected', () => {
    const apps = [
      makeApp({ status: 'evaluated' }),
      makeApp({ status: 'applied' }),
      makeApp({ status: 'interview' }),
      makeApp({ status: 'offer' }),
      makeApp({ status: 'rejected' }),
    ]
    const stats = computeStats(apps)
    expect(stats.sent).toBe(4)
  })

  it('computes average match score rounded to 1 decimal', () => {
    const apps = [makeApp({ matchScore: 4.0 }), makeApp({ matchScore: 5.0 })]
    const stats = computeStats(apps)
    expect(stats.avgScore).toBe(4.5)
  })

  it('returns pipeline counts per status', () => {
    const apps = [
      makeApp({ status: 'evaluated' }),
      makeApp({ status: 'evaluated' }),
      makeApp({ status: 'applied' }),
    ]
    const stats = computeStats(apps)
    expect(stats.pipelineCounts.evaluated).toBe(2)
    expect(stats.pipelineCounts.applied).toBe(1)
    expect(stats.pipelineCounts.interview).toBe(0)
  })

  it('returns zeros for empty array', () => {
    const stats = computeStats([])
    expect(stats.sent).toBe(0)
    expect(stats.avgScore).toBe(0)
  })
})

describe('scoreColorClass', () => {
  it('returns severity-ok class for score >= 4.0', () => {
    expect(scoreColorClass(4.0)).toContain('brand-severity-ok')
    expect(scoreColorClass(4.7)).toContain('brand-severity-ok')
  })

  it('returns severity-med class for score >= 3.5 and < 4.0', () => {
    expect(scoreColorClass(3.5)).toContain('brand-severity-med')
    expect(scoreColorClass(3.9)).toContain('brand-severity-med')
  })

  it('returns severity-high class for score < 3.5', () => {
    expect(scoreColorClass(3.4)).toContain('brand-severity-high')
    expect(scoreColorClass(2.0)).toContain('brand-severity-high')
  })
})

describe('cardLeftBorderClass', () => {
  it('returns accent border for interview alert', () => {
    expect(cardLeftBorderClass('interview', 'interview')).toContain('brand-accent')
  })

  it('returns severity-med border for follow-up alert', () => {
    expect(cardLeftBorderClass('follow-up', 'applied')).toContain('brand-severity-med')
  })

  it('returns severity-med border for deadline alert', () => {
    expect(cardLeftBorderClass('deadline', 'offer')).toContain('brand-severity-med')
  })

  it('returns transparent border for null alert on non-offer status', () => {
    expect(cardLeftBorderClass(null, 'applied')).toContain('transparent')
  })
})
