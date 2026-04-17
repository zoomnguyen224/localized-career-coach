import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: Request) {
  let body: { company: string; role: string; questionType?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { company, role, questionType = 'behavioral' } = body
  if (!company || !role) {
    return Response.json({ error: 'company and role are required' }, { status: 400 })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Generate one ${questionType} interview question for a ${role} position at ${company} in the MENA region.

Return JSON only (no markdown, no code fence):
{
  "question": "the interview question text",
  "type": "${questionType}",
  "evaluationCriteria": ["criterion 1", "criterion 2", "criterion 3"],
  "source": "AI generated for ${company}"
}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    return Response.json(JSON.parse(text))
  } catch {
    return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
