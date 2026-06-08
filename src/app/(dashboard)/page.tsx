"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';

import { useOrderStore } from '@/stores/orderStore'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Plus, Flame, CheckCircle, Lock, Unlock, History, Wallet, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { closuresApi, reportsApi } from '@/api/client'
import { toast } from 'sonner'
import { formatTime, formatDateTime } from '@/lib/date'
import type { SalesSummary } from '@/types'
import { SalesCharts } from '@/components/dashboard/SalesCharts'
import { PrivacyMask } from '@/components/ui/privacy-mask'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAdmin, isCashier, isUnmasked, toggleUnmask } = useAuth()
  const { orders, fetchOrders } = useOrderStore()
  const [activeClosure, setActiveClosure] = useState<any>(null)
  const [recentClosures, setRecentClosures] = useState<any[]>([])
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await closuresApi.getActive()
        if (res.success && res.data) {
          setActiveClosure(res.data)
        } else {
          setActiveClosure(null)
        }
      } catch (err) {
        toast.error("Erro ao verificar estado do caixa")
        setActiveClosure(null)
      }
      
      try {
        const closuresRes = await closuresApi.getAll()
        if (closuresRes.success && Array.isArray(closuresRes.data)) {
          setRecentClosures(closuresRes.data.slice(0, 5))
        }
      } catch (err) {
        // Silent fail for recent closures in bg
      }

      if (isAdmin) {
        try {
          const reportsRes = await reportsApi.getSalesSummary()
          if (reportsRes.success) {
            setSalesSummary(reportsRes.data)
          }
        } catch (err) {
          console.error("Dashboard Reports Error:", err)
        }
      }

      // Reset orders to see recent ones
      fetchOrders()
    }

    loadData()
  }, [fetchOrders])

  // Stats for the current UI
  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
  const pending = activeOrders.filter((o) => o.status === 'pending').length
  const preparing = activeOrders.filter((o) => o.status === 'preparing').length
  const ready = activeOrders.filter((o) => o.status === 'ready').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo, {user?.name}</p>
        </div>
        {(isAdmin || isCashier) && (
          <Button onClick={() => router.push('/new-order')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        )}
      </div>

      {/* Session Status Banner */}
      <Card className={`border-none shadow-md overflow-hidden ${activeClosure ? 'bg-primary/5' : 'bg-muted/30'}`}>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${activeClosure ? 'bg-primary text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                {activeClosure ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Caixa {activeClosure ? 'Aberto' : 'Fechado'}</h2>
                  {activeClosure && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Ativo</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeClosure 
                    ? `Sessão iniciada às ${formatTime(activeClosure.opening_time)}`
                    : 'Aguardando abertura de novo turno para iniciar as vendas'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {activeClosure ? (
                <div className="flex flex-col items-end">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Faturamento Atual</p>
                  <PrivacyMask isUnmasked={isUnmasked}>
                    <p className="text-2xl font-black text-primary">
                      {formatCurrency(
                        (activeClosure?.total_cash || 0) + 
                        (activeClosure?.total_credit || 0) + 
                        (activeClosure?.total_debit || 0) + 
                        (activeClosure?.total_pix || 0)
                      )}
                    </p>
                  </PrivacyMask>
                </div>
              ) : (
                <Button size="lg" className="font-bold tracking-tight gap-2" onClick={() => router.push('/closures')}>
                  ABRIR CAIXA
                  <Unlock className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando início</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Preparo</CardTitle>
            <Flame className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preparing}</div>
            <p className="text-xs text-muted-foreground">Na cozinha</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ready}</div>
            <p className="text-xs text-muted-foreground">Para entrega/retirada</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Histórico</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <PrivacyMask isUnmasked={isUnmasked}>
              <div className="text-2xl font-bold">{salesSummary ? formatCurrency(salesSummary.total_sales) : '--'}</div>
            </PrivacyMask>
            <p className="text-xs text-muted-foreground">{salesSummary?.order_count || 0} pedidos totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Section */}
      {salesSummary && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Análise de Desempenho
          </h2>
          <SalesCharts 
            byCategory={salesSummary.by_category} 
            byPayment={salesSummary.by_payment} 
            isUnmasked={isUnmasked}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-xl">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Sessões Recentes</CardTitle>
                <CardDescription>Últimos 5 fechamentos de caixa</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold" onClick={() => router.push('/closures')}> Ver histórico</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentClosures.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhuma sessão encontrada.</div>
              ) : (
                recentClosures.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push('/closures')}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${c.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {c.status === 'open' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">Caixa #{c.id} - {c.user?.name || 'Dev Admin'}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {formatDateTime(c.opening_time)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <PrivacyMask isUnmasked={isUnmasked}>
                        <p className="font-bold text-sm tracking-tight">
                          {formatCurrency(
                            (c?.total_cash || 0) + 
                            (c?.total_credit || 0) + 
                            (c?.total_debit || 0) + 
                            (c?.total_pix || 0)
                          )}
                        </p>
                      </PrivacyMask>
                      <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter ${c.status === 'open' ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-700 bg-gray-50'}`}>
                        {c.status === 'open' ? 'Aberto' : 'Fechado'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
             <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-xl">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Resumo Financeiro (Sessão)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="space-y-4">
               <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <span className="text-sm font-medium">Dinheiro</span>
                 </div>
                 <PrivacyMask isUnmasked={isUnmasked}>
                    <span className="font-bold">{formatCurrency(activeClosure?.total_cash || 0)}</span>
                  </PrivacyMask>
               </div>
               <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-sm font-medium">Pix</span>
                 </div>
                 <PrivacyMask isUnmasked={isUnmasked}>
                    <span className="font-bold">{formatCurrency(activeClosure?.total_pix || 0)}</span>
                  </PrivacyMask>
               </div>
               <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-amber-500" />
                   <span className="text-sm font-medium">Cartão</span>
                 </div>
                 <PrivacyMask isUnmasked={isUnmasked}>
                    <span className="font-bold">{formatCurrency((activeClosure?.total_credit || 0) + (activeClosure?.total_debit || 0))}</span>
                  </PrivacyMask>
               </div>
               <div className="pt-4 border-t mt-4 flex justify-between items-center">
                 <span className="text-lg font-black uppercase tracking-tighter">Total Geral</span>
                 <PrivacyMask isUnmasked={isUnmasked}>
                    <span className="text-xl font-black text-primary">
                        {formatCurrency(
                          (activeClosure?.total_cash || 0) + 
                          (activeClosure?.total_pix || 0) + 
                          (activeClosure?.total_credit || 0) + 
                          (activeClosure?.total_debit || 0)
                        )}
                    </span>
                  </PrivacyMask>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
