// src/api/client.test.ts
// Tests for the API client — interceptors and auth flows
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { mockTokens, mockUser } from '@/test/mocks/handlers'
import { authApi, usersApi, ordersApi } from './client'

describe('authApi — login', () => {
  it('returns token response on success', async () => {
    const res = await authApi.login({ email: 'admin@test.com', password: 'pass' })
    expect(res.success).toBe(true)
    expect(res.data?.access_token).toBe(mockTokens.access_token)
  })

  it('throws on invalid credentials', async () => {
    server.use(
      http.post('http://localhost:8080/api/auth/login', () =>
        HttpResponse.json({ success: false, error: 'Invalid' }, { status: 401 })
      )
    )
    await expect(authApi.login({ email: 'x', password: 'y' })).rejects.toThrow()
  })
})

describe('authApi — me', () => {
  it('returns user profile when token is in localStorage', async () => {
    localStorage.setItem('access_token', mockTokens.access_token)

    const res = await authApi.me()
    expect(res.success).toBe(true)
    expect(res.data).toMatchObject({ name: mockUser.name })
  })
})

describe('authApi — changePassword', () => {
  it('returns success when password is changed', async () => {
    const res = await authApi.changePassword('old-pass', 'new-pass')
    expect(res.success).toBe(true)
  })
})

describe('usersApi — update', () => {
  it('returns updated user on success', async () => {
    const res = await usersApi.update(1, { name: 'New Name', email: 'new@test.com', role: 'admin' })
    expect(res.success).toBe(true)
    expect(res.data?.name).toBe('New Name')
  })
})

describe('ordersApi — getAll', () => {
  it('returns paginated list of orders', async () => {
    const res = await ordersApi.getAll()
    expect(res.success).toBe(true)
    expect(res.data?.data).toHaveLength(1)
    expect(res.data?.total).toBe(1)
  })

  it('passes status filter as query param', async () => {
    let receivedStatus: string | null = null
    server.use(
      http.get('http://localhost:8080/api/orders', ({ request }) => {
        receivedStatus = new URL(request.url).searchParams.get('status')
        return HttpResponse.json({ success: true, data: { data: [], page: 1, limit: 50, total: 0, total_pages: 1 } })
      })
    )

    await ordersApi.getAll({ status: 'pending' })
    expect(receivedStatus).toBe('pending')
  })
})
