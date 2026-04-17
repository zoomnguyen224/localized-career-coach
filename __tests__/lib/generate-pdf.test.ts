// __tests__/lib/generate-pdf.test.ts
/** @jest-environment node */
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}))

import { htmlToPdf } from '@/lib/generate-pdf'
import { chromium } from 'playwright'

describe('htmlToPdf', () => {
  const mockClose = jest.fn().mockResolvedValue(undefined)
  const mockPdf = jest.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])) // %PDF
  const mockSetContent = jest.fn().mockResolvedValue(undefined)
  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue({ setContent: mockSetContent, pdf: mockPdf }),
    close: mockClose,
  }

  beforeEach(() => {
    ;(chromium.launch as jest.Mock).mockResolvedValue(mockBrowser)
    mockClose.mockClear()
    mockSetContent.mockClear()
    mockPdf.mockClear()
  })

  it('returns a Buffer', async () => {
    const result = await htmlToPdf('<html><body>Test</body></html>')
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it('closes browser even when setContent throws', async () => {
    mockSetContent.mockRejectedValueOnce(new Error('render error'))
    await expect(htmlToPdf('<html/>')).rejects.toThrow('render error')
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('rewrites relative ./fonts/ paths to absolute file:// URIs', async () => {
    let capturedHtml = ''
    mockSetContent.mockImplementationOnce(async (html: string) => {
      capturedHtml = html
    })
    await htmlToPdf("<style>src: url('./fonts/space-grotesk.woff2')</style>")
    expect(capturedHtml).not.toContain("url('./fonts/")
    expect(capturedHtml).toContain('url(\'file://')
    expect(capturedHtml).toContain('space-grotesk.woff2')
  })
})
