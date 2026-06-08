"use client";

import React, { useEffect, useState } from 'react'
import { API_URL } from '@/lib/config'
import { formatCurrency } from '@/lib/utils'
import { closuresApi, ordersApi } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Calculator, 
  Unlock, 
  Lock, 
  History, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  AlertCircle,
  RefreshCw,
  Plus,
  Banknote,
  QrCode,
  MessageSquare,
  Lock as LockIcon,
  Eye,
  ChevronDown,
  ChevronUp,
  Printer
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { Order } from '@/types'
import { formatTime, formatDateTime } from '@/lib/date'


export default function ClosurePage() {
  const getPaymentTypeLabel = (payments?: any[]) => {
    if (!payments || payments.length === 0) return '---'
    const firstMethod = payments[0].method
    const labels: Record<string, string> = {
        'cash': 'Dinheiro',
        'pix': 'Pix',
        'credit_card': 'Crédito',
        'debit_card': 'Débito',
        'card': 'Cartão'
    }
    const baseLabel = labels[firstMethod] || firstMethod
    return payments.length > 1 ? `${baseLabel} +${payments.length - 1}` : baseLabel
  }

  const [activeClosure, setActiveClosure] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [sessionOrders, setSessionOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpeningOpen, setIsOpeningOpen] = useState(false)
  const [isClosingOpen, setIsClosingOpen] = useState(false)
  const [initialBalance, setInitialBalance] = useState('0')
  
  // Reported values for closing
  const [reportedValues, setReportedValues] = useState({
    reported_cash: '',
    reported_credit: '',
    reported_debit: '',
    reported_pix: '',
    reported_withdrawals: '',
    notes: ''
  })

  const [filterDates, setFilterDates] = useState({
    startDate: '',
    endDate: ''
  })

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedClosure, setSelectedClosure] = useState<any>(null)
  const [detailsOrders, setDetailsOrders] = useState<Order[]>([])
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)

  const openClosingModal = () => {
    if (!activeClosure) return
    setReportedValues({
      reported_cash: '',
      reported_credit: '',
      reported_debit: '',
      reported_pix: '',
      reported_withdrawals: '',
      notes: ''
    })
    setIsClosingOpen(true)
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Try to get active closure. If 404, it means closed, so just ignore error.
      const activeRes = await closuresApi.getActive().catch(() => ({ success: false, error: 'Request failed' } as any))
      
      if (activeRes.success && activeRes.data) {
        setActiveClosure(activeRes.data)
        const ordersRes = await ordersApi.getAll({ limit: 100 })
        if (ordersRes.success) {
          setSessionOrders(ordersRes.data.data.filter((o: any) => o.closure_id === activeRes.data.id))
        }
      } else {
        setActiveClosure(null)
      }
      
      const historyRes = await closuresApi.getAll(filterDates)
      if (historyRes.success) setHistory(historyRes.data)
    } catch (err) {
      console.error("LoadData Error:", err)
      setActiveClosure(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenBox = async () => {
    const val = parseFloat(initialBalance) / 100
    if (isNaN(val)) return toast.error('Valor inválido')
    
    try {
      const res = await closuresApi.open(val)
      if (res.success) {
        toast.success('Caixa aberto com sucesso')
        setIsOpeningOpen(false)
        setInitialBalance('0') // Reset
        loadData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir caixa')
    }
  }

  const handleCloseBox = async () => {
    try {
      const data = {
        reported_cash: reportedValues.reported_cash ? parseFloat(reportedValues.reported_cash) / 100 : undefined,
        reported_credit: reportedValues.reported_credit ? parseFloat(reportedValues.reported_credit) / 100 : undefined,
        reported_debit: reportedValues.reported_debit ? parseFloat(reportedValues.reported_debit) / 100 : undefined,
        reported_pix: reportedValues.reported_pix ? parseFloat(reportedValues.reported_pix) / 100 : undefined,
        withdrawals: reportedValues.reported_withdrawals ? parseFloat(reportedValues.reported_withdrawals) / 100 : 0,
        notes: reportedValues.notes
      }
      
      const res = await closuresApi.close(activeClosure.id, data)
      if (res.success) {
        toast.success('Caixa fechado com sucesso!')
        setIsClosingOpen(false)
        loadData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fechar caixa')
    }
  }

  const handlePrintOrder = (orderId: number) => {
    const token = localStorage.getItem('access_token')
    const url = `${API_URL}/api/orders/${orderId}/receipt?token=${token}`
    window.open(url, '_blank')
  }

  const handlePrintClosureReport = (closureId: number) => {
    const token = localStorage.getItem('access_token')
    const url = `${API_URL}/api/closures/${closureId}/report?token=${token}`
    window.open(url, '_blank')
  }

  const handleViewDetails = async (closure: any) => {
    setSelectedClosure(closure)
    setIsDetailsOpen(true)
    setIsDetailsLoading(true)
    try {
      const res = await ordersApi.getAll({ closureId: closure.id, limit: 100 })
      if (res.success) {
        setDetailsOrders(res.data.data)
      }
    } catch (err) {
      toast.error('Erro ao carregar pedidos do histórico')
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  const handleInputChange = (field: string, val: string) => {
    // Only allow numbers
    const clean = val.replace(/[^\d]/g, '')
    if (field === 'initial') {
        setInitialBalance(clean)
    } else {
        setReportedValues(prev => ({ ...prev, [field]: clean }))
    }
  }

  const getDisplayValue = (val: string) => {
    if (!val) return '0,00'
    const numeric = parseFloat(val) / 100
    return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fechamento de Caixa</h1>
          <p className="text-muted-foreground italic text-sm">Controle financeiro e conciliação bancária</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          {!activeClosure ? (
            <Button size="sm" onClick={() => setIsOpeningOpen(true)} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Abrir Caixa
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={openClosingModal}>
              <Lock className="h-4 w-4 mr-2" />
              Fechar Caixa
            </Button>
          )}
        </div>
      </div>

      {!activeClosure ? (
        <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                   <h3 className="text-lg font-bold">Caixa Fechado</h3>
                   <p className="text-muted-foreground max-w-xs mx-auto">Não há nenhuma sessão de caixa aberta no momento. Abra o caixa para começar a vender.</p>
                </div>
                <Button onClick={() => setIsOpeningOpen(true)}>
                    <Unlock className="h-4 w-4 mr-2" />
                    Abrir Nova Sessão
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Column */}
          <div className="md:col-span-1 space-y-6">
             <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-primary" />
                        Status da Sessão
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center bg-background p-3 rounded-lg border shadow-sm">
                        <span className="text-sm text-muted-foreground">Responsável</span>
                        <span className="font-bold text-sm">{activeClosure.user?.name || 'Administrador'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-background p-3 rounded-lg border shadow-sm">
                        <span className="text-sm text-muted-foreground">Aberto em</span>
                        <span className="font-bold text-sm">{formatDateTime(activeClosure.opening_time)}</span>
                    </div>
                    <div className="pt-4 border-t space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Saldo Inicial (Troco)</span>
                            <span className="font-bold">{formatCurrency(activeClosure.initial_balance)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold text-primary">
                            <span>Vendas Acumuladas</span>
                            <span>{formatCurrency(activeClosure.total_cash + activeClosure.total_credit + activeClosure.total_debit + activeClosure.total_pix)}</span>
                        </div>
                    </div>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Distribuição por Método</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: 'Dinheiro', val: activeClosure.total_cash, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
                        { label: 'Cartão Crédito', val: activeClosure.total_credit, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { label: 'Cartão Débito', val: activeClosure.total_debit, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' },
                        { label: 'Pix', val: activeClosure.total_pix, icon: Smartphone, color: 'text-teal-600', bg: 'bg-teal-100' },
                    ].map((m, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className={`${m.bg} ${m.color} p-2 rounded-lg transition-transform group-hover:scale-110`}>
                                    <m.icon className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium">{m.label}</span>
                            </div>
                            <span className="font-bold">{formatCurrency(m.val)}</span>
                        </div>
                    ))}
                </CardContent>
             </Card>
          </div>

          {/* Orders Column */}
          <div className="md:col-span-2 space-y-6">
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle>Vendas desta Sessão</CardTitle>
                        <CardDescription>Auditoria de pedidos vinculados ao caixa ativo</CardDescription>
                    </div>
                    <Badge variant="outline">{sessionOrders.length} Pedidos</Badge>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pedido</TableHead>
                                <TableHead>Hora</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessionOrders.map((o) => (
                                <TableRow key={o.id}>
                                    <TableCell className="font-bold">{o.code}</TableCell>
                                                    <TableCell className="text-xs">{formatTime(o.created_at)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] font-bold bg-muted/50 uppercase whitespace-nowrap">
                                            {getPaymentTypeLabel(o.payments)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-[10px] uppercase">{o.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(o.total)}</TableCell>
                                </TableRow>
                            ))}
                            {sessionOrders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma venda realizada nesta sessão</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Fechamentos
            </h2>
            <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-2 rounded-xl border border-dashed">
                <div className="flex items-center gap-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-2">De</Label>
                    <Input 
                        type="date" 
                        className="h-8 w-32 text-xs bg-background" 
                        value={filterDates.startDate}
                        onChange={(e) => setFilterDates({...filterDates, startDate: e.target.value})}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Até</Label>
                    <Input 
                        type="date" 
                        className="h-8 w-32 text-xs bg-background"
                        value={filterDates.endDate}
                        onChange={(e) => setFilterDates({...filterDates, endDate: e.target.value})}
                    />
                </div>
                <Button variant="secondary" size="sm" className="h-8 px-4" onClick={loadData}>Filtrar</Button>
            </div>
        </div>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Abertura</TableHead>
                            <TableHead>Fechamento</TableHead>
                            <TableHead>Resp.</TableHead>
                            <TableHead>Total Vendido</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.isArray(history) && history.length > 0 ? history.map((h) => (
                            <TableRow key={h.id}>
                                <TableCell className="text-xs">{formatDateTime(h.opening_time)}</TableCell>
                                <TableCell className="text-xs">{formatDateTime(h.closing_time)}</TableCell>
                                <TableCell>{h.user?.name || '---'}</TableCell>
                                <TableCell className="font-medium text-green-600">
                                    {formatCurrency(h.total_cash + h.total_credit + h.total_debit + h.total_pix)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={h.status === 'open' ? 'default' : 'secondary'}>
                                        {h.status === 'open' ? 'Aberto' : 'Fechado'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-[10px] font-bold gap-1"
                                        onClick={() => handleViewDetails(h)}
                                    >
                                        <Eye className="h-3 w-3" />
                                        DETALHES
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                                    Nenhum histórico de fechamento encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      {/* Opening Dialog */}
      <Dialog open={isOpeningOpen} onOpenChange={setIsOpeningOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Abrir Caixa</DialogTitle>
                <CardDescription>Informe o saldo inicial em dinheiro para troco.</CardDescription>
            </DialogHeader>
            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <Label>Saldo Inicial</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                        <Input 
                            type="text" 
                            inputMode="numeric"
                            value={getDisplayValue(initialBalance)} 
                            onChange={(e) => handleInputChange('initial', e.target.value)}
                            className="text-lg font-bold pl-10"
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpeningOpen(false)}>Cancelar</Button>
                <Button onClick={handleOpenBox}>Confirmar e Abrir</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Closing Dialog */}
      <Dialog open={isClosingOpen} onOpenChange={setIsClosingOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-primary/5 p-6 pr-16 border-b flex justify-between items-center">
                <DialogHeader className="p-0 space-y-1">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                        <LockIcon className="h-5 w-5" />
                        Fechamento de Caixa
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Total Conciliado</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">
                        {formatCurrency(
                            (parseFloat(reportedValues.reported_cash || '0') + 
                             parseFloat(reportedValues.reported_withdrawals || '0') +
                             parseFloat(reportedValues.reported_pix || '0') + 
                             parseFloat(reportedValues.reported_credit || '0') + 
                             parseFloat(reportedValues.reported_debit || '0')) / 100
                        )}
                    </span>
                </div>
            </div>
            
            <div className="p-6 space-y-6 bg-background">
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-xl">
                                <Banknote className="h-4 w-4 text-green-600" />
                            </div>
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Dinheiro em Caixa</Label>
                        </div>
                        <div className="space-y-1.5">
                            <div className="relative group">
                                <span className="absolute left-3.5 top-0 bottom-0 flex items-center text-xs font-bold text-muted-foreground/40">R$</span>
                                <Input 
                                    type="text"
                                    inputMode="numeric"
                                    value={getDisplayValue(reportedValues.reported_cash)}
                                    onChange={(e) => handleInputChange('reported_cash', e.target.value)}
                                    className="pl-10 h-11 text-base font-bold border-2 focus-visible:ring-0 focus-visible:border-primary bg-muted/5 transition-all rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-xl">
                                <DollarSign className="h-4 w-4 text-red-600" />
                            </div>
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Retirada (Sangria)</Label>
                        </div>
                        <div className="relative group">
                            <span className="absolute left-3.5 top-0 bottom-0 flex items-center text-xs font-bold text-muted-foreground/40">R$</span>
                            <Input 
                                type="text"
                                inputMode="numeric"
                                value={getDisplayValue(reportedValues.reported_withdrawals)}
                                onChange={(e) => handleInputChange('reported_withdrawals', e.target.value)}
                                className="pl-10 h-11 text-base font-bold border-2 focus-visible:ring-0 focus-visible:border-primary bg-muted/5 transition-all rounded-xl border-red-100/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <QrCode className="h-4 w-4 text-blue-600" />
                            </div>
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Pix</Label>
                        </div>
                        <div className="relative group">
                            <span className="absolute left-3.5 top-0 bottom-0 flex items-center text-xs font-bold text-muted-foreground/40">R$</span>
                            <Input 
                                type="text"
                                inputMode="numeric"
                                value={getDisplayValue(reportedValues.reported_pix)}
                                onChange={(e) => handleInputChange('reported_pix', e.target.value)}
                                className="pl-10 h-11 text-base font-bold border-2 focus-visible:ring-0 focus-visible:border-primary bg-muted/5 transition-all rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <CreditCard className="h-4 w-4 text-purple-600" />
                            </div>
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">C. Crédito</Label>
                        </div>
                        <div className="relative group">
                            <span className="absolute left-3.5 top-0 bottom-0 flex items-center text-xs font-bold text-muted-foreground/40">R$</span>
                            <Input 
                                type="text"
                                inputMode="numeric"
                                value={getDisplayValue(reportedValues.reported_credit)}
                                onChange={(e) => handleInputChange('reported_credit', e.target.value)}
                                className="pl-10 h-11 text-base font-bold border-2 focus-visible:ring-0 focus-visible:border-primary bg-muted/5 transition-all rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                <CreditCard className="h-4 w-4 text-indigo-600" />
                            </div>
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">C. Débito</Label>
                        </div>
                        <div className="relative group">
                            <span className="absolute left-3.5 top-0 bottom-0 flex items-center text-xs font-bold text-muted-foreground/40">R$</span>
                            <Input 
                                type="text"
                                inputMode="numeric"
                                value={getDisplayValue(reportedValues.reported_debit)}
                                onChange={(e) => handleInputChange('reported_debit', e.target.value)}
                                className="pl-10 h-11 text-base font-bold border-2 focus-visible:ring-0 focus-visible:border-primary bg-muted/5 transition-all rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                            <MessageSquare className="h-3 w-3 text-muted-foreground/60" />
                            Observações do Dia
                        </Label>
                        <Input 
                            placeholder="Alguma divergência? Informe aqui..."
                            value={reportedValues.notes}
                            onChange={(e) => setReportedValues({...reportedValues, notes: e.target.value})}
                            className="h-11 border-2 focus-visible:ring-0 focus-visible:border-primary bg-muted/5 rounded-xl text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 bg-muted/30 border-t flex flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-3 text-xs text-amber-800 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 max-w-md">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <p className="leading-tight font-medium opacity-90">
                        O caixa será bloqueado e os totais consolidados. <strong>Operação definitiva.</strong>
                    </p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <Button variant="ghost" onClick={() => setIsClosingOpen(false)} className="h-10 font-black tracking-widest text-[10px]">CANCELAR</Button>
                    <Button variant="destructive" onClick={handleCloseBox} className="h-10 px-6 font-black tracking-widest text-[10px] shadow-lg shadow-destructive/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl">
                        FINALIZAR FECHAMENTO
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl [&>[data-slot=dialog-close]]:text-white">
            {selectedClosure && (
                <div className="flex flex-col">
                    <div className="bg-primary p-8 text-primary-foreground">
                        <DialogHeader>
                            <div className="flex justify-between items-start pr-16">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <DialogTitle className="text-2xl font-black">Histórico de Caixa #{selectedClosure.id}</DialogTitle>
                                        <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] uppercase font-black px-2 py-0.5">
                                            {selectedClosure.status === 'open' ? 'Aberto' : 'Encerrado'}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-primary-foreground/70 font-medium">
                                        Período: {formatDateTime(selectedClosure.opening_time)} até {formatDateTime(selectedClosure.closing_time)}
                                    </CardDescription>
                                </div>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="bg-white text-primary hover:bg-white/90 font-black text-[10px] tracking-widest gap-2"
                                    onClick={() => handlePrintClosureReport(selectedClosure.id)}
                                >
                                    <Printer className="h-4 w-4" />
                                    IMPRIMIR RELATÓRIO
                                </Button>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Financial Summary */}
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Dinheiro', sys: selectedClosure.total_cash, rep: selectedClosure.reported_cash, icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
                                { label: 'Pix', sys: selectedClosure.total_pix, rep: selectedClosure.reported_pix, icon: QrCode, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Crédito', sys: selectedClosure.total_credit, rep: selectedClosure.reported_credit, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { label: 'Débito', sys: selectedClosure.total_debit, rep: selectedClosure.reported_debit, icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            ].map((m, i) => (
                                <div key={i} className={`${m.bg} p-4 rounded-2xl border border-black/5 space-y-2`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <m.icon className={`h-3 w-3 ${m.color}`} />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{m.label}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase">Sistema</span>
                                        <span className="text-base font-bold text-foreground">{formatCurrency(m.sys)}</span>
                                    </div>
                                    {m.rep !== null && (
                                        <div className="flex flex-col border-t border-black/5 pt-2">
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase">Informado</span>
                                            <span className="text-base font-bold text-primary">{formatCurrency(m.rep)}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {selectedClosure.difference !== null && (
                             <div className={`p-4 rounded-2xl border flex items-center justify-between ${selectedClosure.difference === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedClosure.difference === 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                        <Calculator className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Diferença de Caixa</p>
                                        <p className={`text-xl font-black ${selectedClosure.difference === 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {formatCurrency(selectedClosure.difference)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Responsável</p>
                                    <p className="font-bold text-sm">{selectedClosure.user?.name}</p>
                                </div>
                             </div>
                        )}

                        {selectedClosure.notes && (
                            <div className="bg-muted/30 p-4 rounded-2xl border border-dashed text-sm italic text-muted-foreground flex gap-3">
                                <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                                "{selectedClosure.notes}"
                            </div>
                        )}

                        {/* Orders List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Pedidos do Turno
                            </h3>
                            <div className="border rounded-2xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-8"></TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Pedido</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Hora</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Atendente</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Tipo</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isDetailsLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8">Carregando auditoria...</TableCell>
                                            </TableRow>
                                        ) : detailsOrders.map((o) => (
                                            <React.Fragment key={o.id}>
                                                <TableRow 
                                                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                                                    onClick={() => toggleOrderExpansion(o.id)}
                                                >
                                                    <TableCell>
                                                        {expandedOrderId === o.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                    </TableCell>
                                                    <TableCell className="font-bold">{o.code}</TableCell>
                                                    <TableCell className="text-xs">{formatTime(o.created_at)}</TableCell>
                                                    <TableCell className="text-xs font-medium text-muted-foreground">
                                                        {o.user?.name || '---'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase">
                                                            {getPaymentTypeLabel(o.payments)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {formatCurrency(o.total)}
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePrintOrder(o.id);
                                                                }}
                                                            >
                                                                <Printer className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {expandedOrderId === o.id && (
                                                    <TableRow className="bg-primary/5 border-l-4 border-l-primary shadow-inner">
                                                        <TableCell colSpan={6} className="p-6">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                                        <Plus className="h-3 w-3" />
                                                                        ITENS DO PEDIDO
                                                                    </h4>
                                                                    <Badge variant="outline" className="text-[9px] font-bold px-2 py-0 border-primary/20 text-primary">
                                                                        {o.items?.length || 0} produtos
                                                                    </Badge>
                                                                </div>
                                                                <div className="grid gap-2">
                                                                    {o.items?.map((item, idx) => (
                                                                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-black/5">
                                                                            <div className="flex gap-3 items-center">
                                                                                <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center font-black">
                                                                                    {item.quantity}
                                                                                </Badge>
                                                                                <div>
                                                                                    <p className="font-bold">{item.product?.name}</p>
                                                                                    {item.notes && <p className="text-[10px] text-muted-foreground italic">"{item.notes}"</p>}
                                                                                </div>
                                                                            </div>
                                                                            <span className="font-black text-muted-foreground">
                                                                                {formatCurrency(item.unit_price * item.quantity)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {(!o.items || o.items.length === 0) && (
                                                                        <p className="text-[10px] text-muted-foreground italic pl-2">Nenhum item registrado para este pedido.</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex justify-between items-center pt-2 border-t border-black/5 px-2">
                                                                    <span className="text-[10px] font-black uppercase text-muted-foreground italic">OBS: {o.notes || 'Sem observações'}</span>
                                                                    <div className="text-right">
                                                                        <span className="text-[10px] font-black uppercase text-muted-foreground block">MÉTODO</span>
                                                                        <span className="text-xs font-bold text-primary">{getPaymentTypeLabel(o.payments)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        {detailsOrders.length === 0 && !isDetailsLoading && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">Nenhum pedido encontrado nesta sessão.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t bg-muted/20 flex justify-end">
                        <Button onClick={() => setIsDetailsOpen(false)} className="px-8 font-black tracking-widest text-[10px]">FECHAR AUDITORIA</Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
