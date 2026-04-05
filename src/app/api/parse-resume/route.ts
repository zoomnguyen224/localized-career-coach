export async function POST(req: Request) {
  let body: { cvText?: string; fileName?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { cvText, fileName } = body
  if (!cvText || cvText.trim().length < 50) {
    return Response.json({ error: 'CV text is too short or empty' }, { status: 400 })
  }

  // Truncate to 4000 chars for demo (enough for agent context)
  const truncated = cvText.slice(0, 4000)

  return Response.json({
    success: true,
    cvText: truncated,
    fileName: fileName ?? 'resume.txt',
    charCount: truncated.length,
  })
}
