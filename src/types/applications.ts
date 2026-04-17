// src/types/applications.ts

export type ApplicationStatus = 'evaluated' | 'applied' | 'interview' | 'offer' | 'rejected'
export type AlertType = 'follow-up' | 'interview' | 'deadline' | null

export interface Application {
  id: string
  company: string
  jobTitle: string
  matchScore: number        // 0–5.0
  status: ApplicationStatus
  appliedAt?: string        // ISO string
  lastActivity: string      // ISO string
  alertType: AlertType
  alertMessage?: string
  salaryOffer?: string      // e.g. "AED 45,000/mo"
  offerDeadline?: string    // ISO string
  notes?: string
}
