import { render, screen } from '@testing-library/react'
import { LearningPathTimeline } from '@/components/generative-ui/LearningPathTimeline'
import type { LearningPathResult } from '@/types'

const mockLearningPath: LearningPathResult = {
  targetRole: 'Data Analyst',
  phases: [
    {
      phase: 1,
      title: 'Foundations',
      duration: '4 weeks',
      skills: ['Python Basics', 'SQL Fundamentals'],
      resources: [
        {
          name: 'Python for Everyone',
          type: 'localized',
          provider: 'Localized Academy',
          estimatedHours: 20,
        },
        {
          name: 'SQL Bootcamp',
          type: 'external',
          provider: 'Coursera',
          estimatedHours: 15,
        },
      ],
    },
    {
      phase: 2,
      title: 'Data Analysis',
      duration: '6 weeks',
      skills: ['Pandas', 'Data Visualization'],
      resources: [
        {
          name: 'Data Analysis with Pandas',
          type: 'localized',
          provider: 'Localized Academy',
          estimatedHours: 30,
        },
      ],
    },
    {
      phase: 3,
      title: 'Advanced Topics',
      duration: '8 weeks',
      skills: ['Machine Learning', 'Statistics'],
      resources: [
        {
          name: 'Intro to ML',
          type: 'external',
          provider: 'edX',
          estimatedHours: 40,
        },
      ],
    },
  ],
  totalDuration: '18 weeks',
}

describe('LearningPathTimeline', () => {
  it('renders phase titles', () => {
    render(<LearningPathTimeline {...mockLearningPath} />)
    expect(screen.getByText('Foundations')).toBeInTheDocument()
    expect(screen.getByText('Data Analysis')).toBeInTheDocument()
    expect(screen.getByText('Advanced Topics')).toBeInTheDocument()
  })

  it('renders phase numbers', () => {
    render(<LearningPathTimeline {...mockLearningPath} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows duration tag for each phase', () => {
    render(<LearningPathTimeline {...mockLearningPath} />)
    expect(screen.getByText('4 weeks')).toBeInTheDocument()
    expect(screen.getByText('6 weeks')).toBeInTheDocument()
    expect(screen.getByText('8 weeks')).toBeInTheDocument()
  })

  it('shows skill badges', () => {
    render(<LearningPathTimeline {...mockLearningPath} />)
    expect(screen.getByText('Python Basics')).toBeInTheDocument()
    expect(screen.getByText('SQL Fundamentals')).toBeInTheDocument()
    expect(screen.getByText('Pandas')).toBeInTheDocument()
    expect(screen.getByText('Data Visualization')).toBeInTheDocument()
    expect(screen.getByText('Machine Learning')).toBeInTheDocument()
    expect(screen.getByText('Statistics')).toBeInTheDocument()
  })

  it('shows resource names', () => {
    render(<LearningPathTimeline {...mockLearningPath} />)
    expect(screen.getByText('Python for Everyone')).toBeInTheDocument()
    expect(screen.getByText('SQL Bootcamp')).toBeInTheDocument()
    expect(screen.getByText('Data Analysis with Pandas')).toBeInTheDocument()
    expect(screen.getByText('Intro to ML')).toBeInTheDocument()
  })

  it('shows resource providers', () => {
    render(<LearningPathTimeline {...mockLearningPath} />)
    expect(screen.getAllByText('Localized Academy').length).toBeGreaterThan(0)
    expect(screen.getByText('Coursera')).toBeInTheDocument()
    expect(screen.getByText('edX')).toBeInTheDocument()
  })

  it('shows total duration', () => {
    render(<LearningPathTimeline {...mockLearningPath} />)
    expect(screen.getByText(/18 weeks/)).toBeInTheDocument()
  })

  it('distinguishes localized vs external resources', () => {
    render(<LearningPathTimeline {...mockLearningPath} />)
    // Localized resources should have a "Localized" label
    expect(screen.getAllByText('Localized').length).toBeGreaterThan(0)
    // External resources should have an "External" label
    expect(screen.getAllByText('External').length).toBeGreaterThan(0)
  })
})
