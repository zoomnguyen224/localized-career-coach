import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInput } from '@/components/chat/ChatInput'

describe('ChatInput', () => {
  const mockOnSend = jest.fn()

  beforeEach(() => {
    mockOnSend.mockClear()
  })

  it('renders textarea with correct placeholder', () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />)
    expect(
      screen.getByPlaceholderText('Tell me about your background and career goals...')
    ).toBeInTheDocument()
  })

  it('updates value as user types', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={mockOnSend} isLoading={false} />)
    const textarea = screen.getByPlaceholderText('Tell me about your background and career goals...')
    await user.type(textarea, 'Hello world')
    expect(textarea).toHaveValue('Hello world')
  })

  it('calls onSend with message text when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={mockOnSend} isLoading={false} />)
    const textarea = screen.getByPlaceholderText('Tell me about your background and career goals...')
    await user.type(textarea, 'Hello world')
    await user.keyboard('{Enter}')
    expect(mockOnSend).toHaveBeenCalledWith('Hello world')
    expect(mockOnSend).toHaveBeenCalledTimes(1)
  })

  it('clears the input after sending', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={mockOnSend} isLoading={false} />)
    const textarea = screen.getByPlaceholderText('Tell me about your background and career goals...')
    await user.type(textarea, 'Hello world')
    await user.keyboard('{Enter}')
    expect(textarea).toHaveValue('')
  })

  it('does NOT call onSend when Shift+Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={mockOnSend} isLoading={false} />)
    const textarea = screen.getByPlaceholderText('Tell me about your background and career goals...')
    await user.type(textarea, 'Hello world')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />)
    const button = screen.getByRole('button', { name: /send message/i })
    expect(button).toBeDisabled()
  })

  it('send button is disabled when isLoading is true', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={mockOnSend} isLoading={true} />)
    const textarea = screen.getByPlaceholderText('Tell me about your background and career goals...')
    // Even after typing, button should still be disabled because isLoading
    // (textarea is disabled so typing won't work, but we check the button)
    const button = screen.getByRole('button', { name: /send message/i })
    expect(button).toBeDisabled()
  })

  it('does NOT call onSend when button is disabled and clicked', () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />)
    // Input is empty so button is disabled
    const button = screen.getByRole('button', { name: /send message/i })
    fireEvent.click(button)
    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('textarea is disabled when isLoading is true', () => {
    render(<ChatInput onSend={mockOnSend} isLoading={true} />)
    const textarea = screen.getByPlaceholderText('Tell me about your background and career goals...')
    expect(textarea).toBeDisabled()
  })
})
