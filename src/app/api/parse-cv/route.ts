/**
 * POST /api/parse-cv
 * Sends PDF page images to a vision model and returns structured CV data.
 * Uses OpenRouter vision-capable model (defaults to gemini-2.0-flash-001).
 */

// Vercel: allow up to 60s for vision model calls (default is 10s on Hobby)
export const maxDuration = 60

const EXTRACTION_PROMPT = `You are analyzing a CV/resume. Extract all information and return ONLY valid JSON — no markdown, no explanation:
{
  "profile": {
    "name": "candidate's full name or null",
    "location": "city, country or null",
    "background": "1-sentence summary of their current role or studies",
    "targetRole": "desired job title if mentioned, otherwise infer from their strongest background",
    "currentLevel": "student|junior|mid|senior"
  },
  "currentSkills": [
    { "name": "skill name", "currentLevel": 5 }
  ],
  "rawSummary": "2-3 sentences describing this candidate's profile, experience depth, and key strengths"
}

Read the entire CV carefully: education, work history, skills sections, certifications, projects, and achievements. Estimate skill levels 1-10 based on experience depth and recency. List all technical, business, and soft skills visible.`

export async function POST(req: Request) {
  const { imageDataUrls, fileName } = await req.json() as {
    imageDataUrls: string[]
    fileName: string
  }

  if (!Array.isArray(imageDataUrls) || imageDataUrls.length === 0) {
    return Response.json({ error: 'No images provided' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return Response.json({ error: 'OpenRouter API key not configured' }, { status: 503 })
  }

  // Use a vision-capable model — flash-001 has better vision than lite
  const model =
    process.env.OPENROUTER_VISION_MODEL ??
    (process.env.OPENROUTER_MODEL?.includes('lite')
      ? 'google/gemini-2.0-flash-001'
      : process.env.OPENROUTER_MODEL) ??
    'google/gemini-2.0-flash-001'

  const imageMessages = imageDataUrls.slice(0, 3).map((url: string) => ({
    type: 'image_url' as const,
    image_url: { url },
  }))

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://localized.world',
      'X-Title': 'Localized AI Career Coach',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: EXTRACTION_PROMPT }, ...imageMessages],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Vision model error:', err)
    return Response.json({ error: 'Vision model error' }, { status: 502 })
  }

  const data = await response.json()
  // Save raw content before JSON extraction — used as markdownContent for embedding
  const content: string = data.choices?.[0]?.message?.content ?? ''

  // Extract JSON — model may wrap in ```json fences
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('No JSON in vision response:', content)
    return Response.json({ error: 'Could not parse model response' }, { status: 502 })
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    // Return markdownContent as the raw vision output for downstream embedding
    return Response.json({ ...parsed, markdownContent: content })
  } catch {
    return Response.json({ error: 'Invalid JSON from model' }, { status: 502 })
  }
}
