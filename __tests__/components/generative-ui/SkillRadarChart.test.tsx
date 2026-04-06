import { render, screen } from '@testing-library/react'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import type { SkillGapResult } from '@/types'

jest.mock('recharts', () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockResult: SkillGapResult = {
  role: { id: 'aiml-neom', title: 'AI/ML Engineer', company: 'NEOM', location: 'NEOM', requiredSkills: [] },
  gaps: [
    { skill: 'Python', category: 'technical', currentLevel: 4, requiredLevel: 9, gap: 5, severity: 'high', recommendedAction: 'Study Python' },
    { skill: 'Machine Learning', category: 'technical', currentLevel: 3, requiredLevel: 8, gap: 5, severity: 'high', recommendedAction: 'Take ML course' },
  ],
  overallReadiness: 35,
}

describe('SkillRadarChart', () => {
  it('renders the radar chart', () => {
    render(<SkillRadarChart result={mockResult} />)
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
  })

  it('shows role title and company', () => {
    render(<SkillRadarChart result={mockResult} />)
    expect(screen.getByText(/AI\/ML Engineer/)).toBeInTheDocument()
    expect(screen.getByText(/NEOM/)).toBeInTheDocument()
  })

  it('shows overall readiness percentage', () => {
    render(<SkillRadarChart result={mockResult} />)
    expect(screen.getByText(/35%/)).toBeInTheDocument()
  })

  it('renders in compact mode without legend', () => {
    const result: SkillGapResult = {
      role: { id: '1', title: 'PM', company: 'Acme', location: 'Dubai', requiredSkills: [] },
      gaps: Array.from({ length: 8 }, (_, i) => ({
        skill: `Skill ${i}`,
        category: 'technical' as const,
        currentLevel: 5,
        requiredLevel: 8,
        gap: 3,
        severity: 'medium' as const,
        recommendedAction: 'Learn it',
      })),
      overallReadiness: 60,
    }
    const { queryByTestId } = render(<SkillRadarChart result={result} compact />)
    // Legend shows "Your Level" and "Role Required" — should be absent in compact mode
    expect(queryByTestId('legend')).not.toBeInTheDocument()
  })
})
