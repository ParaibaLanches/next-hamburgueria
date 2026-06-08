import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api/client'
import type { UserResponse } from '@/types'

interface AuthState {
  user: UserResponse | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
  setUser: (user: UserResponse) => void
  isUnmasked: boolean
  toggleUnmask: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isUnmasked: false,

      toggleUnmask: () => set({ isUnmasked: !get().isUnmasked }),

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const res = await authApi.login({ email, password })
      if (!res.success || !res.data) throw new Error(res.error || 'Erro ao fazer login')

      const { access_token, refresh_token } = res.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      set({ accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true })

      // Fetch user profile
      const profile = await authApi.me()
      if (profile.success && profile.data) {
        set({ user: profile.data })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore errors on logout
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },

  loadFromStorage: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      set({ isAuthenticated: false })
      return
    }
    try {
      const profile = await authApi.me()
      if (profile.success && profile.data) {
        set({ user: profile.data, isAuthenticated: true })
      } else {
        get().logout()
      }
    } catch {
      get().logout()
    }
  },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
