import React from 'react'
import { render, screen } from '@testing-library/react'
import { MessageList } from '@/components/chat/MessageList'
import { ChatMessage } from '@/types'

jest.mock('@/components/generative-ui/SkillRadarChart', () => ({
  SkillRadarChart: ({ result }: { result: unknown }) => <div data-testid="skill-radar-chart">SkillRadarChart</div>
}))
jest.mock('@/components/generative-ui/SkillGapTable', () => ({
  SkillGapTable: ({ result }: { result: unknown }) => <div data-testid="skill-gap-table">SkillGapTable</div>
}))
jest.mock('@/components/generative-ui/LearningPathTimeline', () => ({
  LearningPathTimeline: ({ result }: { result: unknown }) => <div data-testid="learning-path-timeline">LearningPathTimeline</div>
}))
jest.mock('@/components/generative-ui/ExpertCard', () => ({
  ExpertCard: ({ result }: { result: unknown }) => <div data-testid="expert-card">ExpertCard</div>
}))
jest.mock('@/components/generative-ui/CareerInsightCard', () => ({
  CareerInsightCard: ({ insight }: { insight: unknown }) => <div data-testid="career-insight-card">CareerInsightCard</div>
}))

window.scrollTo = jest.fn()

// jsdom doesn't implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn()

describe('MessageList', () => {
  it('renders user message with correct content (right-aligned bubble)', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello, I need career advice',
        toolResults: [],
        segments: []
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByText('Hello, I need career advice')).toBeInTheDocument()
    const messageContainer = screen.getByText('Hello, I need career advice').closest('[class*="justify-end"]')
    expect(messageContainer).toBeInTheDocument()
  })

  it('renders assistant message with "L" avatar', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'I can help you with your career',
        toolResults: [],
        segments: []
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByText('I can help you with your career')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('shows loading skeleton for tool in loading state', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Analyzing...',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'skill_gap_analysis',
            result: null,
            status: 'loading'
          }
        ],
        segments: [
          { type: 'text', content: 'Analyzing...' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('tool-loading-skill_gap_analysis')).toBeInTheDocument()
    expect(screen.getByText('Analyzing skill gaps...')).toBeInTheDocument()
  })

  it('renders SkillRadarChart when skill_gap_analysis tool result is done', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Here is your analysis',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'skill_gap_analysis',
            result: { gaps: [] },
            status: 'done'
          }
        ],
        segments: [
          { type: 'text', content: 'Here is your analysis' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('skill-radar-chart')).toBeInTheDocument()
  })

  it('renders SkillGapTable when skill_gap_analysis tool result is done', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Here is your analysis',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'skill_gap_analysis',
            result: { gaps: [] },
            status: 'done'
          }
        ],
        segments: [
          { type: 'text', content: 'Here is your analysis' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('skill-gap-table')).toBeInTheDocument()
  })

  it('renders LearningPathTimeline when learning_path tool result is done', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Here is your learning path',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'learning_path',
            result: { phases: [] },
            status: 'done'
          }
        ],
        segments: [
          { type: 'text', content: 'Here is your learning path' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('learning-path-timeline')).toBeInTheDocument()
  })

  it('renders ExpertCard when expert_match tool result is done', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Here are some experts',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'expert_match',
            result: { experts: [] },
            status: 'done'
          }
        ],
        segments: [
          { type: 'text', content: 'Here are some experts' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('expert-card')).toBeInTheDocument()
  })

  it('renders CareerInsightCard when career_insight tool result is done', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Here is an insight',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'career_insight',
            result: { insight: { stat: '50%', description: 'test' } },
            status: 'done'
          }
        ],
        segments: [
          { type: 'text', content: 'Here is an insight' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('career-insight-card')).toBeInTheDocument()
  })

  it('returns null for update_profile tool result', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Profile updated',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'update_profile',
            result: { success: true },
            status: 'done'
          }
        ],
        segments: [
          { type: 'text', content: 'Profile updated' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    const { container } = render(<MessageList messages={messages} />)

    // No generative UI component should be rendered for update_profile
    expect(container.querySelector('[data-testid="skill-radar-chart"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid="skill-gap-table"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid="learning-path-timeline"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid="expert-card"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid="career-insight-card"]')).not.toBeInTheDocument()
  })

  it('renders multiple messages in order', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'First message',
        toolResults: [],
        segments: []
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Second message',
        toolResults: [],
        segments: []
      },
      {
        id: '3',
        role: 'user',
        content: 'Third message',
        toolResults: [],
        segments: []
      }
    ]
    render(<MessageList messages={messages} />)

    const allText = screen.getAllByText(/message/)
    expect(allText).toHaveLength(3)
    expect(screen.getByText('First message')).toBeInTheDocument()
    expect(screen.getByText('Second message')).toBeInTheDocument()
    expect(screen.getByText('Third message')).toBeInTheDocument()
  })

  it('shows loading text for learning_path tool in loading state', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Building...',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'learning_path',
            result: null,
            status: 'loading'
          }
        ],
        segments: [
          { type: 'text', content: 'Building...' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('tool-loading-learning_path')).toBeInTheDocument()
    expect(screen.getByText('Building learning path...')).toBeInTheDocument()
  })

  it('shows loading text for expert_match tool in loading state', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Searching...',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'expert_match',
            result: null,
            status: 'loading'
          }
        ],
        segments: [
          { type: 'text', content: 'Searching...' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('tool-loading-expert_match')).toBeInTheDocument()
    expect(screen.getByText('Finding mentors...')).toBeInTheDocument()
  })

  it('shows loading text for career_insight tool in loading state', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Loading...',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'career_insight',
            result: null,
            status: 'loading'
          }
        ],
        segments: [
          { type: 'text', content: 'Loading...' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('tool-loading-career_insight')).toBeInTheDocument()
    expect(screen.getByText('Loading insight...')).toBeInTheDocument()
  })

  it('shows loading text for update_profile tool in loading state', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Updating...',
        toolResults: [
          {
            id: 'tr1',
            toolName: 'update_profile',
            result: null,
            status: 'loading'
          }
        ],
        segments: [
          { type: 'text', content: 'Updating...' },
          { type: 'tool', toolResultId: 'tr1' }
        ]
      }
    ]
    render(<MessageList messages={messages} />)

    expect(screen.getByTestId('tool-loading-update_profile')).toBeInTheDocument()
    expect(screen.getByText('Updating profile...')).toBeInTheDocument()
  })
})
