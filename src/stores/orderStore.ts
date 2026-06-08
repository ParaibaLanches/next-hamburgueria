import { create } from 'zustand'
import { ordersApi } from '@/api/client'
import type { Order, OrderStatus } from '@/types'

interface OrderState {
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
  statusFilter: string
  isLoading: boolean
  lastCreatedOrderId: number | null
  lastStatusUpdate: { id: number; status: string } | null

  fetchOrders: (status?: string, page?: number) => Promise<void>
  updateStatus: (id: number, status: OrderStatus) => Promise<void>
  addFromWebSocket: (order: Order) => void
  setStatusFilter: (status: string) => void
  setLastCreatedOrderId: (id: number | null) => void
  setLastStatusUpdate: (update: { id: number; status: string } | null) => void
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 1,
  statusFilter: '',
  isLoading: false,
  lastCreatedOrderId: null,
  lastStatusUpdate: null,

  fetchOrders: async (status, page = 1) => {
    set({ isLoading: true })
    try {
      const filter = status ?? get().statusFilter
      const res = await ordersApi.getAll({ status: filter || undefined, page, limit: get().limit })
      if (res.success && res.data) {
        set({
          orders: res.data.data || [],
          total: res.data.total,
          page: res.data.page,
          totalPages: res.data.total_pages,
          statusFilter: filter,
        })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  updateStatus: async (id, status) => {
    const res = await ordersApi.updateStatus(id, { status })
    if (res.success && res.data) {
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? { ...o, ...res.data } : o)),
      }))
    }
  },

  addFromWebSocket: (order) => {
    set((state) => {
      const exists = state.orders.some((o) => o.id === order.id)
      if (exists) {
        return {
          orders: state.orders.map((o) => (o.id === order.id ? { ...o, ...order } : o)),
        }
      }
      return { orders: [order, ...state.orders], total: state.total + 1 }
    })
  },

  setStatusFilter: (status) => set({ statusFilter: status }),
  setLastCreatedOrderId: (id) => set({ lastCreatedOrderId: id }),
  setLastStatusUpdate: (update) => set({ lastStatusUpdate: update }),
}))
