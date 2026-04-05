import { render, screen, fireEvent } from '@testing-library/react'
import Home from '@/app/page'

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>
}))

jest.mock('@/components/layout/Sidebar', () => ({
  __esModule: true,
  default: ({ profile }: { profile: unknown }) => (
    <div data-testid="sidebar" data-profile={JSON.stringify(profile)}>Sidebar</div>
  )
}))

jest.mock('@/components/chat/ChatInterface', () => ({
  ChatInterface: ({ threadId, onProfileUpdate }: { threadId: string; onProfileUpdate: (p: unknown) => void }) => (
    <div data-testid="chat-interface" data-thread-id={threadId}>
      <button onClick={() => onProfileUpdate({ name: 'Test User' })}>Update Profile</button>
    </div>
  )
}))

Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-thread-id' }
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

  it('passes a stable threadId to ChatInterface', () => {
    render(<Home />)
    const chatInterface = screen.getByTestId('chat-interface')
    expect(chatInterface).toHaveAttribute('data-thread-id', 'test-thread-id')
  })

  it('updates userProfile state when onProfileUpdate is called', () => {
    render(<Home />)
    const button = screen.getByRole('button', { name: 'Update Profile' })
    fireEvent.click(button)
    // Sidebar should now receive updated profile — verify it doesn't throw
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toBeInTheDocument()
    // Profile should contain the updated name
    const profile = JSON.parse(sidebar.getAttribute('data-profile') || '{}')
    expect(profile.name).toBe('Test User')
  })
})
