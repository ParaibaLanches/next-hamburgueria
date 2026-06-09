import { useEffect, useState } from 'react'
import type { Order, OrderStatus } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, ArrowRight, X, Printer } from 'lucide-react'

import { API_URL } from '@/lib/config'

const statusConfig: Record<OrderStatus, { label: string; color: string; next?: OrderStatus }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500 text-white', next: 'preparing' },
  preparing: { label: 'Preparando', color: 'bg-blue-500 text-white', next: 'ready' },
  ready: { label: 'Pronto', color: 'bg-green-500 text-white', next: 'delivered' },
  delivered: { label: 'Entregue', color: 'bg-gray-500 text-white' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500 text-white' },
}

const nextLabel: Record<string, string> = {
  preparing: 'Preparar',
  ready: 'Pronto',
  delivered: 'Entregar',
}

function timeAgo(dateStr: string, now: number): string {
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60} min`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface OrderCardProps {
  order: Order
  onAdvance?: (id: number, status: OrderStatus) => void
  onCancel?: (id: number) => void
}

export default function OrderCard({ order, onAdvance, onCancel }: OrderCardProps) {
  const [now, setNow] = useState(Date.now())
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const config = statusConfig[order.status]

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation()
    const token = localStorage.getItem('access_token')
    window.open(`${API_URL}/api/orders/${order.id}/receipt?token=${token}`, '_blank')
  }

  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base leading-none">{order.code}</span>
              <Badge className={`${config.color} text-[9px] px-1.5 py-0 h-4 rounded-sm tracking-wide`}>
                {config.label.toUpperCase()}
              </Badge>
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-semibold mt-1.5 ${
              (order.status === 'pending' && (now - new Date(order.created_at || (order as any).createdAt).getTime()) > 8 * 60000) ||
              (order.status === 'preparing' && (now - new Date(order.updated_at || (order as any).updatedAt).getTime()) > 15 * 60000)
                ? 'text-orange-600 animate-pulse'
                : 'text-muted-foreground'
            }`}>
              <Clock className="h-3 w-3" />
              <span>{timeAgo(order.status === 'pending' ? (order.created_at || (order as any).createdAt) : (order.updated_at || (order as any).updatedAt), now)}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="font-bold text-sm leading-none">{formatCurrency(order.total)}</span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 mt-1 opacity-50 hover:opacity-100" 
              onClick={handlePrint}
            >
              <Printer className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="text-xs space-y-0.5 border-t border-dashed pt-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="truncate pr-2">
                <span className="font-semibold">{item.quantity}x</span> {item.product?.name || `Produto #${item.product_id || (item as any).productId}`}
              </span>
              <span className="text-muted-foreground shrink-0 text-[11px]">
                {formatCurrency((item.unit_price || (item as any).unitPrice || 0) * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {order.notes && (
          <p className="text-[10px] text-muted-foreground bg-muted/50 p-1.5 rounded-sm border">
            {order.notes}
          </p>
        )}

        {(config.next || order.status === 'pending') && (
          <div className="flex gap-1.5 pt-1">
            {config.next && onAdvance && (
              <Button
                size="sm"
                className="flex-1 h-7 text-xs font-semibold"
                onClick={() => onAdvance(order.id, config.next!)}
              >
                {nextLabel[config.next] || config.next}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
            {['pending', 'preparing', 'ready'].includes(order.status) && onCancel && (
              <Button
                size="icon"
                variant="destructive"
                className="h-7 w-7 shrink-0"
                onClick={() => onCancel(order.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
