/**
 * @jest-environment node
 */
import { graph } from '@/lib/graph'

describe('LangGraph graph', () => {
  it('compiles without throwing', () => {
    expect(graph).toBeDefined()
  })

  it('has stream and invoke methods', () => {
    expect(typeof graph.stream).toBe('function')
    expect(typeof graph.invoke).toBe('function')
  })
})
