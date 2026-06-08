import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, loadFromStorage, isUnmasked, toggleUnmask } = useAuthStore()

  const isAdmin = user?.role === 'admin'
  const isCashier = user?.role === 'cashier'
  const isKitchen = user?.role === 'kitchen'

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isCashier,
    isKitchen,
    isUnmasked,
    toggleUnmask,
    login,
    logout,
    loadFromStorage,
  }
}
