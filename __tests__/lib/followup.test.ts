import { computeFollowUps } from '@/lib/followup'
import type { Application } from '@/types/applications'

const baseApp: Application = {
  id: '1', company: 'TestCo', jobTitle: 'Engineer',
  matchScore: 4.0, status: 'applied',
  lastActivity: new Date(Date.now() - 10 * 86400000).toISOString(),
  alertType: null,
}

describe('computeFollowUps', () => {
  it('returns empty array when no alerts', () => {
    expect(computeFollowUps([baseApp])).toEqual([])
  })

  it('returns interview action for interview alertType', () => {
    const app: Application = { ...baseApp, status: 'interview', alertType: 'interview', alertMessage: 'Interview at 3pm' }
    const result = computeFollowUps([app])
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('interview')
    expect(result[0].label).toContain('TestCo')
    expect(result[0].description).toBe('Interview at 3pm')
  })

  it('returns offer action for deadline alertType', () => {
    const app: Application = { ...baseApp, status: 'offer', alertType: 'deadline', alertMessage: 'Deadline in 2 days' }
    const result = computeFollowUps([app])
    expect(result[0].type).toBe('offer')
    expect(result[0].label).toContain('TestCo')
  })

  it('returns follow-up action for follow-up alertType', () => {
    const app: Application = { ...baseApp, alertType: 'follow-up', alertMessage: 'No response in 8 days' }
    const result = computeFollowUps([app])
    expect(result[0].type).toBe('follow-up')
    expect(result[0].description).toBe('No response in 8 days')
  })

  it('sorts offer > interview > follow-up', () => {
    const apps: Application[] = [
      { ...baseApp, id: '1', alertType: 'follow-up', alertMessage: 'Follow up' },
      { ...baseApp, id: '2', status: 'interview', alertType: 'interview', alertMessage: 'Interview' },
      { ...baseApp, id: '3', status: 'offer', alertType: 'deadline', alertMessage: 'Deadline' },
    ]
    const result = computeFollowUps(apps)
    expect(result[0].type).toBe('offer')
    expect(result[1].type).toBe('interview')
    expect(result[2].type).toBe('follow-up')
  })

  it('limits to 3 actions', () => {
    const apps: Application[] = Array.from({ length: 5 }, (_, i) => ({
      ...baseApp, id: String(i), alertType: 'follow-up' as const, alertMessage: `Follow up ${i}`,
    }))
    expect(computeFollowUps(apps)).toHaveLength(3)
  })

  it('skips apps with no alertMessage', () => {
    const app: Application = { ...baseApp, alertType: 'follow-up' }  // no alertMessage
    expect(computeFollowUps([app])).toEqual([])
  })
})
