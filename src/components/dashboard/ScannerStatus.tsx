'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScanState } from '@/types/jobs'

interface ScannerStatusProps {
  onScanComplete?: (newJobsCount: number, totalJobsCount: number) => void
}

function timeSinceScan(iso: string | null): string {
  if (!iso) return 'Never scanned'
  const date = new Date(iso)
  if (isNaN(date.getTime())) return 'Never scanned'
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `Scanned ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Scanned ${hours}h ago`
  return `Scanned ${Math.floor(hours / 24)}d ago`
}

const INITIAL_STATE: ScanState = {
  lastScanAt: null,
  newJobsCount: 0,
  totalJobsCount: 0,
  isScanning: false,
}

export function ScannerStatus({ onScanComplete }: ScannerStatusProps) {
  const [state, setState] = useState<ScanState>(INITIAL_STATE)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scan-status')
      if (res.ok) setState(await res.json())
    } catch {
      setState(s => s.isScanning ? { ...s, isScanning: false } : s)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 30_000)
    return () => clearInterval(id)
  }, [fetchStatus])

  const handleScanNow = async () => {
    setState(s => ({ ...s, isScanning: true }))
    try {
      const res = await fetch('/api/cron/scan')
      if (res.ok) {
        const data: { newJobs: number; totalJobs: number } = await res.json()
        onScanComplete?.(data.newJobs, data.totalJobs)
      }
    } finally {
      await fetchStatus()
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[var(--brand-ink-3)]">
        {state.isScanning ? 'Scanning now...' : timeSinceScan(state.lastScanAt)}
      </span>
      <button
        onClick={handleScanNow}
        disabled={state.isScanning}
        aria-label="Scan for new jobs now"
        className="flex items-center gap-2 bg-[var(--brand-bg-2)] px-3 py-1.5 rounded-full hover:bg-[var(--brand-accent)] hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        <div
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            state.isScanning ? 'bg-[var(--brand-severity-med)]' : 'bg-[var(--brand-severity-ok)]'
          }`}
        />
        <span className="text-[11px] text-[var(--brand-ink-2)] font-semibold">
          {state.isScanning ? 'Scanning...' : 'Agents active'}
        </span>
      </button>
    </div>
  )
}
