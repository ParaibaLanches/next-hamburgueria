import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly raw?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    // Restore prototype chain (TypeScript class extends Error quirk)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function extractMessage(err: unknown): string {
  // Axios error with API response body
  if (isAxiosError(err)) {
    const data = err.response?.data as any
    if (data?.error) return data.error
    if (data?.message) return data.message
    if (err.message) return err.message
  }
  // Already an AppError — message already clean
  if (err instanceof AppError) return err.message
  // Plain JS Error
  if (err instanceof Error) return err.message
  // Unknown shape — safe fallback
  return 'Ocorreu um erro inesperado'
}

function isAxiosError(err: unknown): err is AxiosError {
  return typeof err === 'object' && err !== null && (err as AxiosError).isAxiosError === true
}
