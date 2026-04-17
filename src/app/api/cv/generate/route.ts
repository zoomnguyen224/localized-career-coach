// src/app/api/cv/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateTailoredCV } from '@/lib/agents/cv-generator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cvMarkdown, jobTitle, jobDescription, company } = body
    if (!cvMarkdown || !jobTitle || !jobDescription || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: cvMarkdown, jobTitle, jobDescription, company' },
        { status: 400 }
      )
    }
    const result = await generateTailoredCV({ cvMarkdown, jobTitle, jobDescription, company })
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('CV generation failed:', error)
    return NextResponse.json({ error: 'CV generation failed' }, { status: 500 })
  }
}
