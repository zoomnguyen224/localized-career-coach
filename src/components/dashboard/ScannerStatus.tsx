'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ScanState } from '@/types/jobs'

interface ScannerStatusProps {
  onScanComplete?: (newJobsCount: number, totalJobsCount: number) => void
}

function timeSinceScan(iso: string | null): string {
  if (!iso) return 'Never scanned'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
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
      // silently ignore — demo environment may not have network
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
      <span className="text-[10px] text-[#ABAFC2]">
        {state.isScanning ? 'Scanning now...' : `Scanned ${timeSinceScan(state.lastScanAt)}`}
      </span>
      <button
        onClick={handleScanNow}
        disabled={state.isScanning}
        className="flex items-center gap-2 bg-[#F2F3F6] px-3 py-1.5 rounded-full hover:bg-[#EAECF2] transition-colors disabled:opacity-60 cursor-pointer"
      >
        <div
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            state.isScanning ? 'bg-[#FAA82C]' : 'bg-[#03BA82]'
          }`}
        />
        <span className="text-[11px] text-[#727998] font-semibold">
          {state.isScanning ? 'Scanning...' : 'Agents active'}
        </span>
      </button>
    </div>
  )
}
