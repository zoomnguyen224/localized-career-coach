// src/components/applications/AddApplicationModal.tsx
'use client'

import { useState } from 'react'
import type { Application, ApplicationStatus } from '@/types/applications'

interface AddApplicationModalProps {
  onAdd: (app: Omit<Application, 'id' | 'lastActivity'>) => void
  onClose: () => void
}

export function AddApplicationModal({ onAdd, onClose }: AddApplicationModalProps) {
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [matchScore, setMatchScore] = useState('4.0')
  const [status, setStatus] = useState<ApplicationStatus>('evaluated')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !jobTitle.trim()) return
    onAdd({
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      matchScore: Math.min(5, Math.max(0, parseFloat(matchScore) || 0)),
      status,
      alertType: null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-[10px] p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="text-[14px] font-extrabold text-[var(--brand-ink-0)] mb-4">Add Application</div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="border border-[var(--brand-line)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--brand-ink-0)] placeholder:text-[var(--brand-ink-3)] outline-none focus:border-[var(--brand-accent)]"
            required
            autoFocus
          />
          <input
            type="text"
            placeholder="Job title"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            className="border border-[var(--brand-line)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--brand-ink-0)] placeholder:text-[var(--brand-ink-3)] outline-none focus:border-[var(--brand-accent)]"
            required
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-[var(--brand-ink-2)] mb-1 block">Match Score (0–5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={matchScore}
                onChange={e => setMatchScore(e.target.value)}
                className="w-full border border-[var(--brand-line)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--brand-ink-0)] outline-none focus:border-[var(--brand-accent)]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-[var(--brand-ink-2)] mb-1 block">Stage</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ApplicationStatus)}
                className="w-full border border-[var(--brand-line)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--brand-ink-0)] outline-none focus:border-[var(--brand-accent)] bg-white"
              >
                <option value="evaluated">Evaluated</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-[12px] text-[var(--brand-ink-2)] font-semibold px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[var(--brand-accent)] text-white text-[12px] font-bold px-5 py-2 rounded-[14px]"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
