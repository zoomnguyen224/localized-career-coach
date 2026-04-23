import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/primitives/Hero'

describe('Hero', () => {
  it('renders title and subtitle', () => {
    render(
      <Hero
        title="Good morning, Ahmed."
        subtitle="The world moved overnight."
        byline={[{ label: 'Cairo', value: '08:14 local' }]}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good morning, Ahmed.')
    expect(screen.getByText('The world moved overnight.')).toBeInTheDocument()
  })

  it('renders byline entries', () => {
    render(
      <Hero
        title="Hello"
        byline={[
          { label: 'Cairo', value: '08:14 local' },
          { label: 'Synced', value: '2m ago', dotColor: 'var(--brand-emerald)' },
        ]}
      />,
    )
    expect(screen.getByText(/Cairo/)).toBeInTheDocument()
    expect(screen.getByText(/08:14 local/)).toBeInTheDocument()
    expect(screen.getByText(/2m ago/)).toBeInTheDocument()
  })
})
