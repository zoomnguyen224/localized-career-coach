import { NextRequest, NextResponse } from 'next/server'
import { appendApplication, isDuplicate } from '@/lib/applications'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { company, jobTitle, matchScore } = body

  if (!company || !jobTitle) {
    return NextResponse.json(
      { error: 'company and jobTitle are required' },
      { status: 400 }
    )
  }

  if (isDuplicate(company, jobTitle)) {
    return NextResponse.json({ error: 'Already tracked' }, { status: 409 })
  }

  const app = appendApplication({ company, jobTitle, matchScore: matchScore ?? 0 })
  return NextResponse.json({ ok: true, id: app.id })
}
