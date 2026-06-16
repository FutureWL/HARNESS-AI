import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import Login from './Login'

describe('Login', () => {
  it('renders demo credentials and submit button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    expect(screen.getByText('进入后台')).toBeInTheDocument()
    expect(screen.getByDisplayValue('admin@harness.local')).toBeInTheDocument()
    expect(screen.getByDisplayValue('admin123456')).toBeInTheDocument()
  })
})
