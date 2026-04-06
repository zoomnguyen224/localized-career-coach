export interface ConversationMeta {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

const CONVERSATIONS_KEY = 'localized_conversations'
const ACTIVE_THREAD_KEY = 'localized_active_thread'

function generateId(): string {
  return crypto.randomUUID()
}

export function getConversations(): ConversationMeta[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as ConversationMeta[]).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function createConversation(): ConversationMeta {
  const now = Date.now()
  const conv: ConversationMeta = {
    id: generateId(),
    title: 'New Conversation',
    createdAt: now,
    updatedAt: now,
  }
  const existing = getConversations()
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify([...existing, conv]))
  } catch {}
  return conv
}

export function updateTitle(id: string, title: string): void {
  const conversations = getConversations()
  try {
    localStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(conversations.map(c => (c.id === id ? { ...c, title } : c)))
    )
  } catch {}
}

export function touchConversation(id: string): void {
  const conversations = getConversations()
  try {
    localStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(conversations.map(c => (c.id === id ? { ...c, updatedAt: Date.now() } : c)))
    )
  } catch {}
}

export function deleteConversation(id: string): void {
  const conversations = getConversations()
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations.filter(c => c.id !== id)))
    localStorage.removeItem(`localized_messages_${id}`)
    localStorage.removeItem(`localized_cv_markdown_${id}`)
  } catch {}
}

export function getActiveThreadId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_THREAD_KEY)
  } catch {
    return null
  }
}

export function setActiveThreadId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_THREAD_KEY, id)
  } catch {}
}
