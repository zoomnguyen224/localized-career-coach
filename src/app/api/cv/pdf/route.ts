// src/app/api/cv/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { htmlToPdf } from '@/lib/generate-pdf'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { html } = body
    if (!html) {
      return NextResponse.json({ error: 'Missing html field' }, { status: 400 })
    }
    const pdfBuffer = await htmlToPdf(html)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="cv-tailored.pdf"',
      },
    })
  } catch (error) {
    console.error('PDF generation failed:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
