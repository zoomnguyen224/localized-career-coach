/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { HomePageClient } from '@/components/home/HomePageClient'
import { DEMO_AHMED_GRAPH } from '@/lib/career-map/demo-ahmed'
import { saveGraph } from '@/lib/career-map/store'
import { setActiveThreadId } from '@/lib/conversation-store'
import type { CareerGraph } from '@/lib/career-map'

beforeEach(() => {
  localStorage.clear()
})

describe('HomePageClient', () => {
  it('renders the Ahmed demo fallback when no active thread is set', async () => {
    render(
      <HomePageClient
        demoFallback={DEMO_AHMED_GRAPH}
        learnerName="Ahmed"
        learnerTagline="demo"
      />
    )
    await waitFor(() => {
      expect(screen.getByTestId('home-demo-fallback')).toBeInTheDocument()
    })
    // The demo fixture has matchScore 68 and Saudi Aramco as the primary role.
    expect(screen.getAllByText(/68/).length).toBeGreaterThan(0)
    // Role name appears in the Market Radar headline + DataRow title.
    expect(screen.getAllByText(/Saudi Aramco/i).length).toBeGreaterThan(0)
  })

  it('renders the user graph when one is stored for the active thread', async () => {
    setActiveThreadId('learner-xyz')
    const userGraph: CareerGraph = {
      version: 1,
      learnerId: 'learner-xyz',
      targetRoleId: 'data-analyst-aramco',
      matchScore: 84,
      updatedAt: '2026-04-23T00:00:00.000Z',
      nodes: [
        {
          id: 'role:data-analyst-aramco',
          label: 'Data Analyst · Saudi Aramco',
          kind: 'role',
          status: 'unknown',
          confidence: 1,
          evidence: [],
          weight: 1,
        },
        {
          id: 'skill:python',
          label: 'Python',
          kind: 'skill',
          status: 'confirmed',
          confidence: 0.9,
          evidence: [],
          weight: 0.7,
        },
        {
          id: 'skill:statistics',
          label: 'Statistics',
          kind: 'skill',
          status: 'gap',
          confidence: 0.8,
          evidence: [],
          weight: 0.6,
        },
      ],
      edges: [
        { from: 'skill:python', to: 'role:data-analyst-aramco', weight: 0.15, kind: 'prereq' },
        { from: 'skill:statistics', to: 'role:data-analyst-aramco', weight: 0.6, kind: 'unlock' },
      ],
    }
    saveGraph(userGraph)

    render(
      <HomePageClient
        demoFallback={DEMO_AHMED_GRAPH}
        learnerName="Nora"
        learnerTagline="in-test learner"
      />
    )
    await waitFor(() => {
      expect(screen.getByTestId('home-user-graph')).toBeInTheDocument()
    })
    // Match score + role name from the loaded user graph
    expect(screen.getAllByText(/84/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Data Analyst/).length).toBeGreaterThan(0)
  })

  it('uses the highest-weight gap as the Next Move derivation', async () => {
    render(
      <HomePageClient
        demoFallback={DEMO_AHMED_GRAPH}
        learnerName="Ahmed"
        learnerTagline="demo"
      />
    )
    // The Ahmed demo's highest-weight gap is "SQL · Window functions" (0.92).
    await waitFor(() => {
      expect(screen.getByTestId('home-demo-fallback')).toBeInTheDocument()
    })
    expect(screen.getAllByText(/SQL · Window functions/i).length).toBeGreaterThan(0)
  })
})
