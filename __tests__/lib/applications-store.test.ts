/**
 * @jest-environment node
 */
import {
  appendApplication,
  isDuplicate,
  getAllApplications,
  resetApplicationsForTest,
} from '@/lib/applications'

beforeEach(() => resetApplicationsForTest())

describe('isDuplicate', () => {
  it('returns false for unknown company+role', () => {
    expect(isDuplicate('NewCo', 'Wizard')).toBe(false)
  })

  it('returns true for existing DEMO_APPLICATIONS entry (case-insensitive)', () => {
    expect(isDuplicate('neom', 'ai platform engineer')).toBe(true)
  })
})

describe('appendApplication', () => {
  it('adds entry and getAllApplications returns it', () => {
    const before = getAllApplications().length
    appendApplication({ company: 'Acme', jobTitle: 'CTO', matchScore: 4.2 })
    expect(getAllApplications()).toHaveLength(before + 1)
  })

  it('sets status to applied and appliedAt to today', () => {
    const app = appendApplication({ company: 'Acme', jobTitle: 'CTO', matchScore: 4.2 })
    expect(app.status).toBe('applied')
    expect(app.appliedAt).toBeDefined()
    expect(app.id).toBeTruthy()
  })

  it('isDuplicate returns true after append', () => {
    appendApplication({ company: 'Acme', jobTitle: 'CTO', matchScore: 4.2 })
    expect(isDuplicate('Acme', 'CTO')).toBe(true)
  })
})
