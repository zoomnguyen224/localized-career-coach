// src/lib/generate-pdf.ts
import { chromium } from 'playwright'
import { join } from 'path'

/**
 * Converts HTML to an A4 PDF buffer using Playwright headless Chromium.
 *
 * Font handling: The cv-template.html references ./fonts/ with relative paths.
 * We rewrite those to absolute file:// URIs so Playwright can load them via setContent.
 *
 * @param html - Complete HTML string (typically from cv-generator's applyTemplatePlaceholders)
 * @returns Buffer containing the generated PDF
 * @throws Error if Playwright fails to render or generate PDF
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const fontsDir = join(process.cwd(), 'public', 'fonts')
  const htmlWithFonts = html.replace(/url\('\.\/fonts\//g, `url('file://${fontsDir}/`)

  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(htmlWithFonts, { waitUntil: 'networkidle' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
