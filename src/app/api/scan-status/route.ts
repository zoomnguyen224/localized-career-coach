import { NextResponse } from 'next/server'
import { getScanState } from '@/lib/scan-store'

export async function GET() {
  return NextResponse.json(getScanState())
}
