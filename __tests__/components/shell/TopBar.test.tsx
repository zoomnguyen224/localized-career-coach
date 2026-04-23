import { render, screen } from '@testing-library/react'
import { TopBar } from '@/components/shell/TopBar'

describe('TopBar', () => {
  it('renders all 4 nav slots', () => {
    render(<TopBar activeNav="home" onOpenChat={() => {}} />)
    expect(screen.getByRole('link', { name: /Home/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Jobs/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Career Map/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Events/ })).toBeInTheDocument()
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
