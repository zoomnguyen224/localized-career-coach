/**
 * Extracts plain text from an uploaded file.
 * Supports PDF (via pdfjs-dist) and plain text files (.txt, .doc, .docx read as text).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist')
    // Use CDN worker to avoid Next.js bundling complexity
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

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
