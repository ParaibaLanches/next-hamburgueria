"use client";

import { useEffect } from 'react'
import { useRouter } from 'next/navigation';

import { useOrderStore } from '@/stores/orderStore'
import { useAuth } from '@/hooks/useAuth'
import OrderBoard from '@/components/orders/OrderBoard'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { OrderStatus } from '@/types'

export default function OrdersPage() {
  const { orders, isLoading, fetchOrders, updateStatus, setLastStatusUpdate } = useOrderStore()
  const { isAdmin, isCashier } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleAdvance = async (id: number, status: OrderStatus) => {
    try {
      // Marcador local para evitar dupla notificação no AppLayout
      setLastStatusUpdate({ id, status })
      await updateStatus(id, status)
      toast.success('Status atualizado')
    } catch {
      setLastStatusUpdate(null)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleCancel = async (id: number) => {
    try {
      setLastStatusUpdate({ id, status: 'cancelled' })
      await updateStatus(id, 'cancelled')
      toast.success('Pedido cancelado')
    } catch {
      setLastStatusUpdate(null)
      toast.error('Erro ao cancelar pedido')
    }
  }

  // Only show active orders (not delivered/cancelled)
  const activeOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchOrders()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {(isAdmin || isCashier) && (
            <Button size="sm" onClick={() => router.push('/new-order')}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Pedido
            </Button>
          )}
        </div>
      </div>

      <OrderBoard
        orders={activeOrders}
        onAdvance={isAdmin || isCashier ? handleAdvance : () => {}}
        onCancel={isAdmin || isCashier ? handleCancel : () => {}}
      />
    </div>
  )
}
