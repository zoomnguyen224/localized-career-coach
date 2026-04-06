import { render, screen } from '@testing-library/react'
import { ExpertCard } from '@/components/generative-ui/ExpertCard'
import type { ExpertMatchResult } from '@/types'

const mockResult: ExpertMatchResult = {
  experts: [
    {
      id: '1',
      name: 'Sara Al-Hassan',
      initials: 'SH',
      title: 'Senior Software Engineer',
      company: 'Careem',
      location: 'Dubai, UAE',
      specialization: 'Backend Engineering',
      industries: ['tech', 'cloud'],
      bio: 'Experienced engineer at Careem.',
      matchScore: 92,
      matchReason: 'Strong alignment in backend and cloud expertise.',
    },
    {
      id: '2',
      name: 'Khalid Mansour',
      initials: 'KM',
      title: 'Investment Analyst',
      company: 'Gulf Capital',
      location: 'Riyadh, KSA',
      specialization: 'Private Equity',
      industries: ['finance', 'fintech'],
      bio: 'Investment professional at Gulf Capital.',
      matchScore: 72,
      matchReason: 'Shared interest in emerging markets finance.',
    },
    {
      id: '3',
      name: 'Lina Barakat',
      initials: 'LB',
      title: 'Marketing Director',
      company: 'Majid Al Futtaim',
      location: 'Abu Dhabi, UAE',
      specialization: 'Brand Strategy',
      industries: ['retail'],
      bio: 'Marketing leader at Majid Al Futtaim.',
      matchScore: 55,
      matchReason: 'Experience in regional retail brand building.',
    },
  ],
}

describe('ExpertCard', () => {
  it('renders expert name, title, and company', () => {
    render(<ExpertCard {...mockResult} />)
    expect(screen.getByText('Sara Al-Hassan')).toBeInTheDocument()
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    expect(screen.getByText(/Careem/)).toBeInTheDocument()
  })

  it('shows match score badge with teal styling for score >= 80', () => {
    render(<ExpertCard {...mockResult} />)
    const tealBadge = screen.getByText('92% match')
    expect(tealBadge).toBeInTheDocument()
    expect(tealBadge.className).toMatch(/bg-green/)
  })

  it('shows match score badge with amber styling for score 60-79', () => {
    render(<ExpertCard {...mockResult} />)
    const amberBadge = screen.getByText('72% match')
    expect(amberBadge).toBeInTheDocument()
    expect(amberBadge.className).toMatch(/bg-amber-50/)
  })

  it('shows match score badge with gray styling for score below 60', () => {
    render(<ExpertCard {...mockResult} />)
    const grayBadge = screen.getByText('55% match')
    expect(grayBadge).toBeInTheDocument()
    expect(grayBadge.className).toMatch(/bg-gray/)
  })

  it('shows match reason text', () => {
    render(<ExpertCard {...mockResult} />)
    expect(
      screen.getByText('Strong alignment in backend and cloud expertise.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Shared interest in emerging markets finance.')
    ).toBeInTheDocument()
  })

  it('"Request Session" buttons are disabled', () => {
    render(<ExpertCard {...mockResult} />)
    const buttons = screen.getAllByRole('button', { name: /request session/i })
    expect(buttons.length).toBeGreaterThan(0)
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('renders multiple experts in a grid (up to 3)', () => {
    render(<ExpertCard {...mockResult} />)
    // All 3 experts should appear
    expect(screen.getByText('Sara Al-Hassan')).toBeInTheDocument()
    expect(screen.getByText('Khalid Mansour')).toBeInTheDocument()
    expect(screen.getByText('Lina Barakat')).toBeInTheDocument()
  })

  it('renders only up to 3 cards when more are provided', () => {
    const extraExpert = {
      ...mockResult.experts[0],
      id: '4',
      name: 'Extra Expert',
      initials: 'EE',
    }
    render(<ExpertCard experts={[...mockResult.experts, extraExpert]} />)
    // 4th expert should not appear
    expect(screen.queryByText('Extra Expert')).not.toBeInTheDocument()
  })

  it('shows initials in avatar', () => {
    render(<ExpertCard {...mockResult} />)
    expect(screen.getByText('SH')).toBeInTheDocument()
    expect(screen.getByText('KM')).toBeInTheDocument()
    expect(screen.getByText('LB')).toBeInTheDocument()
  })

  it('shows location for each expert', () => {
    render(<ExpertCard {...mockResult} />)
    expect(screen.getByText(/Dubai, UAE/)).toBeInTheDocument()
    expect(screen.getByText(/Riyadh, KSA/)).toBeInTheDocument()
    expect(screen.getByText(/Abu Dhabi, UAE/)).toBeInTheDocument()
  })
})
