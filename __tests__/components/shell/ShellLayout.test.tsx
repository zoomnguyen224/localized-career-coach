import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@/components/layout/ChatDrawer', () => ({
  ChatDrawer: () => null,
}))

import ShellLayout from '@/app/(shell)/layout'
import { usePathname } from 'next/navigation'

const mockedUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('ShellLayout', () => {
  afterEach(() => {
    mockedUsePathname.mockReset()
  })

  it('renders WorkStrip with all 4 workspace links on /home', () => {
    mockedUsePathname.mockReturnValue('/home')
    render(
      <ShellLayout>
        <div data-testid="child">child</div>
      </ShellLayout>,
    )
    expect(screen.getByText('MY WORK')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Applications' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My CV' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Interview Prep' })).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('still renders WorkStrip on /jobs (always visible)', () => {
    mockedUsePathname.mockReturnValue('/jobs')
    render(
      <ShellLayout>
        <div />
      </ShellLayout>,
    )
    expect(screen.getByText('MY WORK')).toBeInTheDocument()
  })
})
