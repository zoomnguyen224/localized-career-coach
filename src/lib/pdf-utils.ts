/**
 * Renders PDF pages to base64 JPEG images using canvas.
 * Returns up to maxPages images for vision model consumption.
 */
export async function pdfToImages(
  file: File,
  maxPages = 3
): Promise<{ images: string[]; pageCount: number }> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  const pageCount = pdf.numPages
  const images: string[] = []

  for (let pageNum = 1; pageNum <= Math.min(pageCount, maxPages); pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvas, viewport }).promise
    images.push(canvas.toDataURL('image/jpeg', 0.82))
  }

  return { images, pageCount }
}

/**
 * Extracts plain text from an uploaded file.
 * Supports PDF (via pdfjs-dist) and plain text files (.txt, .doc, .docx read as text).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist')
    // Use CDN worker to avoid Next.js bundling complexity
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => ('str' in item ? (item as { str: string }).str : ''))
        .join(' ')
      pages.push(pageText)
    }

    return pages.join('\n').trim()
  }

  // For .txt, .doc, .docx — read as plain text
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve((e.target?.result as string) ?? '')
    reader.onerror = reject
    reader.readAsText(file)
  })
}
