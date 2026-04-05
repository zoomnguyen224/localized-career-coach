import type { MemoryVectorStore } from 'langchain/vectorstores/memory'

const stores = new Map<string, MemoryVectorStore>()

export function setVectorStore(threadId: string, store: MemoryVectorStore): void {
  stores.set(threadId, store)
}

export function getVectorStore(threadId: string): MemoryVectorStore | undefined {
  return stores.get(threadId)
}

export function clearVectorStore(threadId: string): void {
  stores.delete(threadId)
}
