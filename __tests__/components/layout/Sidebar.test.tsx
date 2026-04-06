import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from '@/components/layout/Sidebar'
import { UserProfile } from '@/types'
import { ConversationMeta } from '@/lib/conversation-store'

// QRCodeSVG uses canvas — mock it
jest.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr-code" />,
}))

const baseConversations: ConversationMeta[] = [
  { id: 'conv-1', title: 'Product Manager UAE', createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 'conv-2', title: 'Software Engineer', createdAt: 1699000000000, updatedAt: 1699000000000 },
]

const baseProps = {
  profile: {} as UserProfile,
  conversations: baseConversations,
  activeThreadId: 'conv-1',
  skillGapResult: null,
  cvAttachment: null,
  onNew: jest.fn(),
  onSwitch: jest.fn(),
  onDelete: jest.fn(),
  onRename: jest.fn(),
}

describe('Sidebar', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows em dash for empty profile fields', () => {
    render(<Sidebar {...baseProps} />)
    const emDashes = screen.getAllByText('—')
    expect(emDashes.length).toBeGreaterThanOrEqual(5)
  })

  it('shows profile data when populated', () => {
    const profile: UserProfile = {
      name: 'Sara Al-Rashidi',
      location: 'Dubai, UAE',
      background: 'Software Engineering',
      targetRole: 'Product Manager',
      currentLevel: 'mid',
    }
    render(<Sidebar {...baseProps} profile={profile} />)
    expect(screen.getByText('Sara Al-Rashidi')).toBeInTheDocument()
    expect(screen.getByText('Dubai, UAE')).toBeInTheDocument()
  })

  it('shows prototype disclaimer instead of session memory notice', () => {
    render(<Sidebar {...baseProps} />)
    expect(screen.getByText(/Prototype demo/i)).toBeInTheDocument()
    expect(screen.queryByText(/Session memory active/i)).not.toBeInTheDocument()
  })

  it('renders conversation list', () => {
    render(<Sidebar {...baseProps} />)
    expect(screen.getByText('Product Manager UAE')).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
  })

  it('calls onNew when + New Conversation is clicked', () => {
    const onNew = jest.fn()
    render(<Sidebar {...baseProps} onNew={onNew} />)
    fireEvent.click(screen.getByRole('button', { name: /new conversation/i }))
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('calls onSwitch when a non-active conversation is clicked', () => {
    const onSwitch = jest.fn()
    render(<Sidebar {...baseProps} onSwitch={onSwitch} />)
    fireEvent.click(screen.getByText('Software Engineer'))
    expect(onSwitch).toHaveBeenCalledWith('conv-2')
  })

  it('does not render radar chart when skillGapResult is null', () => {
    render(<Sidebar {...baseProps} skillGapResult={null} />)
    expect(screen.queryByText(/readiness/i)).not.toBeInTheDocument()
  })

  it('does not render CV card when cvAttachment is null', () => {
    render(<Sidebar {...baseProps} cvAttachment={null} />)
    expect(screen.queryByText(/\.pdf/i)).not.toBeInTheDocument()
  })

  it('renders CV filename when cvAttachment is provided', () => {
    const cvAttachment = {
      fileName: 'Zoom_Nguyen.pdf',
      pageCount: 2,
      pageImages: [],
    }
    render(<Sidebar {...baseProps} cvAttachment={cvAttachment} />)
    expect(screen.getByText('Zoom_Nguyen.pdf')).toBeInTheDocument()
  })

  it('enters rename mode on double-click and commits on Enter', () => {
    const onRename = jest.fn()
    render(<Sidebar {...baseProps} onRename={onRename} />)
    fireEvent.doubleClick(screen.getByText('Product Manager UAE'))
    const input = screen.getByDisplayValue('Product Manager UAE')
    fireEvent.change(input, { target: { value: 'New Title' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('conv-1', 'New Title')
  })

  it('cancels rename on Escape without calling onRename', () => {
    const onRename = jest.fn()
    render(<Sidebar {...baseProps} onRename={onRename} />)
    fireEvent.doubleClick(screen.getByText('Product Manager UAE'))
    fireEvent.keyDown(screen.getByDisplayValue('Product Manager UAE'), { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('Product Manager UAE')).toBeInTheDocument()
  })

  it('does not call onSwitch when clicking the active conversation', () => {
    const onSwitch = jest.fn()
    render(<Sidebar {...baseProps} onSwitch={onSwitch} />)
    fireEvent.click(screen.getByText('Product Manager UAE'))
    expect(onSwitch).not.toHaveBeenCalled()
  })
})
