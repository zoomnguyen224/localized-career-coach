/**
 * @jest-environment jsdom
 */

import {
  getConversations,
  createConversation,
  updateTitle,
  touchConversation,
  deleteConversation,
  getActiveThreadId,
  setActiveThreadId,
} from '@/lib/conversation-store'

beforeEach(() => {
  localStorage.clear()
})

describe('getConversations', () => {
  it('returns empty array when nothing stored', () => {
    expect(getConversations()).toEqual([])
  })

  it('returns conversations sorted by updatedAt descending', () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000)
    const a = createConversation()
    const b = createConversation()
    jest.restoreAllMocks()
    const result = getConversations()
    expect(result[0].id).toBe(b.id)
    // a was created with updatedAt=1000, b with updatedAt=2000, b should be first
    void a
  })
})

describe('createConversation', () => {
  it('returns a ConversationMeta with id, title, createdAt, updatedAt', () => {
    const conv = createConversation()
    expect(conv.id).toBeTruthy()
    expect(conv.title).toBe('New Conversation')
    expect(typeof conv.createdAt).toBe('number')
    expect(typeof conv.updatedAt).toBe('number')
  })

  it('persists to getConversations', () => {
    createConversation()
    expect(getConversations()).toHaveLength(1)
  })
})

describe('updateTitle', () => {
  it('changes the title of the matching conversation', () => {
    const conv = createConversation()
    updateTitle(conv.id, 'Product Manager in UAE')
    const updated = getConversations().find(c => c.id === conv.id)
    expect(updated?.title).toBe('Product Manager in UAE')
  })
})

describe('touchConversation', () => {
  it('bumps updatedAt without changing title', () => {
    const conv = createConversation()
    const before = conv.updatedAt
    jest.spyOn(Date, 'now').mockReturnValue(before + 1000)
    touchConversation(conv.id)
    jest.restoreAllMocks()
    const updated = getConversations().find(c => c.id === conv.id)
    expect(updated?.updatedAt).toBeGreaterThan(before)
    expect(updated?.title).toBe('New Conversation')
  })
})

describe('deleteConversation', () => {
  it('removes the conversation from the index', () => {
    const conv = createConversation()
    deleteConversation(conv.id)
    expect(getConversations()).toHaveLength(0)
  })

  it('clears messages and CV markdown keys for that id', () => {
    const conv = createConversation()
    localStorage.setItem(`localized_messages_${conv.id}`, '[]')
    localStorage.setItem(`localized_cv_markdown_${conv.id}`, 'some markdown')
    deleteConversation(conv.id)
    expect(localStorage.getItem(`localized_messages_${conv.id}`)).toBeNull()
    expect(localStorage.getItem(`localized_cv_markdown_${conv.id}`)).toBeNull()
  })

  it('does not delete other conversations', () => {
    const a = createConversation()
    const b = createConversation()
    deleteConversation(a.id)
    expect(getConversations().find(c => c.id === b.id)).toBeTruthy()
  })
})

describe('getActiveThreadId / setActiveThreadId', () => {
  it('returns null when nothing stored', () => {
    expect(getActiveThreadId()).toBeNull()
  })

  it('returns the id that was set', () => {
    setActiveThreadId('abc-123')
    expect(getActiveThreadId()).toBe('abc-123')
  })
})
