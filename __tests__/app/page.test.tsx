import { render } from '@testing-library/react'
import Home from '@/app/page'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('Root page', () => {
  it('redirects to /home', () => {
    const { redirect } = require('next/navigation')
    render(<Home />)
    expect(redirect).toHaveBeenCalledWith('/home')
  })
})
