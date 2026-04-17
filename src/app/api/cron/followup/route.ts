import { NextRequest, NextResponse } from 'next/server'
import { computeFollowUps } from '@/lib/followup'
import { DEMO_APPLICATIONS } from '@/lib/applications'

export async function GET(request: NextRequest) {
  // Demo-friendly: open when CRON_SECRET is unset (local dev). Set CRON_SECRET in production.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const actions = computeFollowUps(DEMO_APPLICATIONS)
  return NextResponse.json({ ok: true, actions })
}
