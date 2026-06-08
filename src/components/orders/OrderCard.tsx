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
  if (mins < 60) return `${mins}min`
  return `${Math.floor(mins / 60)}h ${mins % 60}min`
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
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{order.code}</span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" 
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>

        <div className="space-y-1">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.product?.name || `Produto #${item.product_id}`}
              </span>
              <span className="text-muted-foreground">{formatCurrency(item.unit_price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {order.notes && (
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
            {order.notes}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className={`flex items-center gap-1 text-xs font-bold ${
            (order.status === 'pending' && (now - new Date(order.created_at).getTime()) > 8 * 60000) ||
            (order.status === 'preparing' && (now - new Date(order.updated_at).getTime()) > 15 * 60000)
              ? 'text-orange-600 animate-pulse'
              : 'text-muted-foreground'
          }`}>
            <Clock className="h-3 w-3" />
            <span>
              {order.status === 'pending' ? 'Pendente há: ' : 'Preparando há: '}
              {timeAgo(order.status === 'pending' ? order.created_at : order.updated_at, now)}
            </span>
          </div>
          <span className="font-semibold">{formatCurrency(order.total)}</span>
        </div>

        {(config.next || order.status === 'pending') && (
          <div className="flex gap-2 pt-1">
            {config.next && onAdvance && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAdvance(order.id, config.next!)}
              >
                {nextLabel[config.next] || config.next}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
            {['pending', 'preparing', 'ready'].includes(order.status) && onCancel && (
              <Button
                size="sm"
                variant="destructive"
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
