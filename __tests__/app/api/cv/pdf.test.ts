/**
 * @jest-environment node
 */
import { POST } from '@/app/api/cv/pdf/route'

jest.mock('@/lib/generate-pdf', () => ({
  htmlToPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-test')),
}))

describe('POST /api/cv/pdf', () => {
  it('returns 400 when html field is missing', async () => {
    const req = new Request('http://localhost/api/cv/pdf', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns PDF with content-type application/pdf', async () => {
    const req = new Request('http://localhost/api/cv/pdf', {
      method: 'POST',
      body: JSON.stringify({ html: '<html><body>CV</body></html>' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
  })
})
