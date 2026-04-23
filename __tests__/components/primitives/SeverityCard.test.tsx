import { render, screen } from '@testing-library/react'
import { SeverityCard } from '@/components/primitives/SeverityCard'

describe('SeverityCard', () => {
  it('renders tone label, title, and forYou body', () => {
    render(
      <SeverityCard
        tone="high"
        label="High signal"
        when="2 days ago"
        title="Northbay rewrote the Junior Data Engineer JD."
        forYou={{ label: 'What it means for you', body: 'Match dropped 72 → 68%.' }}
      />,
    )
    expect(screen.getByText('High signal')).toBeInTheDocument()
    expect(screen.getByText('2 days ago')).toBeInTheDocument()
    expect(screen.getByText('Northbay rewrote the Junior Data Engineer JD.')).toBeInTheDocument()
    expect(screen.getByText('Match dropped 72 → 68%.')).toBeInTheDocument()
  })

  it('applies tone-specific class', () => {
    const { container } = render(
      <SeverityCard
        tone="med"
        label="Medium signal"
        when="today"
        title="t"
        forYou={{ label: 'l', body: 'b' }}
      />,
    )
    const article = container.querySelector('article')
    expect(article?.className).toMatch(/med/)
  })
})
