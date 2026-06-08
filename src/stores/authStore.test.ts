// src/stores/authStore.test.ts
// Unit tests for the authentication Zustand store
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { mockUser, mockTokens } from '@/test/mocks/handlers'
import { useAuthStore } from './authStore'

describe('authStore — login', () => {
  it('sets tokens and user after successful login', async () => {
    await useAuthStore.getState().login('admin@test.com', 'password123')

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toMatchObject({ name: mockUser.name, email: mockUser.email })
    expect(localStorage.getItem('access_token')).toBe(mockTokens.access_token)
    expect(localStorage.getItem('refresh_token')).toBe(mockTokens.refresh_token)
  })

  it('throws when API returns failure', async () => {
    server.use(
      http.post('http://localhost:8080/api/auth/login', () =>
        HttpResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 })
      )
    )

    await expect(
      useAuthStore.getState().login('invalid@test.com', 'wrongpass')
    ).rejects.toThrow()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('sets isLoading to false in finally even on error', async () => {
    server.use(
      http.post('http://localhost:8080/api/auth/login', () =>
        HttpResponse.json({ success: false, error: 'fail' }, { status: 401 })
      )
    )

    try {
      await useAuthStore.getState().login('a@b.com', 'x')
    } catch {
      // expected
    }

    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})

describe('authStore — logout', () => {
  beforeEach(async () => {
    await useAuthStore.getState().login('admin@test.com', 'password123')
  })

  it('clears user and tokens on logout', async () => {
    await useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('clears state even when logout API fails', async () => {
    server.use(
      http.post('http://localhost:8080/api/auth/logout', () =>
        HttpResponse.json({}, { status: 500 })
      )
    )

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })
})

describe('authStore — loadFromStorage', () => {
  it('sets user when valid token exists in localStorage', async () => {
    localStorage.setItem('access_token', mockTokens.access_token)

    await useAuthStore.getState().loadFromStorage()

    expect(useAuthStore.getState().user).toMatchObject({ name: mockUser.name })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('calls logout when no token found', async () => {
    // localStorage is empty (cleared by setup.ts)
    await useAuthStore.getState().loadFromStorage()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('calls logout when /me returns 401', async () => {
    localStorage.setItem('access_token', 'expired-token')
    server.use(
      http.get('http://localhost:8080/api/auth/me', () =>
        HttpResponse.json({ success: false }, { status: 401 })
      )
    )

    await useAuthStore.getState().loadFromStorage()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe('authStore — setUser', () => {
  it('updates user in state without API call', () => {
    const updated = { id: 1, name: 'Updated Name', email: 'new@test.com', role: 'admin' }
    useAuthStore.getState().setUser(updated)

    expect(useAuthStore.getState().user).toMatchObject(updated)
  })
})
