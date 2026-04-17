import { MemoryVectorStore } from 'langchain/vectorstores/memory'

// In-process cache — fast path when the function is warm
const stores = new Map<string, MemoryVectorStore>()

export function getVectorStore(threadId: string): MemoryVectorStore | undefined {
  return stores.get(threadId)
}

export function setVectorStore(threadId: string, store: MemoryVectorStore): void {
  stores.set(threadId, store)
}

export function clearVectorStore(threadId: string): void {
  stores.delete(threadId)
}

// ---------------------------------------------------------------------------
// Redis persistence — survives cold starts
// ---------------------------------------------------------------------------

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  // Lazy import so the module loads fine when Redis is not configured
  const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis')
  return new Redis({ url, token })
}

const REDIS_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export async function saveMarkdownToRedis(threadId: string, markdown: string): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return
  try {
    await redis.set(`cv_markdown_${threadId}`, markdown, { ex: REDIS_TTL_SECONDS })
  } catch {
    // Non-fatal — in-memory store is still available for this warm instance
  }
}

export async function getMarkdownFromRedis(threadId: string): Promise<string | null> {
  const redis = getRedisClient()
  if (!redis) return null
  try {
    return await redis.get<string>(`cv_markdown_${threadId}`)
  } catch {
    return null
  }
}
