/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import { ThemeProvider } from '../../context/ThemeContext'
import { ToastProvider } from '../../context/ToastContext'
import Register from './Register'

let container
let root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  if (root) root.unmount()
  if (container) container.remove()
  container = null
  root = null
})

describe('Register choice screen', () => {
  it('shows only Student registration', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Register />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>,
      )
    })
    const text = container.textContent.replace(/\s+/g, ' ')
    expect(text).toContain('Create Student Account')
    expect(text).not.toContain('Professional')
    expect(text).not.toContain('Trainer')
    expect(text).not.toContain('Organization')
    expect(text).not.toContain('Prototype')
  })
})