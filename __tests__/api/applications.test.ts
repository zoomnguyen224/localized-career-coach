/**
 * @jest-environment node
 */
import { POST } from '@/app/api/applications/route'
import { NextRequest } from 'next/server'
import { resetApplicationsForTest } from '@/lib/applications'

beforeEach(() => resetApplicationsForTest())

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

it('returns 200 with id for a new application', async () => {
  const res = await POST(makeRequest({ company: 'Acme', jobTitle: 'CTO', matchScore: 4.2 }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(typeof body.id).toBe('string')
})

it('returns 409 when company+jobTitle already tracked', async () => {
  // NEOM + AI Platform Engineer is in DEMO_APPLICATIONS
  const res = await POST(makeRequest({ company: 'NEOM', jobTitle: 'AI Platform Engineer', matchScore: 4.7 }))
  expect(res.status).toBe(409)
})

it('returns 400 when company is missing', async () => {
  const res = await POST(makeRequest({ jobTitle: 'CTO' }))
  expect(res.status).toBe(400)
})
