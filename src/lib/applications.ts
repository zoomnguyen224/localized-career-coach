// src/lib/applications.ts
import type { Application, ApplicationStatus, AlertType } from '@/types/applications'

// ─── Pure helpers ───────────────────────────────────────────────

export function moveApplication(
  apps: Application[],
  id: string,
  newStatus: ApplicationStatus
): Application[] {
  return apps.map(app =>
    app.id === id
      ? { ...app, status: newStatus, lastActivity: new Date().toISOString() }
      : app
  )
}

export function computeStats(applications: Application[]): {
  sent: number
  avgScore: number
  pipelineCounts: Record<ApplicationStatus, number>
} {
  const SENT_STATUSES: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected']
  const sent = applications.filter(a => SENT_STATUSES.includes(a.status)).length
  const avgScore =
    applications.length === 0
      ? 0
      : Math.round((applications.reduce((s, a) => s + a.matchScore, 0) / applications.length) * 10) / 10
  const pipelineCounts: Record<ApplicationStatus, number> = {
    evaluated: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  }
  for (const app of applications) {
    pipelineCounts[app.status]++
  }
  return { sent, avgScore, pipelineCounts }
}

export function scoreColorClass(score: number): string {
  if (score >= 4.0) return 'text-[#03BA82] bg-[#E6FAF4]'
  if (score >= 3.5) return 'text-[#FAA82C] bg-[#FFF8EC]'
  return 'text-[#F84E4E] bg-[#FFF0F0]'
}

export function cardLeftBorderClass(alertType: AlertType, status: ApplicationStatus): string {
  if (alertType === 'interview') return 'border-l-[#0052ff]'
  if (alertType === 'follow-up' || alertType === 'deadline') return 'border-l-[#FAA82C]'
  if (status === 'offer') return 'border-l-[#03BA82]'
  return 'border-l-transparent'
}

export function timeSince(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

// ─── Column config ───────────────────────────────────────────────

export const COLUMNS: Array<{
  status: ApplicationStatus
  label: string
  color: string
  headerBg: string
}> = [
  { status: 'evaluated', label: 'Evaluated', color: '#727998', headerBg: '#eef0f3' },
  { status: 'applied',   label: 'Applied',   color: '#0052ff', headerBg: '#e8f0fe' },
  { status: 'interview', label: 'Interview', color: '#FAA82C', headerBg: '#FFF8EC' },
  { status: 'offer',     label: 'Offer',     color: '#03BA82', headerBg: '#E6FAF4' },
  { status: 'rejected',  label: 'Rejected',  color: '#F84E4E', headerBg: '#FFF0F0' },
]

// ─── Demo data ───────────────────────────────────────────────────

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString()
const ahead = (days: number) => new Date(Date.now() + days * 86400000).toISOString()

export const DEMO_APPLICATIONS: Application[] = [
  {
    id: '1', company: 'NEOM', jobTitle: 'AI Platform Engineer',
    matchScore: 4.7, status: 'evaluated', lastActivity: d(1), alertType: null,
  },
  {
    id: '2', company: 'Geidea', jobTitle: 'ML Engineer',
    matchScore: 3.8, status: 'evaluated', lastActivity: d(2), alertType: null,
  },
  {
    id: '3', company: 'STC', jobTitle: 'LLM Engineer',
    matchScore: 4.5, status: 'applied', appliedAt: d(8),
    lastActivity: d(8), alertType: 'follow-up',
    alertMessage: 'No response in 8 days — follow up today',
  },
  {
    id: '4', company: 'Careem', jobTitle: 'AI Infrastructure Lead',
    matchScore: 4.2, status: 'applied', appliedAt: d(5),
    lastActivity: d(5), alertType: null,
  },
  {
    id: '5', company: 'Talabat', jobTitle: 'Senior ML Engineer',
    matchScore: 3.9, status: 'applied', appliedAt: d(2),
    lastActivity: d(2), alertType: null,
  },
  {
    id: '6', company: 'Emirates NBD', jobTitle: 'Head of AI',
    matchScore: 4.8, status: 'interview', appliedAt: d(10),
    lastActivity: d(1), alertType: 'interview',
    alertMessage: 'Technical interview tomorrow at 2pm',
  },
  {
    id: '7', company: 'Anghami', jobTitle: 'AI Product Lead',
    matchScore: 4.1, status: 'interview', appliedAt: d(8),
    lastActivity: d(3), alertType: null,
  },
  {
    id: '8', company: 'NEOM Tech', jobTitle: 'Principal AI Engineer',
    matchScore: 4.9, status: 'offer', appliedAt: d(20),
    lastActivity: d(1), alertType: 'deadline',
    alertMessage: 'Decision deadline in 2 days',
    salaryOffer: 'AED 45,000/mo', offerDeadline: ahead(2),
  },
  {
    id: '9', company: 'Amazon MENA', jobTitle: 'Applied Scientist',
    matchScore: 3.5, status: 'rejected', appliedAt: d(15),
    lastActivity: d(7), alertType: null,
  },
  {
    id: '10', company: 'Noon', jobTitle: 'ML Platform Engineer',
    matchScore: 3.2, status: 'rejected', appliedAt: d(12),
    lastActivity: d(5), alertType: null,
  },
]

// ─── Live store (mutable, demo-only, not persisted) ───────────────

let liveApplications: Application[] = [...DEMO_APPLICATIONS]

export function getAllApplications(): Application[] {
  return liveApplications
}

export function isDuplicate(company: string, jobTitle: string): boolean {
  return liveApplications.some(
    a =>
      a.company.toLowerCase() === company.toLowerCase() &&
      a.jobTitle.toLowerCase() === jobTitle.toLowerCase()
  )
}

export function appendApplication(
  data: Pick<Application, 'company' | 'jobTitle' | 'matchScore'>
): Application {
  const app: Application = {
    id: crypto.randomUUID(),
    company: data.company,
    jobTitle: data.jobTitle,
    matchScore: data.matchScore,
    status: 'applied',
    appliedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    alertType: null,
  }
  liveApplications = [...liveApplications, app]
  return app
}

export function resetApplicationsForTest(): void {
  liveApplications = [...DEMO_APPLICATIONS]
}
