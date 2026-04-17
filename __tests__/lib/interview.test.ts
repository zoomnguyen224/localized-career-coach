import { getInterviewSessions } from '@/lib/interview'
import type { Application } from '@/types/applications'

const makeApp = (overrides: Partial<Application> = {}): Application => ({
  id: '1',
  company: 'Test Co',
  jobTitle: 'Engineer',
  matchScore: 4.0,
  status: 'applied',
  lastActivity: new Date().toISOString(),
  alertType: null,
  ...overrides,
})

describe('getInterviewSessions', () => {
  it('returns only applications with status interview', () => {
    const apps = [
      makeApp({ id: '1', status: 'interview' }),
      makeApp({ id: '2', status: 'applied' }),
      makeApp({ id: '3', status: 'interview' }),
    ]
    expect(getInterviewSessions(apps)).toHaveLength(2)
  })

  it('maps to InterviewSession shape with correct fields', () => {
    const apps = [
      makeApp({
        id: '6',
        company: 'Emirates NBD',
        jobTitle: 'Head of AI',
        status: 'interview',
        appliedAt: '2024-01-01T00:00:00.000Z',
        alertMessage: 'Interview tomorrow',
      }),
    ]
    const sessions = getInterviewSessions(apps)
    expect(sessions[0]).toMatchObject({
      id: '6',
      company: 'Emirates NBD',
      role: 'Head of AI',
      appliedAt: '2024-01-01T00:00:00.000Z',
      alertMessage: 'Interview tomorrow',
    })
  })

  it('returns empty array when no interview applications', () => {
    const apps = [
      makeApp({ status: 'applied' }),
      makeApp({ status: 'rejected' }),
      makeApp({ status: 'evaluated' }),
    ]
    expect(getInterviewSessions(apps)).toHaveLength(0)
  })
})
