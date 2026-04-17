// src/lib/followup.ts
import type { Application, FollowUpAction } from '@/types/applications'

const SORT_ORDER: Record<FollowUpAction['type'], number> = {
  offer: 0,
  interview: 1,
  'follow-up': 2,
  apply: 3,
}

export function computeFollowUps(applications: Application[]): FollowUpAction[] {
  const actions: FollowUpAction[] = []

  for (const app of applications) {
    if (!app.alertMessage) continue

    if (app.alertType === 'interview') {
      actions.push({
        label: `Prepare for ${app.company} interview`,
        description: app.alertMessage,
        type: 'interview',
      })
    } else if (app.alertType === 'deadline') {
      actions.push({
        label: `Review ${app.company} offer`,
        description: app.alertMessage,
        type: 'offer',
      })
    } else if (app.alertType === 'follow-up') {
      actions.push({
        label: `Follow up with ${app.company} — ${app.jobTitle}`,
        description: app.alertMessage,
        type: 'follow-up',
      })
    }
  }

  return actions
    .sort((a, b) => SORT_ORDER[a.type] - SORT_ORDER[b.type])
    .slice(0, 3)
}
