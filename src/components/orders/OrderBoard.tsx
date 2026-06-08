import type { Order, OrderStatus } from '@/types'
import OrderCard from './OrderCard'

const columns: { status: OrderStatus; title: string; color: string }[] = [
  { status: 'pending', title: 'Pendentes', color: 'border-amber-500' },
  { status: 'preparing', title: 'Preparando', color: 'border-blue-500' },
  { status: 'ready', title: 'Prontos', color: 'border-green-500' },
]

interface OrderBoardProps {
  orders: Order[]
  onAdvance: (id: number, status: OrderStatus) => void
  onCancel: (id: number) => void
}

export default function OrderBoard({ orders, onAdvance, onCancel }: OrderBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {columns.map((col) => {
        const colOrders = orders.filter((o) => o.status === col.status)
        return (
          <div key={col.status} className="flex flex-col">
            <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${col.color}`}>
              <h3 className="font-semibold text-lg">{col.title}</h3>
              <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {colOrders.length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum pedido
                </p>
              ) : (
                colOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAdvance={onAdvance}
                    onCancel={onCancel}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
