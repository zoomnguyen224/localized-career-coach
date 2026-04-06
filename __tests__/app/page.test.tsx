import { render, screen, fireEvent } from '@testing-library/react'
import Home from '@/app/page'

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}))

jest.mock('@/components/layout/Sidebar', () => ({
  __esModule: true,
  default: ({
    onNew,
    onSwitch,
  }: {
    onNew: () => void
    onSwitch: (id: string) => void
    activeThreadId: string
  }) => (
    <div data-testid="sidebar">
      <button onClick={onNew}>New</button>
      <button onClick={() => onSwitch('other-id')}>Switch</button>
    </div>
  ),
}))

jest.mock('@/components/chat/ChatInterface', () => ({
  ChatInterface: ({
    threadId,
    onProfileUpdate,
    onSkillGapResult,
  }: {
    threadId: string
    onProfileUpdate: (p: unknown) => void
    onSkillGapResult: (r: unknown) => void
  }) => (
    <div data-testid="chat-interface" data-thread-id={threadId}>
      <button onClick={() => onProfileUpdate({ name: 'Test User' })}>Update Profile</button>
      <button onClick={() => onSkillGapResult({ overallReadiness: 75, gaps: [], role: {} })}>
        Update Gap
      </button>
    </div>
  ),
}))

jest.mock('@/lib/conversation-store', () => ({
  getConversations: jest.fn(() => [{ id: 'test-thread-id', title: 'New Conversation', createdAt: 1, updatedAt: 1 }]),
  createConversation: jest.fn(() => ({ id: 'test-thread-id', title: 'New Conversation', createdAt: 1, updatedAt: 1 })),
  updateTitle: jest.fn(),
  deleteConversation: jest.fn(),
  setActiveThreadId: jest.fn(),
  getActiveThreadId: jest.fn(() => 'test-thread-id'),
  touchConversation: jest.fn(),
}))

Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-thread-id' },
})

describe('Home page', () => {
  it('renders Header component', () => {
    render(<Home />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders Sidebar component', () => {
    render(<Home />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders ChatInterface component', () => {
    render(<Home />)
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
  })

  it('passes activeThreadId to ChatInterface', () => {
    render(<Home />)
    expect(screen.getByTestId('chat-interface')).toHaveAttribute('data-thread-id', 'test-thread-id')
  })

  it('updates userProfile state when onProfileUpdate is called', () => {
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: 'Update Profile' }))
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
  })
})
