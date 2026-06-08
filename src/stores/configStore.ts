import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { settingsApi } from '@/api/client'

interface ConfigState {
  settings: Record<string, string> // Merged results
  globalSettings: Record<string, string> // System defaults
  isLoading: boolean
  fetchSettings: () => Promise<void>
  updateGlobalSetting: (key: string, value: string) => Promise<boolean>
  updateUserSetting: (key: string, value: string) => Promise<boolean>
  resetUserSetting: (key: string) => Promise<boolean>
  getBool: (key: string, defaultValue?: boolean) => boolean
  getGlobalBool: (key: string, defaultValue?: boolean) => boolean
  getSetting: (key: string, defaultValue?: string) => string
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      settings: {},
      globalSettings: {},
      isLoading: false,
      fetchSettings: async () => {
        set({ isLoading: true })
        try {
          const [meRes, allRes] = await Promise.all([
            settingsApi.getMe(),
            settingsApi.getAll()
          ])

          if (meRes.success && meRes.data) {
            set({ settings: meRes.data })
          }
          if (allRes.success && allRes.data) {
            set({ globalSettings: allRes.data })
          }
        } catch {
           // Silently fail
        } finally {
          set({ isLoading: false })
        }
      },
      updateGlobalSetting: async (key, value) => {
        try {
          const res = await settingsApi.update(key, value)
          if (res.success) {
            set((state) => ({
              settings: { ...state.settings, [key]: value }
            }))
            return true
          }
          return false
        } catch {
          return false
        }
      },
      updateUserSetting: async (key, value) => {
        try {
          const res = await settingsApi.updateMe(key, value)
          if (res.success) {
            set((state) => ({
              settings: { ...state.settings, [key]: value }
            }))
            return true
          }
          return false
        } catch {
          return false
        }
      },
      resetUserSetting: async (key) => {
        try {
          const res = await settingsApi.resetMe(key)
          if (res.success) {
            // Re-fetch everything to ensure local state matches DB
            const [meRes, allRes] = await Promise.all([
              settingsApi.getMe(),
              settingsApi.getAll()
            ])
            if (meRes.success && meRes.data) set({ settings: meRes.data })
            if (allRes.success && allRes.data) set({ globalSettings: allRes.data })
            return true
          }
          return false
        } catch {
          return false
        }
      },
      getBool: (key, defaultValue = false) => {
        const val = get().settings[key]
        if (val === undefined) return defaultValue
        return val === 'true'
      },
      getGlobalBool: (key, defaultValue = false) => {
        const val = get().globalSettings[key]
        if (val === undefined) return defaultValue
        return val === 'true'
      },
      getSetting: (key: string, defaultValue = '') => {
        return get().settings[key] ?? defaultValue
      }
    }),
    {
      name: 'caixa-config',
      partialize: (state) => ({ settings: state.settings })
    }
  )
)
