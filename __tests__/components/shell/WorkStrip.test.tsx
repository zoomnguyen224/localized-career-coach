import { render, screen } from '@testing-library/react'
import { WorkStrip } from '@/components/shell/WorkStrip'

describe('WorkStrip', () => {
  it('renders workspace links with MY WORK label', () => {
    render(<WorkStrip activeNav="applications" />)
    expect(screen.getByText('MY WORK')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Applications' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My CV' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Interview Prep' })).toBeInTheDocument()
  })

  it('marks the active nav item', () => {
    render(<WorkStrip activeNav="cv" />)
    const cvLink = screen.getByRole('link', { name: 'My CV' })
    expect(cvLink.className).toMatch(/on/)
  })
})
