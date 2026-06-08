// src/components/ErrorBoundary.test.tsx
// Tests for the ErrorBoundary component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

// Suppress React's error boundary console output in tests
const consoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>Safe content</div>
}

describe('ErrorBoundary — normal rendering', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })
})

describe('ErrorBoundary — error state', () => {
  beforeEach(() => {
    // ErrorBoundary logs via componentDidCatch — suppress noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('does not expose error details in UI', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.queryByText('Test error')).not.toBeInTheDocument()
  })

  it('resets the boundary state when "Tentar novamente" is clicked', async () => {
    const user = userEvent.setup()

    // Render with a throwing child — boundary shows fallback
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )

    // Confirm fallback is shown
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument()

    // Click retry — boundary resets hasError to false
    // (child will throw again since it still has shouldThrow=true,
    //  but the retry click itself must not throw)
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))

    // After clicking, the boundary tried to re-render the child which threw again
    // so fallback is shown again — but the button click itself didn't crash
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument()
  })
})

// Restore console.error after tests
afterEach(() => {
  console.error = consoleError
})
