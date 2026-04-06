import { StateGraph, MessagesAnnotation, Annotation } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { SystemMessage, AIMessage } from '@langchain/core/messages'
import { allTools, createSearchResumeTool } from './tools'
import { systemPrompt } from './system-prompt'

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
})

const model = new ChatOpenAI({
  modelName: process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-lite-001',
  openAIApiKey: process.env.OPENROUTER_API_KEY ?? 'placeholder-not-used-in-tests',
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://localized.world',
      'X-Title': 'Localized AI Career Coach',
    },
  },
  temperature: 0.7,
})

function shouldContinue(state: typeof StateAnnotation.State): 'tools' | '__end__' {
  const lastMessage = state.messages.at(-1) as AIMessage
  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) return 'tools'
  return '__end__'
}

export function createGraph(threadId: string) {
  const searchResumeTool = createSearchResumeTool(threadId)
  const tools = [...allTools, searchResumeTool]
  const modelWithTools = model.bindTools(tools)
  const toolNode = new ToolNode(tools)

  async function callAgent(state: typeof StateAnnotation.State) {
    const response = await modelWithTools.invoke([new SystemMessage(systemPrompt), ...state.messages])
    return { messages: [response] }
  }

  return new StateGraph(StateAnnotation)
    .addNode('agent', callAgent)
    .addNode('tools', toolNode)
    .addEdge('__start__', 'agent')
    .addConditionalEdges('agent', shouldContinue, { tools: 'tools', __end__: '__end__' })
    .addEdge('tools', 'agent')
    .compile()
}
