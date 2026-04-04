import { render, screen } from '@testing-library/react'
import { CareerInsightCard } from '@/components/generative-ui/CareerInsightCard'
import type { CareerInsight } from '@/types'

const mockInsight: CareerInsight = {
  stat: '78% of Data roles in KSA require Python',
  description: 'Python dominates data analytics across Saudi Arabia.',
  source: 'LinkedIn Jobs 2024',
  relevantRoles: ['Data Analyst'],
  location: 'Saudi Arabia',
  topics: ['python'],
}

describe('CareerInsightCard', () => {
  it('renders the stat', () => {
    render(<CareerInsightCard insight={mockInsight} />)
    expect(screen.getByText('78% of Data roles in KSA require Python')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<CareerInsightCard insight={mockInsight} />)
    expect(screen.getByText('Python dominates data analytics across Saudi Arabia.')).toBeInTheDocument()
  })

  it('renders the source', () => {
    render(<CareerInsightCard insight={mockInsight} />)
    expect(screen.getByText(/LinkedIn Jobs 2024/)).toBeInTheDocument()
  })
})
