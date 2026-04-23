/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { TargetRolePicker } from '@/components/career-map/TargetRolePicker'
import { loadGraph } from '@/lib/career-map/store'
import { MENA_ROLES } from '@/lib/mock-data'
import type { CurrentSkill, UserProfile } from '@/types'

const LEARNER = 'learner-under-test'

const profile: UserProfile = {
  name: 'Ahmed',
  location: 'Cairo',
  currentLevel: 'junior',
}

const skills: CurrentSkill[] = [
  { name: 'Python', currentLevel: 8 },
  { name: 'SQL', currentLevel: 7 },
]

beforeEach(() => {
  localStorage.clear()
})

describe('TargetRolePicker', () => {
  it('renders the picker with all MENA_ROLES as options', () => {
    render(<TargetRolePicker learnerId={LEARNER} profile={profile} currentSkills={skills} />)
    const select = screen.getByLabelText('Target role') as HTMLSelectElement
    expect(select.options).toHaveLength(MENA_ROLES.length)
    // First role is selected by default
    expect(select.value).toBe(MENA_ROLES[0].id)
  })

  it('persists a career map under the learner key after confirm', () => {
    render(<TargetRolePicker learnerId={LEARNER} profile={profile} currentSkills={skills} />)
    const select = screen.getByLabelText('Target role') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'data-analyst-aramco' } })
    fireEvent.click(screen.getByRole('button', { name: 'Seed map' }))

    const graph = loadGraph(LEARNER)
    expect(graph).not.toBeNull()
    expect(graph?.targetRoleId).toBe('data-analyst-aramco')
    expect(graph?.learnerId).toBe(LEARNER)
  })

  it('swaps to a success banner with a link to /home after seeding', () => {
    render(<TargetRolePicker learnerId={LEARNER} profile={profile} currentSkills={skills} />)
    fireEvent.click(screen.getByRole('button', { name: 'Seed map' }))

    expect(screen.getByTestId('career-map-seeded')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /See your Career Map/ })
    expect(link).toHaveAttribute('href', '/home')
  })

  it('shows the initial match score on the success banner', () => {
    render(<TargetRolePicker learnerId={LEARNER} profile={profile} currentSkills={skills} />)
    fireEvent.click(screen.getByRole('button', { name: 'Seed map' }))

    // DEMO_PROFILE skills vs. MENA_ROLES[0] (data-analyst-aramco) gives a
    // number >= 65 thanks to the floor; we don't need to assert the exact
    // number here — just that a percent is shown.
    const banner = screen.getByTestId('career-map-seeded')
    expect(banner.textContent).toMatch(/\d+%/)
  })

  it('fires onSeeded callback with learnerId and targetRoleId', () => {
    const onSeeded = jest.fn()
    render(
      <TargetRolePicker
        learnerId={LEARNER}
        profile={profile}
        currentSkills={skills}
        onSeeded={onSeeded}
      />
    )
    const select = screen.getByLabelText('Target role') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'pm-careem' } })
    fireEvent.click(screen.getByRole('button', { name: 'Seed map' }))
    expect(onSeeded).toHaveBeenCalledWith(LEARNER, 'pm-careem')
  })

  it('dismisses when the user clicks Dismiss after seeding', () => {
    render(<TargetRolePicker learnerId={LEARNER} profile={profile} currentSkills={skills} />)
    fireEvent.click(screen.getByRole('button', { name: 'Seed map' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByTestId('career-map-seeded')).not.toBeInTheDocument()
  })
})
