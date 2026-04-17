import { NextRequest, NextResponse } from 'next/server'
import { scanAllMENAPortals } from '@/lib/agents/job-scanner'
import { startScan, completeScan, getScanState } from '@/lib/scan-store'

export async function GET(request: NextRequest) {
  // Demo-friendly: open when CRON_SECRET is unset (local dev). Set CRON_SECRET in production.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    startScan()
    const jobs = await scanAllMENAPortals()
    completeScan(jobs)
    const { newJobsCount, totalJobsCount } = getScanState()
    return NextResponse.json({ ok: true, newJobs: newJobsCount, totalJobs: totalJobsCount })
  } catch {
    completeScan([])
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
