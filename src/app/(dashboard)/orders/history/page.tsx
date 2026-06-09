"use client";

import { useEffect, useState } from 'react'
import { ordersApi } from '@/api/client'
import type { Order, OrderStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Printer, FileText, ChevronLeft, ChevronRight, MapPin, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { API_URL } from '@/lib/config'
import { formatDateTime } from '@/lib/date'
import { maskPhone, maskDocument } from '@/lib/masks'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}


function getStatusColor(status: OrderStatus | string) {
  const normStatus = String(status).toLowerCase()
  switch (normStatus) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'preparing': return 'bg-blue-100 text-blue-800'
    case 'ready': return 'bg-purple-100 text-purple-800'
    case 'delivered': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function translateStatus(status: OrderStatus | string) {
  const normStatus = String(status).toLowerCase()
  switch (normStatus) {
    case 'pending': return 'Pendente'
    case 'preparing': return 'Preparando'
    case 'ready': return 'Pronto'
    case 'delivered': return 'Entregue'
    case 'cancelled': return 'Cancelado'
    default: return status
  }
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  // Filters
  const [searchCode, setSearchCode] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const fetchOrders = async (overrides?: any) => {
    setIsLoading(true)
    try {
      const res = await ordersApi.getAll({
        page,
        limit: 15,
        status: statusFilter === 'all' ? undefined : statusFilter,
        code: searchCode || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        ...overrides
      })
      if (res.success && res.data) {
        setOrders(res.data.data)
        setTotal(res.data.total)
        setTotalPages(res.data.total_pages)
      }
    } catch {
      toast.error('Erro ao carregar histórico')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrders({ page: 1 })
  }

  const handleReset = () => {
    setSearchCode('')
    setStatusFilter('all')
    setStartDate('')
    setEndDate('')
    setPage(1)
    fetchOrders({ 
      page: 1, 
      status: undefined, 
      code: undefined, 
      startDate: undefined, 
      endDate: undefined 
    })
  }

  const openDetail = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  const handlePrint = (id: number) => {
    const token = localStorage.getItem('access_token')
    window.open(`${API_URL}/api/orders/${id}/receipt?token=${token}`, '_blank')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este pedido?')) return
    
    try {
      const res = await ordersApi.delete(id)
      if (res.success) {
        toast.success('Pedido excluído')
        fetchOrders()
        if (selectedOrder?.id === id) setIsDetailOpen(false)
      } else {
        toast.error(res.error || 'Erro ao excluir')
      }
    } catch {
      toast.error('Erro ao excluir pedido')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Histórico de Pedidos</h1>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-[1.5] min-w-[140px] max-w-[200px]">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Código</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Ex: #001" 
                  value={searchCode} 
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="pl-9 h-10 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[160px] max-w-[200px]">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
                <SelectTrigger className="w-full h-10 shadow-sm">
                  {statusFilter === 'all' ? (
                    <span className="truncate">Todos</span>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(statusFilter)}`}>
                      {translateStatus(statusFilter)}
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor('pending')}`}>Pendente</span>
                  </SelectItem>
                  <SelectItem value="preparing">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor('preparing')}`}>Preparando</span>
                  </SelectItem>
                  <SelectItem value="ready">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor('ready')}`}>Pronto</span>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor('delivered')}`}>Entregue</span>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor('cancelled')}`}>Cancelado</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Data Início</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 shadow-sm"
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Data Fim</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 shadow-sm"
              />
            </div>

            <div className="flex gap-2 flex-grow sm:flex-grow-0 justify-end">
              <Button type="button" variant="outline" className="h-10 px-4 shadow-sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
              <Button type="submit" className="h-10 px-6 font-bold shadow-sm" disabled={isLoading}>
                {isLoading ? '...' : 'Filtrar'}
              </Button>
            </div>
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-bold">{order.code}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(order.created_at || (order as any).createdAt)}</TableCell>
                    <TableCell>{order.client?.name || order.customer?.name || 'S/ Identificação'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(order.order_type || (order as any).orderType) === 'delivery' ? 'Entrega' : (order.order_type || (order as any).orderType) === 'pickup' ? 'Retirada' : 'Local'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(order.status as OrderStatus)}`}>
                        {translateStatus(order.status as OrderStatus)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => openDetail(order)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePrint(order.id)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(order.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {orders.length} de {total} pedidos
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <span className="flex items-center px-4 text-sm font-medium">
                  Página {page} de {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-8">
              <span>Pedido {selectedOrder?.code}</span>
              <Badge variant="outline">{selectedOrder && translateStatus(selectedOrder.status as OrderStatus)}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">{formatDateTime(selectedOrder.created_at || (selectedOrder as any).createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium uppercase">{selectedOrder.order_type || (selectedOrder as any).orderType}</p>
                </div>
              </div>

              {(selectedOrder.client || selectedOrder.customer) && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                   <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente / Endereço</p>
                      <p className="font-medium">{selectedOrder.client?.name || selectedOrder.customer?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.client?.address || selectedOrder.customer?.address || 'Endereço não informado'}
                      </p>
                      {(selectedOrder.client?.phone || selectedOrder.customer?.phone) && (
                        <p className="text-sm text-muted-foreground mt-1 text-blue-600 font-medium">
                           Tel: {maskPhone(selectedOrder.client?.phone || selectedOrder.customer?.phone || '')}
                        </p>
                      )}
                      {(selectedOrder.client?.document || selectedOrder.customer?.document) && (
                        <p className="text-sm text-muted-foreground">
                           CPF: {maskDocument(selectedOrder.client?.document || selectedOrder.customer?.document || '')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Itens</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="flex gap-2">
                        <span className="font-bold text-primary">{item.quantity}x</span>
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          {item.notes && <p className="text-xs text-muted-foreground italic">"{item.notes}"</p>}
                        </div>
                      </div>
                      <span className="font-medium">{formatCurrency((item.unit_price || (item as any).unitPrice || 0) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Pagamento</p>
                <div className="space-y-1">
                  {selectedOrder.payments?.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-sm italic">
                      <span className="capitalize">{p.method === 'cash' ? 'Dinheiro' : p.method}</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full gap-2" variant="outline" onClick={() => handlePrint(selectedOrder.id)}>
                <Printer className="h-4 w-4" />
                Imprimir Comprovante
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
