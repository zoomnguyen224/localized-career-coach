// src/components/career-map/TargetRolePicker.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MENA_ROLES } from '@/lib/mock-data'
import { seedFromProfile, saveGraph } from '@/lib/career-map'
import type { CurrentSkill, UserProfile } from '@/types'

interface TargetRolePickerProps {
  learnerId: string
  profile: UserProfile
  currentSkills: CurrentSkill[]
  /** Optional label for the trigger of the picker, shown before a role is chosen. */
  headline?: string
  /** Optional callback fired with the saved graph's learnerId after confirm. */
  onSeeded?: (learnerId: string, targetRoleId: string) => void
}

/**
 * Post-parse role picker: shows a dropdown sourced from MENA_ROLES, and on
 * confirm seeds + persists a CareerGraph keyed to the learner. Renders a
 * success banner with a link to /home once seeded.
 */
export function TargetRolePicker({
  learnerId,
  profile,
  currentSkills,
  headline = 'One step left — pick the role you are aiming for.',
  onSeeded,
}: TargetRolePickerProps) {
  const [selectedId, setSelectedId] = useState<string>(MENA_ROLES[0]?.id ?? '')
  const [seeded, setSeeded] = useState<{ roleId: string; matchScore: number } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  function handleConfirm() {
    if (!selectedId) return
    const graph = seedFromProfile(profile, currentSkills, selectedId, learnerId)
    saveGraph(graph)
    setSeeded({ roleId: selectedId, matchScore: graph.matchScore })
    onSeeded?.(learnerId, selectedId)
  }

  if (dismissed) return null

  if (seeded) {
    const role = MENA_ROLES.find(r => r.id === seeded.roleId)
    return (
      <section
        aria-label="Career map seeded"
        data-testid="career-map-seeded"
        className="mb-5 rounded-[12px] border border-[var(--brand-line)] bg-[var(--brand-emerald-soft)] px-5 py-4 flex items-center justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-emerald)] mb-1">
            Career map ready
          </div>
          <div className="text-[14px] font-semibold text-[var(--brand-ink-0)]">
            Seeded for {role?.title}
            {role ? <> · {role.company}</> : null}
            <span className="ml-2 text-[var(--brand-ink-2)] font-normal">
              initial match{' '}
              <b className="text-[var(--brand-emerald)]">{seeded.matchScore}%</b>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="inline-flex h-10 items-center px-4 rounded-[10px] bg-[var(--brand-navy)] text-white text-[13px] font-semibold"
          >
            See your Career Map →
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink-2)] font-semibold"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Pick target role"
      data-testid="career-map-picker"
      className="mb-5 rounded-[12px] border border-[var(--brand-line)] bg-white px-5 py-4 flex items-center justify-between gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-accent)] mb-1">
          CV parsed · choose target
        </div>
        <div className="text-[14px] font-semibold text-[var(--brand-ink-0)]">{headline}</div>
      </div>
      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor="career-map-role-select">
          Target role
        </label>
        <select
          id="career-map-role-select"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="h-10 rounded-[10px] border border-[var(--brand-line)] bg-white px-3 text-[13px] font-semibold text-[var(--brand-ink-0)] min-w-[280px]"
        >
          {MENA_ROLES.map(role => (
            <option key={role.id} value={role.id}>
              {role.title} · {role.company}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleConfirm}
          className="inline-flex h-10 items-center px-4 rounded-[10px] bg-[var(--brand-navy)] text-white text-[13px] font-semibold"
        >
          Seed map
        </button>
      </div>
    </section>
  )
}
