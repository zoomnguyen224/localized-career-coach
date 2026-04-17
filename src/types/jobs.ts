// src/types/jobs.ts

export type ATSSource = 'greenhouse' | 'lever' | 'ashby' | 'mock'
export type RemoteType = 'remote' | 'hybrid' | 'onsite'
export type RoleCategory = 'ai-ml' | 'product' | 'data' | 'engineering' | 'other'

export interface Job {
  id: string
  externalId: string
  atsSource: ATSSource
  company: string
  companySlug: string
  title: string
  location: string
  country: 'UAE' | 'KSA' | 'Qatar' | 'Kuwait' | 'Bahrain' | 'Oman' | 'Other'
  url: string
  description?: string
  salaryRange?: string
  remoteType: RemoteType
  roleCategory: RoleCategory
  postedAt?: string
  isVision2030?: boolean
  matchScore?: number
  scoreBreakdown?: ScoreBreakdown
  skillsMatch?: SkillMatch[]
  isNew?: boolean
}

export interface ScoreBreakdown {
  overall: number        // 1.0–5.0
  cvMatch: number        // 1.0–5.0
  roleAlignment: number  // 1.0–5.0
  compensation: number   // 1.0–5.0
  culturalSignals: number // 1.0–5.0
  redFlags: string | null
  recommendation: string
  archetype: string
}

export interface SkillMatch {
  skill: string
  status: 'strong' | 'partial' | 'gap'
  note: string
}

export interface FilterState {
  category: RoleCategory | 'all'
  minScore: number | null   // null = no filter, 4.0 = "strong match"
  remoteOnly: boolean
  countries: Array<'UAE' | 'KSA' | 'Qatar' | 'Kuwait' | 'Bahrain' | 'Oman'>
}

export interface ScanState {
  lastScanAt: string | null   // ISO string or null if never scanned
  newJobsCount: number         // jobs added since previous scan
  totalJobsCount: number       // total jobs in store
  isScanning: boolean
}
