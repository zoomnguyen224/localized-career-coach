import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: Request) {
  let body: { company: string; role: string; question: string; answer: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { company, role, question, answer } = body
  if (!company || !role || !question || !answer) {
    return Response.json({ error: 'company, role, question, and answer are required' }, { status: 400 })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert interviewer evaluating a candidate for a ${role} position at ${company} in the MENA region.

Question asked: ${question}

Candidate's answer: ${answer}

Evaluate this answer honestly. Return JSON only (no markdown, no code fence):
{
  "score": <integer 0-10>,
  "verdict": "<one of: Excellent Answer | Strong Answer | Good Start | Needs Work>",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "modelAnswer": "A concise 2-3 sentence model answer showing what an ideal response looks like."
}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    const parsed = JSON.parse(text)
    parsed.score = Math.min(10, Math.max(0, Number(parsed.score) || 0))
    return Response.json(parsed)
  } catch {
    return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
