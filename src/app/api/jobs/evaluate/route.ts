import { NextRequest, NextResponse } from 'next/server'
import { evaluateJob } from '@/lib/agents/job-evaluator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobTitle, jobDescription, company, cvMarkdown } = body

    if (!jobTitle || !jobDescription || !company || !cvMarkdown) {
      return NextResponse.json(
        { error: 'Missing required fields: jobTitle, jobDescription, company, cvMarkdown' },
        { status: 400 }
      )
    }

    const result = await evaluateJob({ jobTitle, jobDescription, company, cvMarkdown })
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Job evaluation failed:', error)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 })
  }
}
