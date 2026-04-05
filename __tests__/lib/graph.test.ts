/**
 * @jest-environment node
 */
import { createGraph } from '@/lib/graph'

describe('LangGraph createGraph', () => {
  it('compiles without throwing', () => {
    const graph = createGraph('test-thread')
    expect(graph).toBeDefined()
  })

  it('has stream and invoke methods', () => {
    const graph = createGraph('test-thread')
    expect(typeof graph.stream).toBe('function')
    expect(typeof graph.invoke).toBe('function')
  })

  it('creates isolated graphs per threadId', () => {
    const g1 = createGraph('thread-1')
    const g2 = createGraph('thread-2')
    expect(g1).not.toBe(g2)
  })
})
