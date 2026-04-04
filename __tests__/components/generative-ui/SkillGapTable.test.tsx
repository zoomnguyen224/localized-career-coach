import { render, screen } from '@testing-library/react'
import { SkillGapTable } from '@/components/generative-ui/SkillGapTable'
import type { SkillGap } from '@/types'

const mockGaps: SkillGap[] = [
  { skill: 'Python', category: 'technical', currentLevel: 4, requiredLevel: 9, gap: 5, severity: 'high', recommendedAction: 'Take Python course' },
  { skill: 'SQL', category: 'technical', currentLevel: 7, requiredLevel: 8, gap: 1, severity: 'low', recommendedAction: 'Practice SQL' },
  { skill: 'Machine Learning', category: 'technical', currentLevel: 3, requiredLevel: 6, gap: 3, severity: 'medium', recommendedAction: 'Study ML' },
]

describe('SkillGapTable', () => {
  it('renders all skills', () => {
    render(<SkillGapTable gaps={mockGaps} />)
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('SQL')).toBeInTheDocument()
    expect(screen.getByText('Machine Learning')).toBeInTheDocument()
  })

  it('shows severity badges', () => {
    render(<SkillGapTable gaps={mockGaps} />)
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('shows recommended actions', () => {
    render(<SkillGapTable gaps={mockGaps} />)
    expect(screen.getByText('Take Python course')).toBeInTheDocument()
  })
})
