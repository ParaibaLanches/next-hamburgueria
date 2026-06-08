import { ShoppingCart, Minus, Plus, Trash2, X, Search, Loader2, UserCircle, Tag, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { maskDocument, maskPhone } from '@/lib/masks'
import type { CartItem, Client, Coupon, OrderType } from '@/types'
import { getFullImageUrl } from '@/api/client'
import { useConfigStore } from '@/stores/configStore'
import { MutableRefObject } from 'react'

interface CartSidebarProps {
  cart: CartItem[]
  orderType: OrderType
  setOrderType: (t: OrderType) => void
  paymentMethod: string
  setPaymentMethod: (p: 'cash' | 'credit_card' | 'debit_card' | 'pix') => void
  notes: string
  setNotes: (n: string) => void
  address: string
  setAddress: (a: string) => void
  deliveryDistance: number
  deliveryFee: number
  isCalculatingFee: boolean
  total: number
  subtotal: number
  discount: number
  couponCode: string
  setCouponCode: (c: string) => void
  appliedCoupon: Coupon | null
  setAppliedCoupon: (c: Coupon | null) => void
  setDiscount: (d: number) => void
  isValidatingCoupon: boolean
  handleApplyCoupon: () => void
  selectedClient: Client | null
  setSelectedClient: (c: Client | null) => void
  clientSearch: string
  setClientSearch: (s: string) => void
  showClientDropdown: boolean
  setShowClientDropdown: (s: boolean) => void
  isSearchingClient: boolean
  clients: Client[]
  setSelectedCity: (c: string) => void
  addressInputRef: MutableRefObject<HTMLInputElement | null>
  updateQty: (id: number, delta: number) => void
  removeFromCart: (id: number) => void
  handleSubmit: () => void
  isSubmitting: boolean
  activeClosure: any
}

export default function CartSidebar({
  cart,
  orderType, setOrderType,
  paymentMethod, setPaymentMethod,
  notes, setNotes,
  address, setAddress,
  deliveryDistance,
  deliveryFee,
  isCalculatingFee,
  total,
  discount,
  couponCode, setCouponCode,
  appliedCoupon, setAppliedCoupon, setDiscount,
  isValidatingCoupon, handleApplyCoupon,
  selectedClient, setSelectedClient,
  clientSearch, setClientSearch,
  showClientDropdown, setShowClientDropdown,
  isSearchingClient, clients,
  setSelectedCity,
  addressInputRef,
  updateQty, removeFromCart,
  handleSubmit, isSubmitting, activeClosure
}: CartSidebarProps) {
  const { getBool } = useConfigStore()

  return (
    <Card className="w-96 flex flex-col shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Carrinho
          {cart.length > 0 && (
            <Badge variant="secondary">{cart.reduce((s, i) => s + i.quantity, 0)}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3">
        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Clique nos produtos para adicionar
          </p>
        ) : (
          cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-2 text-sm">
                <div className="relative h-12 w-12 rounded-md bg-muted border overflow-hidden">
                  {item.product.image_url ? (
                    <Image 
                      src={getFullImageUrl(item.product.image_url)!} 
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                  <div className="h-full w-full flex items-center justify-center opacity-20">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.product.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatCurrency(item.product.price)} cada
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.product.id, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-medium">{item.quantity}</span>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.product.id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="w-20 text-right font-medium">{formatCurrency(item.product.price * item.quantity)}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <div className="px-4 py-2 border-t bg-muted/20">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block tracking-wider">Cupom de Desconto</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input 
              placeholder="CÓDIGO" 
              className="h-8 text-xs font-bold uppercase pr-8" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={!!appliedCoupon}
            />
            {appliedCoupon && (
              <button 
                onClick={() => {
                  setAppliedCoupon(null)
                  setDiscount(0)
                  setCouponCode('')
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {!appliedCoupon && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-[10px] font-bold px-3"
              onClick={handleApplyCoupon}
              disabled={isValidatingCoupon || !couponCode}
            >
              {isValidatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : 'APLICAR'}
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 border-t space-y-4">
        <div className="space-y-1.5 relative">
          <Label className="text-xs">Cliente (Opcional)</Label>
          {selectedClient ? (
            <div className="flex items-center justify-between p-2.5 border rounded-lg bg-primary/5 border-primary/20 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-1.5 rounded-full">
                  <UserCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-tight">{selectedClient.name || selectedClient.email || 'Sem Nome'}</span>
                  {selectedClient.document && <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{maskDocument(selectedClient.document)}</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => setSelectedClient(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={clientSearch}
                  onChange={(e) => {
                    const val = e.target.value
                    const isPotentiallyDocument = /^[0-9.-]*$/.test(val)
                    const masked = isPotentiallyDocument ? maskDocument(val) : val
                    setClientSearch(masked)
                    setShowClientDropdown(true)
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  className="h-10 pl-9 pr-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
                {isSearchingClient && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin">
                    <Loader2 className="h-4 w-4" />
                  </div>
                )}
              </div>

              {showClientDropdown && (clientSearch.length >= 2) && (
                <div className="absolute z-50 w-full mt-1.5 bg-background border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="max-h-[240px] overflow-y-auto">
                    {isSearchingClient ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        Buscando clientes...
                      </div>
                    ) : clients.length > 0 ? (
                      clients.map(c => (
                        <div 
                          key={c.id} 
                          className="group flex items-center justify-between px-3 py-2.5 hover:bg-primary/5 cursor-pointer transition-colors border-b last:border-0"
                          onClick={() => {
                            setSelectedClient(c)
                            setShowClientDropdown(false)
                            setClientSearch('')
                            
                            if (orderType === 'delivery') {
                              const fullAddr = c.street 
                                ? `${c.street}, ${c.number || ''} - ${c.neighborhood || ''}${c.complement ? ` (${c.complement})` : ''}`
                                : c.address || ''
                              
                              setAddress(fullAddr)
                              if (c.city) setSelectedCity(c.city)
                            }
                          }}
                        >
                          <div className="flex flex-col min-w-0">
                            <div className="font-bold truncate group-hover:text-primary transition-colors text-sm">
                              {c.name || 'Sem Nome'}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {c.email || (c.document ? maskDocument(c.document) : (c.phone ? maskPhone(c.phone) : 'Nenhum dado adicional'))}
                            </div>
                          </div>
                          {c.document && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal opacity-60 group-hover:opacity-100">
                              CPF
                            </Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-xs text-muted-foreground">Nenhum cliente encontrado para "{clientSearch}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={orderType} onValueChange={(v) => {
              const newType = v as OrderType
              setOrderType(newType)
              
              if (newType === 'delivery' && selectedClient && !address) {
                const c = selectedClient
                const fullAddr = c.street 
                  ? `${c.street}, ${c.number || ''} - ${c.neighborhood || ''}${c.complement ? ` (${c.complement})` : ''}`
                  : c.address || ''
                
                setAddress(fullAddr)
                if (c.city) setSelectedCity(c.city)
              }
            }}>
              <SelectTrigger className="h-9 w-full">
                <span className="text-sm">
                  {orderType === 'local' ? 'Local' : orderType === 'delivery' ? 'Delivery' : 'Retirada'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {getBool('order_local_enabled', true) && <SelectItem value="local">Local</SelectItem>}
                {getBool('order_delivery_enabled', true) && <SelectItem value="delivery">Delivery</SelectItem>}
                {getBool('order_pickup_enabled', true) && <SelectItem value="pickup">Retirada</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'credit_card' | 'debit_card' | 'pix')}>
              <SelectTrigger className="h-9 w-full">
                <span className="text-sm">
                  {paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'credit_card' ? 'Crédito' : paymentMethod === 'debit_card' ? 'Débito' : 'Dinheiro'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {getBool('payment_pix_enabled', true) && <SelectItem value="pix">PIX</SelectItem>}
                {getBool('payment_credit_card_enabled', true) && <SelectItem value="credit_card">Crédito</SelectItem>}
                {getBool('payment_debit_card_enabled', true) && <SelectItem value="debit_card">Débito</SelectItem>}
                {getBool('payment_cash_enabled', true) && <SelectItem value="cash">Dinheiro</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {orderType === 'delivery' && (
          <div className="space-y-2 animate-in slide-in-from-top-2">
            <Label className="text-xs">Endereço de Entrega</Label>
            <div className="relative">
              <Input
                ref={addressInputRef}
                placeholder="Rua, número, bairro..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-9 pr-8"
              />
              {isCalculatingFee && (
                <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {deliveryDistance > 0 && (
              <div className="flex justify-between text-[10px] font-medium text-emerald-600 bg-emerald-50 p-1 px-2 rounded">
                <span>Distância: {deliveryDistance.toFixed(1)} km</span>
                <span>Frete por KM: Ativo</span>
              </div>
            )}
          </div>
        )}

        <div>
          <Label className="text-xs">Observacoes</Label>
          <Input
            placeholder="Ex: sem cebola..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-9"
          />
        </div>

        <Separator />

        {deliveryFee > 0 && (
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Taxa de Entrega</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between items-center text-sm text-emerald-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Desconto ({appliedCoupon?.code})
            </span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>

        <Button className="w-full" size="lg" disabled={cart.length === 0 || isSubmitting || !activeClosure} onClick={handleSubmit}>
          {isSubmitting ? 'Criando...' : !activeClosure ? 'Caixa Fechado' : 'Finalizar Pedido'}
        </Button>
      </div>
    </Card>
  )
}
