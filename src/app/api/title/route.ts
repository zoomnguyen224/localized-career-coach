export async function POST(req: Request) {
  let body: { firstUserMessage?: string; firstAssistantMessage?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { firstUserMessage, firstAssistantMessage } = body
  if (!firstUserMessage || !firstAssistantMessage) {
    return Response.json({ error: 'firstUserMessage and firstAssistantMessage are required' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return Response.json({ title: 'New Conversation' })
  }

  const model = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-lite-001'

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
            content: `Summarize this career coaching conversation in 4-6 words. Reply with the title only, no punctuation, no quotes.\n\nUser: ${firstUserMessage.slice(0, 200)}\n\nAssistant: ${firstAssistantMessage.slice(0, 200)}`,
          },
        ],
        max_tokens: 20,
      }),
    })
    const data = await res.json()
    const title = (data.choices?.[0]?.message?.content as string | undefined)?.trim() ?? 'New Conversation'
    return Response.json({ title })
  } catch {
    return Response.json({ title: 'New Conversation' })
  }
}
