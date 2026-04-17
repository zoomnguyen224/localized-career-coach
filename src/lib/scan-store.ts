// src/lib/scan-store.ts
import type { Job, ScanState } from '@/types/jobs'

interface InternalState extends ScanState {
  jobs: Job[]
}

const store: InternalState = {
  lastScanAt: null,
  newJobsCount: 0,
  totalJobsCount: 0,
  isScanning: false,
  jobs: [],
}

export function getScanState(): ScanState {
  return {
    lastScanAt: store.lastScanAt,
    newJobsCount: store.newJobsCount,
    totalJobsCount: store.totalJobsCount,
    isScanning: store.isScanning,
  }
}

export function getStoredJobs(): Job[] {
  return store.jobs
}

export function startScan(): void {
  store.isScanning = true
}

export function completeScan(jobs: Job[]): void {
  const prevIds = new Set(store.jobs.map(j => j.id))
  store.newJobsCount = jobs.filter(j => !prevIds.has(j.id)).length
  store.jobs = jobs
  store.totalJobsCount = jobs.length
  store.lastScanAt = new Date().toISOString()
  store.isScanning = false
}

/** Reset to pristine state — only use in tests. */
export function resetForTest(): void {
  store.lastScanAt = null
  store.newJobsCount = 0
  store.totalJobsCount = 0
  store.isScanning = false
  store.jobs = []
}
