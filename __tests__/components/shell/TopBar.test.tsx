import { render, screen } from '@testing-library/react'
import { TopBar } from '@/components/shell/TopBar'

describe('TopBar', () => {
  it('renders Home, Events and Jobs (no Career Map)', () => {
    render(<TopBar activeNav="home" onOpenChat={() => {}} />)
    expect(screen.getByRole('link', { name: /Home/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Jobs/ })).toBeInTheDocument()
    // Events is rendered but not as a link (see disabled test below)
    expect(screen.getByText(/Events/)).toBeInTheDocument()
    // Career Map slot is removed entirely
    expect(screen.queryByText(/Career Map/)).not.toBeInTheDocument()
  })

  it('renders Events as a non-clickable disabled span with a coming-soon cue', () => {
    render(<TopBar activeNav="home" onOpenChat={() => {}} />)
    // Not a link
    expect(screen.queryByRole('link', { name: /Events/ })).not.toBeInTheDocument()
    const eventsLabel = screen.getByText(/Events/)
    const eventsEl = eventsLabel.closest('[aria-disabled]')
    expect(eventsEl).not.toBeNull()
    expect(eventsEl!.tagName).toBe('SPAN')
    expect(eventsEl!.getAttribute('aria-disabled')).toBe('true')
    expect(eventsEl!.getAttribute('title')).toBe('Coming soon')
  })

  it('marks the active nav item', () => {
    render(<TopBar activeNav="jobs" onOpenChat={() => {}} />)
    const jobsLink = screen.getByRole('link', { name: /Jobs/ })
    expect(jobsLink.className).toMatch(/on/)
  })

  it('invokes onOpenChat when chat icon clicked', () => {
    const onOpen = jest.fn()
    render(<TopBar activeNav="home" onOpenChat={onOpen} />)
    screen.getByRole('button', { name: 'Career agent chat' }).click()
    expect(onOpen).toHaveBeenCalled()
  })
})
