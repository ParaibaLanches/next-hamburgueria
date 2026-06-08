// src/stores/orderStore.test.ts
// Unit tests for the order Zustand store
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { mockOrder } from '@/test/mocks/handlers'
import { useOrderStore } from './orderStore'

describe('orderStore — fetchOrders', () => {
  it('fetches and stores orders', async () => {
    await useOrderStore.getState().fetchOrders()

    const state = useOrderStore.getState()
    expect(state.orders).toHaveLength(1)
    expect(state.orders[0]).toMatchObject({ code: mockOrder.code })
    expect(state.isLoading).toBe(false)
    expect(state.total).toBe(1)
  })

  it('filters by status if passed', async () => {
    server.use(
      http.get('http://localhost:8080/api/orders', ({ request }) => {
        const url = new URL(request.url)
        const status = url.searchParams.get('status')
        const data = status === 'pending' ? [mockOrder] : []
        return HttpResponse.json({
          success: true,
          data: { data, page: 1, limit: 50, total: data.length, total_pages: 1 },
        })
      })
    )

    await useOrderStore.getState().fetchOrders('pending')

    expect(useOrderStore.getState().orders).toHaveLength(1)
    expect(useOrderStore.getState().statusFilter).toBe('pending')
  })

  it('sets isLoading to false even on error', async () => {
    server.use(
      http.get('http://localhost:8080/api/orders', () =>
        HttpResponse.json({}, { status: 500 })
      )
    )

    try {
      await useOrderStore.getState().fetchOrders()
    } catch {
      // allowed — just checking finally block
    }

    expect(useOrderStore.getState().isLoading).toBe(false)
  })
})

describe('orderStore — updateStatus', () => {
  it('updates the status of an order in state', async () => {
    useOrderStore.setState({ orders: [mockOrder] })

    await useOrderStore.getState().updateStatus(mockOrder.id, 'preparing')

    const updated = useOrderStore.getState().orders.find((o) => o.id === mockOrder.id)
    expect(updated?.status).toBe('preparing')
  })
})

describe('orderStore — addFromWebSocket', () => {
  it('prepends new order to the list', () => {
    useOrderStore.setState({ orders: [], total: 0 })
    const newOrder = { ...mockOrder, id: 99, code: 'ORD-WS' }

    useOrderStore.getState().addFromWebSocket(newOrder)

    const state = useOrderStore.getState()
    expect(state.orders[0].code).toBe('ORD-WS')
    expect(state.total).toBe(1)
  })

  it('does not add duplicate orders', () => {
    useOrderStore.setState({ orders: [mockOrder], total: 1 })

    useOrderStore.getState().addFromWebSocket(mockOrder)

    expect(useOrderStore.getState().orders).toHaveLength(1)
    expect(useOrderStore.getState().total).toBe(1)
  })
})

describe('orderStore — setStatusFilter', () => {
  it('updates statusFilter', () => {
    useOrderStore.getState().setStatusFilter('ready')
    expect(useOrderStore.getState().statusFilter).toBe('ready')
  })
})
