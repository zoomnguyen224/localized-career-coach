import { StateGraph, MessagesAnnotation, Annotation } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph'
import { ChatAnthropic } from '@langchain/anthropic'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { SystemMessage, AIMessage } from '@langchain/core/messages'
import { allTools } from './tools'
import { systemPrompt } from './system-prompt'

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
})

const model = new ChatAnthropic({
  model: 'claude-sonnet-4-6',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invocationKwargs: { top_p: undefined } as any,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-not-used-in-tests',
})
const modelWithTools = model.bindTools(allTools)
const toolNode = new ToolNode(allTools)
const checkpointer = new MemorySaver()

function shouldContinue(state: typeof StateAnnotation.State): 'tools' | '__end__' {
  const lastMessage = state.messages.at(-1) as AIMessage
  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) return 'tools'
  return '__end__'
}

async function callAgent(state: typeof StateAnnotation.State) {
  const response = await modelWithTools.invoke([new SystemMessage(systemPrompt), ...state.messages])
  return { messages: [response] }
}

export const graph = new StateGraph(StateAnnotation)
  .addNode('agent', callAgent)
  .addNode('tools', toolNode)
  .addEdge('__start__', 'agent')
  .addConditionalEdges('agent', shouldContinue, { tools: 'tools', __end__: '__end__' })
  .addEdge('tools', 'agent')
  .compile({ checkpointer })
