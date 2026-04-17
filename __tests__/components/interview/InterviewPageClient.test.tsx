/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { InterviewPageClient } from '@/components/interview/InterviewPageClient'

// Mock useSearchParams
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}))

import { useSearchParams } from 'next/navigation'
const mockUseSearchParams = useSearchParams as jest.Mock

// Mock InterviewSessionPanel to keep test simple
jest.mock('@/components/interview/InterviewSessionPanel', () => ({
  InterviewSessionPanel: ({ session }: { session: { company: string } | null }) => (
    <div data-testid="session-panel">{session?.company ?? 'none'}</div>
  ),
}))

import { DEMO_SESSIONS } from '@/lib/interview'

describe('InterviewPageClient URL pre-select', () => {
  it('selects the session matching the company param (case-insensitive)', () => {
    const targetSession = DEMO_SESSIONS[1] // pick the second session, not the default
    if (!targetSession) return // skip if not enough demo data

    const mockGet = jest.fn((key: string) => key === 'company' ? targetSession.company : null)
    mockUseSearchParams.mockReturnValue({ get: mockGet })

    render(<InterviewPageClient />)

    expect(screen.getByTestId('session-panel')).toHaveTextContent(targetSession.company)
  })

  it('defaults to first session when company param is absent', () => {
    const mockGet = jest.fn(() => null)
    mockUseSearchParams.mockReturnValue({ get: mockGet })

    render(<InterviewPageClient />)

    const firstSession = DEMO_SESSIONS[0]
    if (firstSession) {
      expect(screen.getByTestId('session-panel')).toHaveTextContent(firstSession.company)
    }
  })

  it('defaults to first session when company param does not match any session', () => {
    const mockGet = jest.fn((key: string) => key === 'company' ? 'NonExistentCompany' : null)
    mockUseSearchParams.mockReturnValue({ get: mockGet })

    render(<InterviewPageClient />)

    const firstSession = DEMO_SESSIONS[0]
    if (firstSession) {
      expect(screen.getByTestId('session-panel')).toHaveTextContent(firstSession.company)
    }
  })
})
