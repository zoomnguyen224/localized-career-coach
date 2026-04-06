import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { createGraph } from '@/lib/graph'
import type { SSEEvent } from '@/types'

const encoder = new TextEncoder()

function send(controller: ReadableStreamDefaultController, event: SSEEvent) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
}

export async function POST(req: Request) {
  let body: { messages?: Array<{ role: string; content: string }>; threadId?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { messages, threadId } = body
  if (!messages || !threadId) {
    return Response.json({ error: 'messages and threadId are required' }, { status: 400 })
  }

  const graph = createGraph(threadId)
  const lcMessages = messages.map(m =>
    m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
  )

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await graph.stream(
          { messages: lcMessages },
          { streamMode: 'messages' }
        )

        for await (const [chunk, _metadata] of stream) {
          const chunkType = chunk._getType?.()

          if (chunkType === 'ai') {
            // content can be a string or an array of content blocks
            if (typeof chunk.content === 'string' && chunk.content) {
              send(controller, { type: 'text', content: chunk.content })
            } else if (Array.isArray(chunk.content)) {
              for (const block of chunk.content) {
                if (block.type === 'text' && block.text) {
                  send(controller, { type: 'text', content: block.text })
                }
              }
            }
          }

          if (chunk.tool_call_chunks?.length) {
            for (const tc of chunk.tool_call_chunks) {
              if (tc.name) send(controller, { type: 'tool_call', name: tc.name, id: tc.id ?? '' })
            }
          }

          if (chunkType === 'tool') {
            try {
              send(controller, { type: 'tool_result', name: chunk.name, id: chunk.tool_call_id, result: JSON.parse(chunk.content) })
            } catch {
              send(controller, { type: 'tool_result', name: chunk.name, id: chunk.tool_call_id, result: chunk.content })
            }
          }
        }
      } catch (e) {
        console.error('[chat/route] stream error:', e)
        send(controller, { type: 'error', message: `Error: ${e instanceof Error ? e.message : String(e)}` })
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
