import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { setVectorStore } from '@/lib/vector-store'

// Vercel: allow up to 60s for embedding calls
export const maxDuration = 60

export async function POST(req: Request) {
  let body: { markdown?: string; threadId?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { markdown, threadId } = body
  if (!markdown || !threadId) {
    return Response.json({ error: 'markdown and threadId are required' }, { status: 400 })
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: 'Embedding not configured' }, { status: 503 })
  }

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
  const docs = await splitter.createDocuments([markdown])

  const embeddings = new OpenAIEmbeddings({
    modelName: process.env.OPENROUTER_EMBEDDING_MODEL ?? 'openai/text-embedding-3-small',
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://localized.world',
        'X-Title': 'Localized AI Career Coach',
      },
    },
  })

  const store = await MemoryVectorStore.fromDocuments(docs, embeddings)
  setVectorStore(threadId, store)

  return Response.json({ success: true, chunkCount: docs.length })
}
