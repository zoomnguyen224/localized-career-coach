import { NextResponse } from 'next/server'
import { scanAllMENAPortals } from '@/lib/agents/job-scanner'

export async function GET() {
  try {
    const jobs = await scanAllMENAPortals()
    return NextResponse.json({ jobs }, { status: 200 })
  } catch (error) {
    console.error('Job scan failed:', error)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
