import axios from 'axios'
import { toast } from 'sonner'
import { AppError, extractMessage } from '@/lib/errors'
import type {
  ApiResponse,
  Category,
  CreateOrderRequest,
  CreateProductRequest,
  LoginRequest,
  Order,
  PaginatedResponse,
  Product,
  RegisterRequest,
  TokenResponse,
  UpdateStatusRequest,
  UpdateUserRequest,
  UserResponse,
  Client,
  SalesSummary,
  Ingredient,
  Coupon,
  CreateCouponRequest,
  DistributeRequest,
  CouponDistributionResponse,
  MerchandisingSection,
  PromotionRule,
} from '@/types'

import { API_URL } from '@/lib/config'

export const getFullImageUrl = (path?: string) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_URL}${path}`
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — inject JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response interceptor — handle 401 + refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isLoginRequest = original?.url?.includes('/api/auth/login')

    if (error.response?.status === 401 && !original?._retry && !isLoginRequest) {
      original._retry = true
      let refreshToken = null
      if (typeof window !== 'undefined') {
        refreshToken = localStorage.getItem('refresh_token')
      }
      if (refreshToken) {
        try {
          const { data } = await axios.post<ApiResponse<TokenResponse>>(
            `${API_URL}/api/auth/refresh`,
            { refresh_token: refreshToken }
          )
          if (data.success && data.data) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', data.data.access_token)
              localStorage.setItem('refresh_token', data.data.refresh_token)
            }
            original.headers.Authorization = `Bearer ${data.data.access_token}`
            return api(original)
          }
        } catch {
        toast.error('Sessão expirada. Faça login novamente')
        if (typeof window !== 'undefined') {
          localStorage.clear()
          window.location.href = '/login'
        }
        return Promise.reject(new AppError('Sessão expirada. Faça login novamente', 401, error))
      }
    } else {
      toast.error('Sessão expirada. Faça login novamente')
      if (typeof window !== 'undefined') {
        localStorage.clear()
        window.location.href = '/login'
      }
      return Promise.reject(new AppError('Sessão expirada. Faça login novamente', 401, error))
    }
    }

    const message = extractMessage(error)
    
    // Silence global toast to avoid duplicates; pages will handle specific errors
    // if (!(error.response?.status === 401 && isLoginRequest)) {
    //   toast.error(message)
    // }

    return Promise.reject(new AppError(message, error.response?.status, error))
  }
)

// ========== Auth API ==========

export const authApi = {
  login: (req: LoginRequest) =>
    api.post<ApiResponse<TokenResponse>>('/api/auth/login', req).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<TokenResponse>>('/api/auth/refresh', { refresh_token: refreshToken }).then((r) => r.data),

  me: () =>
    api.get<ApiResponse<UserResponse>>('/api/auth/me').then((r) => r.data),

  logout: () =>
    api.post<ApiResponse<string>>('/api/auth/logout').then((r) => r.data),

  register: (req: RegisterRequest) =>
    api.post<ApiResponse<string>>('/api/auth/register', req).then((r) => r.data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post<ApiResponse<string>>('/api/auth/change-password', { old_password: oldPassword, new_password: newPassword }).then((r) => r.data),
}

// ========== Products API ==========

export const productsApi = {
  getAll: () =>
    api.get<ApiResponse<Product[]>>('/api/products').then((r) => r.data),

  getById: (id: number) =>
    api.get<ApiResponse<Product>>(`/api/products/${id}`).then((r) => r.data),

  create: (req: CreateProductRequest) =>
    api.post<ApiResponse<Product>>('/api/products', req).then((r) => r.data),

  update: (id: number, req: Partial<CreateProductRequest>) =>
    api.put<ApiResponse<Product>>(`/api/products/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<string>>(`/api/products/${id}`).then((r) => r.data),

  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ApiResponse<string>>('/api/products/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
  getIngredients: () =>
    api.get<ApiResponse<Ingredient[]>>('/api/ingredients').then((r) => r.data),
}

// ========== Ingredients API ==========

export const ingredientsApi = {
  getAll: () =>
    api.get<ApiResponse<Ingredient[]>>('/api/ingredients').then((r) => r.data),

  create: (req: Partial<Ingredient>) =>
    api.post<ApiResponse<Ingredient>>('/api/ingredients', req).then((r) => r.data),

  update: (id: number, req: Partial<Ingredient>) =>
    api.put<ApiResponse<Ingredient>>(`/api/ingredients/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<string>>(`/api/ingredients/${id}`).then((r) => r.data),
}

// ========== Orders API ==========

export const ordersApi = {
  getAll: (filter: { page?: number; limit?: number; status?: string; code?: string; startDate?: string; endDate?: string; closureId?: number } = {}) =>
    api.get<ApiResponse<PaginatedResponse<Order>>>('/api/orders', { params: filter }).then((r) => r.data),

  getById: (id: number) =>
    api.get<ApiResponse<Order>>(`/api/orders/${id}`).then((r) => r.data),

  create: (req: CreateOrderRequest) =>
    api.post<ApiResponse<Order>>('/api/orders', req).then((r) => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<string>>(`/api/orders/${id}`).then((r) => r.data),

  updateStatus: (id: number, req: UpdateStatusRequest) =>
    api.put<ApiResponse<Order>>(`/api/orders/${id}/status`, req).then((r) => r.data),

  calculateDelivery: (destination: string, city?: string) =>
    api.get<ApiResponse<{ distance: number; fee: number }>>('/api/orders/calculate-delivery', { params: { destination, city } }).then((r) => r.data),
}

// ========== Clients API ==========

export const clientsApi = {
  search: (query: string, unmasked = false) =>
    api.get<ApiResponse<Client[]>>('/api/clients/search', { params: { q: query, unmasked } }).then((r) => r.data),

  getAll: (unmasked = false) =>
    api.get<ApiResponse<Client[]>>('/api/clients', { params: { unmasked } }).then((r) => r.data),

  getById: (id: number) =>
    api.get<ApiResponse<Client>>(`/api/clients/${id}`).then((r) => r.data),

  create: (req: any) =>
    api.post<ApiResponse<any>>('/api/clients', req).then((r) => r.data),

  update: (id: number, req: any) =>
    api.put<ApiResponse<Client>>(`/api/clients/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<string>>(`/api/clients/${id}`).then((r) => r.data),
}

// ========== Users API ==========

export const usersApi = {
  getAll: () =>
    api.get<ApiResponse<UserResponse[]>>('/api/users').then((r) => r.data),

  getById: (id: number) =>
    api.get<ApiResponse<UserResponse>>(`/api/users/${id}`).then((r) => r.data),

  update: (id: number, req: UpdateUserRequest) =>
    api.put<ApiResponse<UserResponse>>(`/api/users/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<string>>(`/api/users/${id}`).then((r) => r.data),
}

// ========== Categories API ==========

export const categoriesApi = {
  getAll: () =>
    api.get<ApiResponse<Category[]>>('/api/categories').then((r) => r.data),

  getById: (id: number) =>
    api.get<ApiResponse<Category>>(`/api/categories/${id}`).then((r) => r.data),

  create: (req: Partial<Category>) =>
    api.post<ApiResponse<Category>>('/api/categories', req).then((r) => r.data),

  update: (id: number, req: Partial<Category>) =>
    api.put<ApiResponse<Category>>(`/api/categories/${id}`, req).then((r) => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<string>>(`/api/categories/${id}`).then((r) => r.data),
}

export const settingsApi = {
  getMe: () =>
    api.get<ApiResponse<Record<string, string>>>('/api/settings/me').then((r) => r.data),

  updateMe: (key: string, value: string) =>
    api.patch<ApiResponse<string>>(`/api/settings/me/${key}`, { value }).then((r) => r.data),

  resetMe: (key: string) =>
    api.delete<ApiResponse<string>>(`/api/settings/me/${key}`).then((r) => r.data),

  getAll: () =>
    api.get<ApiResponse<Record<string, string>>>('/api/settings').then((r) => r.data),

  update: (key: string, value: string) =>
    api.patch<ApiResponse<string>>(`/api/settings/${key}`, { value }).then((r) => r.data),
}

export const closuresApi = {
  getActive: () =>
    api.get<ApiResponse<any>>('/api/closures/active').then((r) => r.data),

  open: (initialBalance: number) =>
    api.post<ApiResponse<any>>('/api/closures/open', { initial_balance: initialBalance }).then((r) => r.data),

  close: (id: number, data: any) =>
    api.post<ApiResponse<any>>(`/api/closures/${id}/close`, data).then((r) => r.data),

  getAll: (filter: { startDate?: string; endDate?: string } = {}) =>
    api.get<ApiResponse<any[]>>('/api/closures', { params: filter }).then((r) => r.data),
}

export const reportsApi = {
  getSalesSummary: (filter: { startDate?: string; endDate?: string } = {}) =>
    api.get<ApiResponse<SalesSummary>>('/api/reports/sales/summary', { params: filter }).then((r) => r.data),
}

// ========== Coupons API ==========

export const couponsApi = {
  getAll: () =>
    api.get<ApiResponse<Coupon[]>>('/api/coupons').then((r) => r.data),

  create: (req: CreateCouponRequest) =>
    api.post<ApiResponse<Coupon>>('/api/coupons', req).then((r) => r.data),

  distribute: (req: DistributeRequest) =>
    api.post<ApiResponse<{ message: string }>>('/api/coupons/distribute', req).then((r) => r.data),
  
  getDistributions: () =>
    api.get<CouponDistributionResponse[]>('/api/coupons/distributions').then((r) => r.data),

  getMyCoupons: () =>
    api.get<ApiResponse<Coupon[]>>('/api/customer/coupons').then((r) => r.data),

  validate: (code: string, amount: number) =>
    api.post<ApiResponse<Coupon>>('/api/customer/coupons/validate', { code, amount }).then((r) => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/api/coupons/${id}`).then((r) => r.data),

  getDetails: (id: number) =>
    api.get<ApiResponse<any>>(`/api/coupons/${id}/details`).then((r) => r.data),

  getDistributionRecipients: (id: number) =>
    api.get<ApiResponse<any[]>>(`/api/coupons/distributions/${id}/recipients`).then((r) => r.data),
}

// ========== Merchandising API ==========
export const merchandisingApi = {
  getHome: () =>
    api.get<ApiResponse<MerchandisingSection[]>>('/api/customer/home').then((r) => r.data),

  getAllAdmin: () =>
    api.get<ApiResponse<MerchandisingSection[]>>('/api/merchandising/sections').then((r) => r.data),

  createSection: (req: any) =>
    api.post<ApiResponse<MerchandisingSection>>('/api/merchandising/sections', req).then((r) => r.data),

  updateSection: (id: number, req: any) =>
    api.put<ApiResponse<MerchandisingSection>>(`/api/merchandising/sections/${id}`, req).then((r) => r.data),

  deleteSection: (id: number) =>
    api.delete<ApiResponse<string>>(`/api/merchandising/sections/${id}`).then((r) => r.data),
}

// ========== Promotions API ==========
export const promotionsApi = {
  getAll: () =>
    api.get<ApiResponse<PromotionRule[]>>('/api/promotions/rules').then((r) => r.data),

  create: (req: any) =>
    api.post<ApiResponse<PromotionRule>>('/api/promotions/rules', req).then((r) => r.data),

  // TODO: Add Update/Delete as implemented in backend
}

export default api
