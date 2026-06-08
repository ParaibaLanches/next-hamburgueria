"use client";

import { useEffect, useState } from 'react'
import { couponsApi, settingsApi } from '@/api/client'
import type { Coupon, CreateCouponRequest, DistributeRequest, Client, CouponDistributionResponse, CouponDistributionRecipient } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Loader2, Ticket, Gift, Calendar, Infinity, X, Trash, Eye, Users } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime, toLocalISO } from '@/lib/date'
import { formatCurrency } from '@/lib/utils'
import CouponList from '@/components/coupons/CouponList'
import CouponDetailsDialog from '@/components/coupons/CouponDetailsDialog'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [distributeOpen, setDistributeOpen] = useState(false)

  const [validityMode, setValidityMode] = useState<'period' | 'fixed'>('period')
  const [distributeValidityMode, setDistributeValidityMode] = useState<'period' | 'fixed'>('period')
  const [distributeSourceMode, setDistributeSourceMode] = useState<'manual' | 'template'>('manual')
  const [distributions, setDistributions] = useState<CouponDistributionResponse[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false)

  // Detalhes / Clientes
  const [selectedCouponDetails, setSelectedCouponDetails] = useState<any>(null)
  const [selectedDistributionRecipients, setSelectedDistributionRecipients] = useState<CouponDistributionRecipient[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const [form, setForm] = useState<CreateCouponRequest>({
    code: '',
    type: 'percentage',
    value: 0,
    min_purchase: 0,
    usage_limit: 0,
    months: 1,
    starts_at: undefined,
    expires_at: undefined,
    client_id: undefined
  })

  const [distributeForm, setDistributeForm] = useState<DistributeRequest>({
    name: '',
    template_id: undefined,
    type: 'percentage',
    value: 0,
    min_purchase: 0,
    audience: 'random',
    quantity: 1,
    months: 1,
    starts_at: undefined,
    expires_at: undefined
  })

  // Welcome Coupon Settings
  const [welcomeSettings, setWelcomeSettings] = useState({
    enabled: false,
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    min_purchase: 0,
    months: 1
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const [clientSearch, setClientSearch] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isSearchingClient, setIsSearchingClient] = useState(false)
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  const fetchCoupons = async () => {
    setIsLoading(true)
    try {
      const res = await couponsApi.getAll()
      if (res.success && res.data) {
        setCoupons(res.data)
      }
    } catch {
      toast.error('Erro ao carregar cupons')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await settingsApi.getAll()
      if (res.success && res.data) {
        setWelcomeSettings({
          enabled: res.data.welcome_coupon_enabled === 'true',
          type: (res.data.welcome_coupon_type as any) || 'percentage',
          value: parseFloat(res.data.welcome_coupon_value) || 10,
          min_purchase: parseFloat(res.data.welcome_coupon_min_purchase) || 0,
          months: parseInt(res.data.welcome_coupon_months) || 1
        })
      }
    } catch {
      console.error('Erro ao carregar configurações de cupons')
    }
  }

  const fetchHistory = async () => {
    try {
      const data = await couponsApi.getDistributions()
      if (data) setDistributions(data)
    } catch {
      console.error('Erro ao carregar histórico de distribuições')
    }
  }

  const fetchCouponDetails = async (id: number) => {
    try {
      setIsLoadingDetails(true)
      setSelectedCouponDetails(null)
      setDetailsDialogOpen(true)
      const data = await couponsApi.getDetails(id)
      if (data.success) {
        setSelectedCouponDetails(data.data)
      }
    } catch {
      toast.error('Erro ao carregar detalhes do cupom')
      setDetailsDialogOpen(false)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const fetchDistributionRecipients = async (id: number) => {
    try {
      setIsLoadingDetails(true)
      setSelectedDistributionRecipients([])
      setRecipientsDialogOpen(true)
      const data = await couponsApi.getDistributionRecipients(id)
      if (data.success) {
        setSelectedDistributionRecipients(data.data)
      }
    } catch {
      toast.error('Erro ao carregar destinatários')
      setRecipientsDialogOpen(false)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
    fetchSettings()
    fetchHistory()
  }, [])

  // Busca de clientes para atribuição individual
  useEffect(() => {
    if (clientSearch.length < 2) {
      setClients([])
      return
    }
    setIsSearchingClient(true)
    const delay = setTimeout(async () => {
      try {
        const { clientsApi } = await import('@/api/client')
        const res = await clientsApi.search(clientSearch)
        if (res.success && res.data) setClients(res.data)
      } finally {
        setIsSearchingClient(false)
      }
    }, 400)
    return () => clearTimeout(delay)
  }, [clientSearch])

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!form.code || form.value <= 0) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    try {
      const payload = { ...form }
      if (validityMode === 'fixed') {
        payload.months = 0 // Ignore months
      } else {
        payload.starts_at = form.starts_at || new Date().toISOString()
        payload.expires_at = undefined // Calculate from months on backend
      }

      const res = await couponsApi.create({
        ...payload,
        client_id: selectedClient?.id
      })
      if (res.success) {
        toast.success('Cupom criado com sucesso')
        setDialogOpen(false)
        fetchCoupons()
        setForm({
          code: '',
          type: 'percentage',
          value: 0,
          min_purchase: 0,
          usage_limit: 0,
          months: 1,
          starts_at: undefined,
          expires_at: undefined,
          client_id: undefined
        })
        setSelectedClient(null)
      }
    } catch (error: any) {
      const msg = error?.message || 'Erro desconhecido'
      toast.error(`Erro ao criar cupom: ${msg}`)
    }
  }
  const handleDistribute = async () => {
    if (distributeSourceMode === 'manual' && (distributeForm.value || 0) <= 0) {
      toast.error('O valor deve ser maior que zero')
      return
    }

    if (distributeSourceMode === 'template' && !distributeForm.template_id) {
      toast.error('Selecione um cupom base')
      return
    }

    if (distributeForm.audience === 'random' && (distributeForm.quantity || 0) <= 0) {
      toast.error('A quantidade deve ser maior que zero para sorteio')
      return
    }

    try {
      const payload = { ...distributeForm }
      if (distributeValidityMode === 'fixed') {
        payload.months = 0
      } else {
        payload.starts_at = distributeForm.starts_at || new Date().toISOString()
        payload.expires_at = undefined
      }

      const res = await couponsApi.distribute(payload)
      if (res.success) {
        toast.success(distributeForm.audience === 'all' ? 'Cupons gerados para todos os clientes!' : 'Cupons distribuídos com sucesso')
        setDistributeOpen(false)
        fetchCoupons()
        fetchHistory()
      }
    } catch {
      toast.error('Erro ao distribuir cupons')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cupom? Ele ficará indisponível para uso.')) {
      return
    }
    try {
      const res = await couponsApi.delete(id)
      if (res.success) {
        toast.success('Cupom excluído com sucesso')
        fetchCoupons()
      }
    } catch (error: any) {
      toast.error(`Erro ao excluir: ${error?.message || 'Erro desconhecido'}`)
    }
  }

  const handleSaveWelcomeSettings = async () => {
    setIsSavingSettings(true)
    try {
      await Promise.all([
        settingsApi.update('welcome_coupon_enabled', welcomeSettings.enabled ? 'true' : 'false'),
        settingsApi.update('welcome_coupon_type', welcomeSettings.type),
        settingsApi.update('welcome_coupon_value', welcomeSettings.value.toString()),
        settingsApi.update('welcome_coupon_min_purchase', welcomeSettings.min_purchase.toString()),
        settingsApi.update('welcome_coupon_months', welcomeSettings.months.toString())
      ])
      toast.success('Configurações de automação atualizadas')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSavingSettings(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupons Promocionais</h1>
          <p className="text-muted-foreground">Gerencie descontos e ofertas para seus clientes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={distributeOpen} onOpenChange={setDistributeOpen}>
            <DialogTrigger render={(props) => (
              <Button {...props} variant="outline" className="font-bold">
                <Gift className="h-4 w-4 mr-2" />
                Distribuir Cupons
              </Button>
            )} />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Distribuição de Cupons Privados</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome da Campanha (Opcional)</Label>
                  <Input 
                    placeholder="Ex: Mimo de Sexta" 
                    value={distributeForm.name}
                    onChange={(e) => setDistributeForm({ ...distributeForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Modo de Origem</Label>
                  <Select 
                    value={distributeSourceMode} 
                    onValueChange={(v: any) => setDistributeSourceMode(v)}
                  >
                    <SelectTrigger>
                      <span className="text-sm">
                        {distributeSourceMode === 'manual' ? 'Configuração Manual' : 'Usar Cupom Existente'}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Configuração Manual</SelectItem>
                      <SelectItem value="template">Usar Cupom Existente (Base)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {distributeSourceMode === 'template' ? (
                  <div className="space-y-2">
                    <Label>Selecionar Cupom Base</Label>
                    <Select 
                      value={distributeForm.template_id?.toString()} 
                      onValueChange={(v: any) => setDistributeForm({ ...distributeForm, template_id: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <span className="text-sm">
                          {distributeForm.template_id ? coupons.find(c => c.id === distributeForm.template_id)?.code : 'Selecione um cupom...'}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {coupons.filter(c => !c.client_id).map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.code} ({c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground italic">Copia o valor, tipo e regra de compra mínima do cupom selecionado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select 
                        value={distributeForm.type} 
                        onValueChange={(v: any) => setDistributeForm({ ...distributeForm, type: v as any })}
                      >
                        <SelectTrigger>
                          <span className="text-sm">
                            {distributeForm.type === 'percentage' ? 'Percentual (%)' : 'Fixo (R$)'}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentual (%)</SelectItem>
                          <SelectItem value="fixed">Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor {distributeForm.type === 'percentage' ? '(%)' : '(R$)'}</Label>
                      <Input 
                        type="number" 
                        placeholder="Ex: 10"
                        value={distributeForm.value || ''} 
                        onChange={(e) => setDistributeForm({ ...distributeForm, value: parseFloat(e.target.value) })} 
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Público Alvo</Label>
                  <Select 
                    value={distributeForm.audience} 
                    onValueChange={(v: any) => setDistributeForm({ ...distributeForm, audience: v as any })}
                  >
                    <SelectTrigger>
                      <span className="text-sm">
                        {distributeForm.audience === 'all' ? 'Todos os Clientes Ativos' : 'Sorteio Aleatório'}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Sorteio Aleatório</SelectItem>
                      <SelectItem value="all">Todos os Clientes Ativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {distributeForm.audience === 'random' && (
                  <div className="space-y-2">
                    <Label>Quantidade de Clientes</Label>
                    <Input 
                      type="number" 
                      placeholder="Ex: 5"
                      value={distributeForm.quantity || ''} 
                      onChange={(e) => setDistributeForm({ ...distributeForm, quantity: parseInt(e.target.value) })} 
                    />
                  </div>
                )}
                <div className="space-y-4 py-2 border-y border-dashed">
                  <div className="space-y-2">
                    <Label>Modo de Validade</Label>
                    <Select value={distributeValidityMode} onValueChange={(v: any) => setDistributeValidityMode(v)}>
                      <SelectTrigger>
                        <span className="text-sm">{distributeValidityMode === 'period' ? 'Período (Meses)' : 'Datas Fixas'}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="period">Período (Meses)</SelectItem>
                        <SelectItem value="fixed">Datas Fixas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {distributeValidityMode === 'period' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Início (Opcional)</Label>
                        <Input 
                          type="datetime-local" 
                          value={toLocalISO(distributeForm.starts_at)} 
                          onChange={(e) => setDistributeForm({ ...distributeForm, starts_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração (Meses)</Label>
                        <Input 
                          type="number" 
                          value={distributeForm.months || ''} 
                          onChange={(e) => setDistributeForm({ ...distributeForm, months: parseInt(e.target.value) })} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Início</Label>
                        <Input 
                          type="datetime-local" 
                          value={toLocalISO(distributeForm.starts_at)} 
                          onChange={(e) => setDistributeForm({ ...distributeForm, starts_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fim</Label>
                        <Input 
                          type="datetime-local" 
                          value={toLocalISO(distributeForm.expires_at)} 
                          onChange={(e) => setDistributeForm({ ...distributeForm, expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button className="w-full font-bold h-11" onClick={handleDistribute}>
                  Distribuir Agora
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={(props) => (
              <Button {...props} className="font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cupom
              </Button>
            )} />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Código do Cupom (Max 6 letras)</Label>
                  <Input 
                    placeholder="EX: VERÃO" 
                    maxLength={6}
                    value={form.code} 
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                  />
                  <p className="text-[10px] text-muted-foreground uppercase">Dica: Use palavras curtas e chamativas</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select 
                      value={form.type} 
                      onValueChange={(v: any) => setForm({ ...form, type: v })}
                    >
                      <SelectTrigger>
                        <span className="text-sm">
                          {form.type === 'percentage' ? 'Percentual (%)' : 'Fixo (R$)'}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input 
                      type="number" 
                      placeholder="Ex: 10"
                      value={form.value || ''} 
                      onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Compra Mínima (R$)</Label>
                    <Input 
                      type="number" 
                      placeholder="Ex: 50.00"
                      value={form.min_purchase || ''} 
                      onChange={(e) => setForm({ ...form, min_purchase: parseFloat(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite de Usos (0=∞)</Label>
                    <Input 
                      type="number" 
                      placeholder="Ex: 100"
                      value={form.usage_limit} 
                      onChange={(e) => setForm({ ...form, usage_limit: parseInt(e.target.value) || 0 })} 
                    />
                  </div>
                </div>

                <div className="space-y-4 py-2 border-y border-dashed">
                  <div className="space-y-2">
                    <Label>Modo de Validade</Label>
                    <Select value={validityMode} onValueChange={(v: any) => setValidityMode(v)}>
                      <SelectTrigger>
                        <span className="text-sm">{validityMode === 'period' ? 'Período (Meses)' : 'Datas Fixas'}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="period">Período (Meses)</SelectItem>
                        <SelectItem value="fixed">Datas Fixas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {validityMode === 'period' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Início (Opcional)</Label>
                        <Input 
                          type="datetime-local" 
                          value={toLocalISO(form.starts_at)} 
                          onChange={(e) => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração (Meses)</Label>
                        <Select 
                          value={form.months.toString()} 
                          onValueChange={(v) => setForm({ ...form, months: parseInt(v || '1') })}
                        >
                          <SelectTrigger>
                            <span className="text-sm">
                              {form.months === 1 ? '1 Mês' : 
                               form.months === 2 ? '2 Meses' :
                               form.months === 3 ? '3 Meses' :
                               form.months === 6 ? '6 Meses' : '1 Ano'}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Mês</SelectItem>
                            <SelectItem value="2">2 Meses</SelectItem>
                            <SelectItem value="3">3 Meses</SelectItem>
                            <SelectItem value="6">6 Meses</SelectItem>
                            <SelectItem value="12">1 Ano</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Início</Label>
                        <Input 
                          type="datetime-local" 
                          value={toLocalISO(form.starts_at)} 
                          onChange={(e) => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fim</Label>
                        <Input 
                          type="datetime-local" 
                          value={toLocalISO(form.expires_at)} 
                          onChange={(e) => setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 relative">
                  <Label>Atribuir a Cliente (Opcional)</Label>
                  {selectedClient ? (
                    <div className="flex items-center justify-between p-2 border rounded-md bg-primary/5 border-primary/20 animate-in fade-in zoom-in-95">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{selectedClient.name}</span>
                        <span className="text-[10px] text-muted-foreground">{selectedClient.email}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedClient(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input 
                        placeholder="Buscar cliente por nome ou CPF..." 
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value)
                          setShowClientDropdown(true)
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        className="h-9"
                      />
                      {isSearchingClient && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      
                      {showClientDropdown && clientSearch.length >= 2 && (
                        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg overflow-hidden">
                          <div className="max-h-40 overflow-y-auto">
                            {clients.length > 0 ? clients.map(c => (
                              <div 
                                key={c.id} 
                                className="px-3 py-2 text-sm hover:bg-muted cursor-pointer transition-colors border-b last:border-0"
                                onClick={() => {
                                  setSelectedClient(c)
                                  setShowClientDropdown(false)
                                  setClientSearch('')
                                }}
                              >
                                <p className="font-medium">{c.name}</p>
                                <p className="text-[10px] text-muted-foreground">{c.email || c.document}</p>
                              </div>
                            )) : !isSearchingClient && (
                              <div className="px-3 py-4 text-xs text-center text-muted-foreground italic">
                                Nenhum cliente encontrado
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-[9px] text-muted-foreground italic uppercase">Se selecionado, apenas este cliente poderá usar o cupom.</p>
                </div>

                <Button className="w-full font-bold h-11" onClick={handleCreate}>
                  Salvar Cupom
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por código..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-9" 
              />
            </div>
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <DialogTrigger render={(props) => (
                <Button {...props} variant="ghost" className="text-xs text-muted-foreground ml-2">
                  Histórico de Envios
                </Button>
              )} />
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Histórico de Distribuições de Cupons</DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Público</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Usados</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {distributions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">Nenhuma distribuição realizada ainda.</TableCell>
                        </TableRow>
                      ) : distributions.map(d => (
                        <TableRow key={d.id}>
                          <TableCell className="font-bold">{d.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{d.audience === 'all' ? 'Todos' : 'Sorteio'}</Badge>
                          </TableCell>
                          <TableCell>{d.quantity}</TableCell>
                          <TableCell>{d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}</TableCell>
                          <TableCell>
                            <span className="font-bold text-primary">{d.used_count}</span>
                            <span className="text-muted-foreground"> / {d.quantity}</span>
                          </TableCell>
                          <TableCell className="text-[10px]">{formatDateTime(d.created_at)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => fetchDistributionRecipients(d.id)}
                              title="Ver destinatários"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <CouponList 
            coupons={filtered}
            isLoading={isLoading}
            onDelete={handleDelete}
            onViewDetails={fetchCouponDetails}
          />
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 shadow-sm overflow-hidden">
            <div className="bg-primary/5 px-4 py-3 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">Cupom de Boas-vindas</h3>
              </div>
              <Badge variant={welcomeSettings.enabled ? 'default' : 'secondary'} className="scale-75 origin-right">
                {welcomeSettings.enabled ? 'Ligado' : 'Desligado'}
              </Badge>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Ativar para Novos Usuários</Label>
                <div 
                  className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative ${welcomeSettings.enabled ? 'bg-primary' : 'bg-muted'}`}
                  onClick={() => setWelcomeSettings({ ...welcomeSettings, enabled: !welcomeSettings.enabled })}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${welcomeSettings.enabled ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</Label>
                  <Select 
                    value={welcomeSettings.type} 
                    onValueChange={(v: any) => setWelcomeSettings({ ...welcomeSettings, type: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <span className="truncate">
                        {welcomeSettings.type === 'percentage' ? 'Percentual (%)' : 'Fixo (R$)'}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Valor</Label>
                  <Input 
                    type="number" 
                    className="h-8 text-xs" 
                    value={welcomeSettings.value} 
                    onChange={(e) => setWelcomeSettings({ ...welcomeSettings, value: parseFloat(e.target.value) })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Mínimo (R$)</Label>
                  <Input 
                    type="number" 
                    className="h-8 text-xs" 
                    value={welcomeSettings.min_purchase} 
                    onChange={(e) => setWelcomeSettings({ ...welcomeSettings, min_purchase: parseFloat(e.target.value) })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Validade</Label>
                  <Select 
                    value={welcomeSettings.months.toString()} 
                    onValueChange={(v: any) => setWelcomeSettings({ ...welcomeSettings, months: parseInt(v) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <span>{welcomeSettings.months} {welcomeSettings.months === 1 ? 'mês' : 'meses'}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mês</SelectItem>
                      <SelectItem value="2">2 meses</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="w-full h-8 text-xs font-bold" 
                size="sm" 
                onClick={handleSaveWelcomeSettings}
                disabled={isSavingSettings}
              >
                {isSavingSettings ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : 'Salvar Automação'}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center italic">
                O cliente receberá um código único por e-mail e no app logo após o cadastro.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <CouponDetailsDialog 
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        isLoading={isLoadingDetails}
        details={selectedCouponDetails}
      />

      {/* Dialog de Destinatários da Distribuição */}
      <Dialog open={recipientsDialogOpen} onOpenChange={setRecipientsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Destinatários da Distribuição
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {isLoadingDetails ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Código Gerado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Uso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDistributionRecipients.map((r: any) => (
                    <TableRow key={r.coupon_id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{r.client_name || 'N/A'}</span>
                          <span className="text-[10px] text-muted-foreground">{r.client_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono font-bold bg-primary/5">{r.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.is_used ? 'default' : 'secondary'}>
                          {r.is_used ? 'Usado' : 'Não Usado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.used_at ? formatDateTime(r.used_at) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
