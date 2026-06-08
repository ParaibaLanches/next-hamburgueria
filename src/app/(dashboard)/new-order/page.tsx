"use client";

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation';

import { productsApi, ordersApi, categoriesApi, clientsApi, couponsApi, getFullImageUrl } from '@/api/client'
import type { Product, CartItem, OrderType, Category, Client, Coupon } from '@/types'
import ProductGrid from '@/components/products/ProductGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, X, Search, Loader2, UserCircle, Lock, Tag, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { maskDocument, maskPhone } from '@/lib/masks'
import { useConfigStore } from '@/stores/configStore'
import { useOrderStore } from '@/stores/orderStore'
import { closuresApi } from '@/api/client'
import CartSidebar from '@/components/orders/CartSidebar'

export default function NewOrderPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const { getBool } = useConfigStore()
  const [orderType, setOrderType] = useState<OrderType>('local')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix'>('cash')

  useEffect(() => {
    // Escolhe o primeiro disponivel se o atual for desativado
    if (!getBool('order_local_enabled', true)) {
      if (getBool('order_pickup_enabled', true)) setOrderType('pickup')
      else if (getBool('order_delivery_enabled', true)) setOrderType('delivery')
    }
    if (!getBool('payment_cash_enabled', true)) {
      if (getBool('payment_credit_card_enabled', true)) setPaymentMethod('credit_card')
      else if (getBool('payment_debit_card_enabled', true)) setPaymentMethod('debit_card')
      else if (getBool('payment_pix_enabled', true)) setPaymentMethod('pix')
    }
  }, [getBool])

  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [activeClosure, setActiveClosure] = useState<any>(null)
  const [isLoadingClosure, setIsLoadingClosure] = useState(true)
  const [address, setAddress] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [deliveryDistance, setDeliveryDistance] = useState(0)
  const [isCalculatingFee, setIsCalculatingFee] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  
  const addressInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const { globalSettings } = useConfigStore()

  // Carregamento dinâmico do Google Maps SDK
  useEffect(() => {
    if (orderType !== 'delivery' || !globalSettings.google_maps_api_key) return

    const loadGoogleMaps = () => {
      if (window.google?.maps?.places) {
        initAutocomplete()
        return
      }

      // Evita carregar múltiplos scripts
      if (document.getElementById('google-maps-sdk')) {
        return
      }

      const script = document.createElement('script')
      script.id = 'google-maps-sdk'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${globalSettings.google_maps_api_key}&libraries=places&language=pt-BR`
      script.async = true
      script.defer = true
      script.onload = () => initAutocomplete()
      document.head.appendChild(script)
    }

    const initAutocomplete = () => {
      if (!addressInputRef.current || !window.google?.maps?.places) return
      
      autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: 'br' },
        fields: ['formatted_address', 'geometry'],
        types: ['address']
      })

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace()
        if (place.formatted_address) {
          setAddress(place.formatted_address)
          
          // Extrair cidade (locality)
          const cityComp = place.address_components?.find((c: any) => 
            c.types.includes('locality') || c.types.includes('administrative_area_level_2')
          )
          if (cityComp) {
            setSelectedCity(cityComp.long_name)
          }
        }
      })
    }

    loadGoogleMaps()
  }, [orderType, globalSettings.google_maps_api_key])

  useEffect(() => {
    const checkClosure = async () => {
      setIsLoadingClosure(true)
      try {
        const res = await closuresApi.getActive()
        if (res.success && res.data) {
          setActiveClosure(res.data)
        } else {
          setActiveClosure(null)
        }
      } catch (err) {
        toast.error("Erro ao verificar conectividade com o caixa")
      } finally {
        setIsLoadingClosure(false)
      }
    }
    checkClosure()
  }, [])

  // Removido lógica de arrastar para fixar o aviso no layout

  useEffect(() => {
    if (clientSearch.length < 2) {
      setClients([])
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    const delayFn = setTimeout(() => {
      clientsApi.search(clientSearch).then((res) => {
        if (res.success && res.data) setClients(res.data)
      }).finally(() => {
        setIsSearching(false)
      })
    }, 300)
    return () => clearTimeout(delayFn)
  }, [clientSearch])

  useEffect(() => {
    productsApi.getAll().then((res) => {
      if (res.success && res.data) setProducts(res.data)
    })
    categoriesApi.getAll().then((res) => {
      if (res.success && res.data) setCategories(res.data)
    })
  }, [])

  useEffect(() => {
    if (orderType !== 'delivery' || address.length < 5) {
      setDeliveryFee(0)
      setDeliveryDistance(0)
      return
    }

    setIsCalculatingFee(true)
    const delayFn = setTimeout(() => {
      ordersApi.calculateDelivery(address, selectedCity).then((res) => {
        if (res.success && res.data) {
          setDeliveryFee(res.data.fee)
          setDeliveryDistance(res.data.distance)
        } else {
          setDeliveryFee(0)
          setDeliveryDistance(0)
        }
      }).catch((_) => {
        setDeliveryFee(0)
        setDeliveryDistance(0)
        // O interceptor já mostra o toast, mas podemos resetar o estado aqui
      }).finally(() => {
        setIsCalculatingFee(false)
      })
    }, 800)

    return () => clearTimeout(delayFn)
  }, [address, orderType])

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const total = subtotal - discount + deliveryFee

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1, notes: '' }]
    })
  }

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
    // Reset discount if cart changes (might invalidate min purchase)
    setDiscount(0)
    setAppliedCoupon(null)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return
    setIsValidatingCoupon(true)
    try {
      const res = await couponsApi.validate(couponCode, subtotal)
      if (res.success && res.data) {
        const coupon = res.data
        let discountVal = 0
        if (coupon.type === 'percentage') {
          discountVal = subtotal * (coupon.value / 100)
        } else {
          discountVal = coupon.value
        }
        
        if (discountVal > subtotal) discountVal = subtotal
        
        setDiscount(discountVal)
        setAppliedCoupon(coupon)
        toast.success(`Cupom ${coupon.code} aplicado!`)
      } else {
        toast.error(res.error || 'Cupom inválido')
        setDiscount(0)
        setAppliedCoupon(null)
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao validar cupom')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error('Adicione ao menos um item')
      return
    }
    setIsSubmitting(true)
    try {
      const req = {
        client_id: selectedClient?.id,
        order_type: orderType,
        delivery_fee: deliveryFee,
        delivery_distance: deliveryDistance,
        notes,
        coupon_code: appliedCoupon?.code,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          notes: i.notes,
        })),
        payments: [
          { method: paymentMethod as any, amount: total },
        ]
      }
      const res = await ordersApi.create(req as any)
      if (res.success && res.data) {
        // Marca este pedido como criado localmente para evitar dupla notificação no AppLayout
        useOrderStore.getState().setLastCreatedOrderId(res.data.id)
        
        toast.success(`Pedido ${res.data.code} criado!`)
        router.push('/orders')
      } else {
        toast.error(res.error || 'Erro ao criar pedido')
      }
    } catch {
      toast.error('Erro ao criar pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Loading State */}
      {/* Loading State */}
      {isLoadingClosure && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Verificando estado do caixa...</p>
          </div>
        </div>
      )}



      <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Product grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Novo Pedido</h1>
        </div>

        {/* Warning Widget when Cashier is Closed */}
        {!isLoadingClosure && !activeClosure && (
          <div className="mb-6">
            <Card className="border-amber-200/50 bg-amber-50/90">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 p-2 rounded-xl shrink-0">
                    <Lock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase text-amber-900 tracking-wider">Caixa Fechado</p>
                    <p className="text-xs text-amber-700 leading-tight">
                      Você não pode finalizar pedidos agora. Abra o caixa para liberar.
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] tracking-widest gap-2 shadow-lg shadow-amber-600/20"
                  onClick={() => router.push('/closures')}
                >
                  ABRIR CAIXA
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        <ProductGrid products={products} categories={categories} onAdd={addToCart} />
      </div>

      <CartSidebar 
        cart={cart}
        orderType={orderType}
        setOrderType={setOrderType}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        notes={notes}
        setNotes={setNotes}
        address={address}
        setAddress={setAddress}
        deliveryDistance={deliveryDistance}
        deliveryFee={deliveryFee}
        isCalculatingFee={isCalculatingFee}
        total={total}
        subtotal={subtotal}
        discount={discount}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        appliedCoupon={appliedCoupon}
        setAppliedCoupon={setAppliedCoupon}
        setDiscount={setDiscount}
        isValidatingCoupon={isValidatingCoupon}
        handleApplyCoupon={handleApplyCoupon}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clientSearch={clientSearch}
        setClientSearch={setClientSearch}
        showClientDropdown={showClientDropdown}
        setShowClientDropdown={setShowClientDropdown}
        isSearchingClient={isSearching}
        clients={clients}
        setSelectedCity={setSelectedCity}
        addressInputRef={addressInputRef}
        updateQty={updateQty}
        removeFromCart={removeFromCart}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        activeClosure={activeClosure}
      />
      </div>
    </>
  )
}
