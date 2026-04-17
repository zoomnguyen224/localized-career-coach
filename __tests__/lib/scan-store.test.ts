import { getScanState, getStoredJobs, startScan, completeScan, resetForTest } from '@/lib/scan-store'
import type { Job } from '@/types/jobs'

const mockJob: Job = {
  id: 'test-1', externalId: 'test-1', atsSource: 'mock',
  company: 'TestCo', companySlug: 'testco', title: 'Engineer',
  location: 'Dubai', country: 'UAE', url: 'https://example.com',
  remoteType: 'hybrid', roleCategory: 'ai-ml',
}

beforeEach(() => {
  resetForTest()
})

describe('scan-store', () => {
  it('starts with isScanning false and lastScanAt null', () => {
    const state = getScanState()
    expect(state.isScanning).toBe(false)
    expect(state.lastScanAt).toBeNull()
    expect(state.totalJobsCount).toBe(0)
    expect(state.newJobsCount).toBe(0)
  })

  it('startScan sets isScanning true', () => {
    startScan()
    expect(getScanState().isScanning).toBe(true)
  })

  it('completeScan stores total job count and clears isScanning', () => {
    startScan()
    completeScan([mockJob])
    const state = getScanState()
    expect(state.isScanning).toBe(false)
    expect(state.totalJobsCount).toBe(1)
  })

  it('completeScan makes jobs accessible via getStoredJobs', () => {
    completeScan([mockJob])
    expect(getStoredJobs()).toHaveLength(1)
    expect(getStoredJobs()[0].id).toBe('test-1')
  })

  it('completeScan counts new jobs vs previous scan', () => {
    completeScan([mockJob])
    expect(getScanState().newJobsCount).toBe(1)  // first scan: all are new

    const anotherJob: Job = { ...mockJob, id: 'test-2', externalId: 'test-2' }
    completeScan([mockJob, anotherJob])
    expect(getScanState().newJobsCount).toBe(1)  // only test-2 is new
  })

  it('completeScan sets lastScanAt to current time', () => {
    const before = Date.now()
    completeScan([])
    const lastScan = getScanState().lastScanAt
    expect(lastScan).not.toBeNull()
    expect(new Date(lastScan!).getTime()).toBeGreaterThanOrEqual(before)
  })

  it('resetForTest restores clean state', () => {
    startScan()
    completeScan([mockJob])
    resetForTest()
    const state = getScanState()
    expect(state.isScanning).toBe(false)
    expect(state.lastScanAt).toBeNull()
    expect(state.totalJobsCount).toBe(0)
    expect(getStoredJobs()).toHaveLength(0)
  })
})
