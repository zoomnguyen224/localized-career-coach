/**
 * @jest-environment node
 */
import { setVectorStore, getVectorStore, clearVectorStore } from '@/lib/vector-store'

describe('vector-store', () => {
  afterEach(() => {
    clearVectorStore('thread-1')
    clearVectorStore('thread-2')
  })

  it('returns undefined for unknown threadId', () => {
    expect(getVectorStore('thread-1')).toBeUndefined()
  })

  it('stores and retrieves a value by threadId', () => {
    const fakeStore = { similaritySearch: jest.fn() } as any
    setVectorStore('thread-1', fakeStore)
    expect(getVectorStore('thread-1')).toBe(fakeStore)
  })

  it('isolates stores by threadId', () => {
    const store1 = { id: '1' } as any
    const store2 = { id: '2' } as any
    setVectorStore('thread-1', store1)
    setVectorStore('thread-2', store2)
    expect(getVectorStore('thread-1')).toBe(store1)
    expect(getVectorStore('thread-2')).toBe(store2)
  })

  it('clears a store', () => {
    const fakeStore = {} as any
    setVectorStore('thread-1', fakeStore)
    clearVectorStore('thread-1')
    expect(getVectorStore('thread-1')).toBeUndefined()
  })

  it('replaces an existing store on re-upload', () => {
    const old = { id: 'old' } as any
    const fresh = { id: 'fresh' } as any
    setVectorStore('thread-1', old)
    setVectorStore('thread-1', fresh)
    expect(getVectorStore('thread-1')).toBe(fresh)
  })
})
