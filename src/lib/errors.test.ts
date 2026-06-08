import { describe, it, expect } from 'vitest'
import { AppError, extractMessage } from './errors'

// Helper: create a minimal AxiosError-like object
function makeAxiosError(opts: {
  responseData?: unknown
  message?: string
} = {}) {
  return {
    isAxiosError: true,
    message: opts.message ?? 'Network Error',
    response: opts.responseData !== undefined
      ? { data: opts.responseData }
      : undefined,
  }
}

describe('AppError', () => {
  it('sets name to AppError', () => {
    const err = new AppError('test error')
    expect(err.name).toBe('AppError')
  })

  it('stores status and raw error', () => {
    const raw = new Error('raw')
    const err = new AppError('msg', 422, raw)
    expect(err.status).toBe(422)
    expect(err.raw).toBe(raw)
  })

  it('is instanceof Error', () => {
    expect(new AppError('x')).toBeInstanceOf(Error)
  })
})

describe('extractMessage', () => {
  it('returns response.data.error for Axios errors with API body', () => {
    const err = makeAxiosError({ responseData: { success: false, error: 'Credenciais inválidas' } })
    expect(extractMessage(err)).toBe('Credenciais inválidas')
  })

  it('returns error.message for Axios errors without response body', () => {
    const err = makeAxiosError({ message: 'Network Error', responseData: undefined })
    expect(extractMessage(err)).toBe('Network Error')
  })

  it('returns AppError.message for AppError instances', () => {
    const err = new AppError('already extracted')
    expect(extractMessage(err)).toBe('already extracted')
  })

  it('returns error.message for plain Error', () => {
    expect(extractMessage(new Error('plain error'))).toBe('plain error')
  })

  it('returns fallback for null', () => {
    expect(extractMessage(null)).toBe('Ocorreu um erro inesperado')
  })

  it('returns fallback for unknown object shapes', () => {
    expect(extractMessage({ foo: 'bar' })).toBe('Ocorreu um erro inesperado')
  })
})
