"use client";

import { useState, useEffect, useRef } from 'react'
import { useConfigStore } from '@/stores/configStore'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ShieldCheck, UserCircle, RotateCcw, Save, Undo2, CreditCard, Wallet, Banknote, Truck, Store, MapPin, Building2, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { maskPhone } from '@/lib/masks'
import Image from 'next/image'
import AddressAutocomplete, { type StoreAddressData, formatFullAddress } from '@/components/settings/AddressAutocomplete'
import CityList from '@/components/settings/CityList'

declare global {
  interface Window {
    google: any;
  }
}

interface IBGECity {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  is_ibge: boolean;
}

interface GooglePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function SettingsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { settings, globalSettings, updateGlobalSetting, updateUserSetting, resetUserSetting, fetchSettings } = useConfigStore()
  
  // Estados para rascunho (Mudanças não salvas)
  const [draftUser, setDraftUser] = useState<Record<string, string>>({})
  const [draftGlobal, setDraftGlobal] = useState<Record<string, string>>({})
  const [markedForReset, setMarkedForReset] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [newCity, setNewCity] = useState('')
  const autocompleteServiceRef = useRef<any>(null)

  // Carregamento dinâmico do Google Maps SDK nos Ajustes
  useEffect(() => {
    if (!globalSettings.google_maps_api_key) return

    const loadGoogleMaps = () => {
      if (window.google?.maps?.places) {
        initAutocomplete()
        return
      }

      if (document.getElementById('google-maps-sdk-settings')) return

      const script = document.createElement('script')
      script.id = 'google-maps-sdk-settings'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${globalSettings.google_maps_api_key}&libraries=places&language=pt-BR`
      script.async = true
      script.defer = true
      script.onload = () => initAutocomplete()
      document.head.appendChild(script)
    }

    const initAutocomplete = async () => {
      if (!window.google?.maps) return
      
      try {
        // Tenta carregar a biblioteca Places (Novo padrão)
        const { AutocompleteSuggestion } = await window.google.maps.importLibrary('places')
        autocompleteServiceRef.current = AutocompleteSuggestion
      } catch (err) {
        if (window.google.maps.places?.AutocompleteService) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        }
      }
    }

    loadGoogleMaps()
  }, [globalSettings.google_maps_api_key])

  const handleRemoveCity = (cityToRemove: string) => {
    const currentList = getEffectiveGlobalValue('delivery_allowed_cities')
    const cities = currentList ? currentList.split(',')
      .map(c => c.trim())
      .filter(c => Boolean(c) && c !== 'false') : []
    const newList = cities.filter(c => c !== cityToRemove).join(', ')
    handleGlobalText('delivery_allowed_cities', newList)
  }

  // Carrega configurações ao montar
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Click outside listener para fechar dropdowns (removido para os filhos)
  // Helpers para pegar o valor atual (Rascunho > Store)
  const getEffectiveUserValue = (key: string) => {
    if (markedForReset.has(key)) return globalSettings[key] || ''
    const val = draftUser[key] ?? settings[key]
    if (val === undefined) {
      return key.includes('_enabled') || key.includes('_default') ? 'false' : ''
    }
    return val
  }

  const getEffectiveGlobalValue = (key: string) => {
    const val = draftGlobal[key] ?? globalSettings[key]
    if (val === undefined) {
      return key.includes('_enabled') || key.includes('_default') ? 'false' : ''
    }
    return val
  }

  const hasChanges = Object.keys(draftUser).length > 0 || 
                     Object.keys(draftGlobal).length > 0 || 
                     markedForReset.size > 0

  const handleUserToggle = (key: string) => {
    const currentValue = getEffectiveUserValue(key) === 'true'
    const newValue = (!currentValue).toString()
    
    setMarkedForReset(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })

    setDraftUser(prev => ({ ...prev, [key]: newValue }))
  }

  const handleGlobalToggle = (key: string) => {
    const currentValue = getEffectiveGlobalValue(key) === 'true'
    const newValue = (!currentValue).toString()
    setDraftGlobal(prev => ({ ...prev, [key]: newValue }))
  }

  const handleGlobalText = (key: string, value: string) => {
    setDraftGlobal(prev => ({ ...prev, [key]: value }))
  }

  const handleMarkForReset = (key: string) => {
    setMarkedForReset(prev => new Set(prev).add(key))
    setDraftUser(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleDiscard = () => {
    setDraftUser({})
    setDraftGlobal({})
    setMarkedForReset(new Set())
    toast.info('Alterações descartadas')
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const promises: Promise<any>[] = []

      // 1. Processar Resets (Deletes)
      markedForReset.forEach(key => {
        promises.push(resetUserSetting(key))
      })

      // 2. Processar Individuais
      Object.entries(draftUser).forEach(([key, value]) => {
        promises.push(updateUserSetting(key, value))
      })

      // 3. Processar Globais
      Object.entries(draftGlobal).forEach(([key, value]) => {
        promises.push(updateGlobalSetting(key, value))
      })

      await Promise.all(promises)
      
      // Limpa rascunhos e recarrega
      setDraftUser({})
      setDraftGlobal({})
      setMarkedForReset(new Set())
      
      await fetchSettings()
      toast.success('Todas as configurações foram salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar algumas configurações. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
          <p className="text-muted-foreground">Personalize sua experiência e gerencie os padrões do sistema.</p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <Button variant="ghost" onClick={handleDiscard} disabled={isSaving}>
              <Undo2 className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* PREFERÊNCIAS INDIVIDUAIS */}
        <Card className={markedForReset.size > 0 || Object.keys(draftUser).length > 0 ? 'border-primary/40' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              <CardTitle>Minhas Preferências</CardTitle>
            </div>
            <CardDescription>Estes ajustes se aplicam apenas ao seu login e sobrescrevem os padrões do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between space-x-2">
              <Label className="flex flex-col space-y-1">
                <span>Menu Lateral Recuado</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Como o menu deve iniciar para você.
                </span>
              </Label>
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => handleMarkForReset('sidebar_collapsed_default')}
                  disabled={markedForReset.has('sidebar_collapsed_default')}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Usar Padrão
                </Button>
                <Switch 
                  checked={getEffectiveUserValue('sidebar_collapsed_default') === 'true'} 
                  onCheckedChange={() => handleUserToggle('sidebar_collapsed_default')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AJUSTES GLOBAIS (ADMIN APENAS) */}
        {isAdmin && (
          <div className="grid gap-6">
            {/* IDENTIDADE */}
            <Card className={`border-l-4 border-l-primary ${Object.keys(draftGlobal).some(k => k === 'app_name') ? 'border-primary/40' : ''}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Identidade do Estabelecimento</CardTitle>
                </div>
                <CardDescription>Configure o nome oficial que aparece no sistema e nos recibos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Nome do Negócio</Label>
                  <Input 
                    id="app_name"
                    value={getEffectiveGlobalValue('app_name')} 
                    onChange={(e) => handleGlobalText('app_name', e.target.value)}
                    placeholder="Ex: Paraíba Lanches"
                  />
                </div>
              </CardContent>
            </Card>

            {/* CUSTOMIZAÇÃO DO APP */}
            <Card className={Object.keys(draftGlobal).some(k => k.startsWith('app_')) ? 'border-primary/40' : ''}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <CardTitle>Vitrine do Aplicativo</CardTitle>
                </div>
                <CardDescription>Configure a aparência e as informações de contato do seu App.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="app_description">Slogan ou Descrição Curta (App)</Label>
                  <Input 
                    id="app_description"
                    value={getEffectiveGlobalValue('app_description')} 
                    onChange={(e) => handleGlobalText('app_description', e.target.value)}
                    placeholder="Ex: Os lendários lanches de 1kg+ da Paraíba"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="app_logo_url">URL da Logomarca (PNG/JPG)</Label>
                    <Input 
                      id="app_logo_url"
                      value={getEffectiveGlobalValue('app_logo_url')} 
                      onChange={(e) => handleGlobalText('app_logo_url', e.target.value)}
                      placeholder="https://sua-imagem.com/logo.png"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    {getEffectiveGlobalValue('app_logo_url') && (
                      <>
                        <div className="relative h-10 w-10 rounded border bg-white overflow-hidden flex items-center justify-center">
                          <Image 
                            src={getEffectiveGlobalValue('app_logo_url')} 
                            alt="Logo Preview" 
                            fill
                            className="object-contain" 
                            sizes="40px"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">Prévia da Logo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="app_contact_whatsapp">WhatsApp (Com DDD)</Label>
                    <Input 
                      id="app_contact_whatsapp"
                      value={getEffectiveGlobalValue('app_contact_whatsapp')} 
                      onChange={(e) => handleGlobalText('app_contact_whatsapp', maskPhone(e.target.value))}
                      placeholder="(83) 98888-7777"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_contact_instagram">Link Instagram</Label>
                    <Input 
                      id="app_contact_instagram"
                      value={getEffectiveGlobalValue('app_contact_instagram')} 
                      onChange={(e) => handleGlobalText('app_contact_instagram', e.target.value)}
                      placeholder="Ex: https://instagram.com/paraibalanches"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FINANCEIRO */}
            <Card className={Object.keys(draftGlobal).some(k => k.startsWith('payment_')) ? 'border-primary/40' : ''}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <CardTitle>Métodos de Pagamento</CardTitle>
                </div>
                <CardDescription>Habilite ou desabilite as formas de pagamento aceitas no PDV.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md"><Banknote className="h-4 w-4" /></div>
                    <Label>Dinheiro</Label>
                  </div>
                  <Switch 
                    checked={getEffectiveGlobalValue('payment_cash_enabled') === 'true'} 
                    onCheckedChange={() => handleGlobalToggle('payment_cash_enabled')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md"><CreditCard className="h-4 w-4 text-blue-600" /></div>
                    <Label>Cartão de Crédito</Label>
                  </div>
                  <Switch 
                    checked={getEffectiveGlobalValue('payment_credit_card_enabled') === 'true'} 
                    onCheckedChange={() => handleGlobalToggle('payment_credit_card_enabled')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md"><CreditCard className="h-4 w-4 text-blue-400" /></div>
                    <Label>Cartão de Débito</Label>
                  </div>
                  <Switch 
                    checked={getEffectiveGlobalValue('payment_debit_card_enabled') === 'true'} 
                    onCheckedChange={() => handleGlobalToggle('payment_debit_card_enabled')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md"><Wallet className="h-4 w-4 text-emerald-600" /></div>
                    <Label>PIX</Label>
                  </div>
                  <Switch 
                    checked={getEffectiveGlobalValue('payment_pix_enabled') === 'true'} 
                    onCheckedChange={() => handleGlobalToggle('payment_pix_enabled')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* OPERAÇÃO */}
            <Card className={Object.keys(draftGlobal).some(k => k.startsWith('order_') || k === 'delivery_fee_default') ? 'border-primary/40' : ''}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <CardTitle>Operação e Entregas</CardTitle>
                </div>
                <CardDescription>Controle os tipos de serviço e taxas operacionais.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <Switch 
                        checked={getEffectiveGlobalValue('order_local_enabled') === 'true'} 
                        onCheckedChange={() => handleGlobalToggle('order_local_enabled')}
                      />
                    </div>
                    <Label className="font-bold">Consumo Local</Label>
                  </div>
                  <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Switch 
                        checked={getEffectiveGlobalValue('order_pickup_enabled') === 'true'} 
                        onCheckedChange={() => handleGlobalToggle('order_pickup_enabled')}
                      />
                    </div>
                    <Label className="font-bold">Retirada</Label>
                  </div>
                  <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <Switch 
                        checked={getEffectiveGlobalValue('order_delivery_enabled') === 'true'} 
                        onCheckedChange={() => handleGlobalToggle('order_delivery_enabled')}
                      />
                    </div>
                    <Label className="font-bold">Entrega</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_min_fee">Taxa Mínima de Entrega (R$)</Label>
                    <Input 
                      id="delivery_min_fee"
                      type="number"
                      step="0.01"
                      value={getEffectiveGlobalValue('delivery_min_fee')} 
                      onChange={(e) => handleGlobalText('delivery_min_fee', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_fee_per_km">Valor por KM Adicional (R$)</Label>
                    <Input 
                      id="delivery_fee_per_km"
                      type="number"
                      step="0.01"
                      value={getEffectiveGlobalValue('delivery_fee_per_km')} 
                      onChange={(e) => handleGlobalText('delivery_fee_per_km', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_max_radius">Raio Máximo de Entrega (KM)</Label>
                    <Input 
                      id="delivery_max_radius"
                      type="number"
                      step="1"
                      value={getEffectiveGlobalValue('delivery_max_radius')?.split('.')[0] || ''} 
                      onChange={(e) => handleGlobalText('delivery_max_radius', e.target.value)}
                      placeholder="Ex: 30 (0 para ilimitado)"
                    />
                  </div>
                </div>

                <CityList 
                  citiesStr={getEffectiveGlobalValue('delivery_allowed_cities') || ''}
                  onChange={(val) => handleGlobalText('delivery_allowed_cities', val)}
                />

                <AddressAutocomplete 
                  value={{
                    cep: getEffectiveGlobalValue('store_cep'),
                    street: getEffectiveGlobalValue('store_street'),
                    number: getEffectiveGlobalValue('store_number'),
                    complement: getEffectiveGlobalValue('store_complement'),
                    neighborhood: getEffectiveGlobalValue('store_neighborhood'),
                    city: getEffectiveGlobalValue('store_city'),
                    state: getEffectiveGlobalValue('store_state'),
                  }}
                  onChange={(data: StoreAddressData) => {
                    setDraftGlobal(prev => ({
                      ...prev,
                      store_cep: data.cep,
                      store_street: data.street,
                      store_number: data.number,
                      store_complement: data.complement,
                      store_neighborhood: data.neighborhood,
                      store_city: data.city,
                      store_state: data.state,
                      store_address: formatFullAddress(data),
                    }))
                  }}
                />

                <div className="space-y-2">
                  <Label htmlFor="google_maps_api_key">Google Maps API Key</Label>
                  <Input 
                    id="google_maps_api_key"
                    type="password"
                    value={getEffectiveGlobalValue('google_maps_api_key')} 
                    onChange={(e) => handleGlobalText('google_maps_api_key', e.target.value)}
                    placeholder="Cole sua chave aqui para ativar a triangulação automática"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Necessário para calcular distâncias reais via Google Distance Matrix.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-primary/5 ${Object.keys(draftGlobal).some(k => k === 'sidebar_collapsed_default') ? 'border-primary/40' : 'border-primary/20'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm">Configurações de Interface (Padrão)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between space-x-2">
                  <Label className="flex flex-col space-y-1">
                    <span className="text-foreground">Menu Lateral Padrão</span>
                    <span className="font-normal text-[10px] text-muted-foreground uppercase tracking-wider">
                      Estado inicial para novos perfis
                    </span>
                  </Label>
                  <Switch 
                    checked={getEffectiveGlobalValue('sidebar_collapsed_default') === 'true'} 
                    onCheckedChange={() => handleGlobalToggle('sidebar_collapsed_default')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="opacity-60 border-dashed bg-muted/20">
          <CardHeader>
            <CardDescription className="text-xs italic text-center">As alterações acima só entrarão em vigor após você clicar no botão "Salvar" no topo da página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
