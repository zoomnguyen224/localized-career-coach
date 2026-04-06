import { render, screen } from '@testing-library/react'
import Header from '@/components/layout/Header'

describe('Header', () => {
  it('renders "Localized" text', () => {
    render(<Header />)
    expect(screen.getByText('Localized')).toBeInTheDocument()
  })

  it('renders "AI Career Coach" text', () => {
    render(<Header />)
    expect(screen.getByText('AI Career Coach')).toBeInTheDocument()
  })

  it('renders "Beta" badge', () => {
    render(<Header />)
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('has white background class', () => {
    const { container } = render(<Header />)
    const nav = container.firstChild as HTMLElement
    expect(nav).toHaveClass('bg-white')
  })
})
