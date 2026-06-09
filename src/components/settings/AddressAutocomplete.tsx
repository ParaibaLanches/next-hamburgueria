'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react'

export interface StoreAddressData {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

interface AddressAutocompleteProps {
  value: StoreAddressData
  onChange: (data: StoreAddressData) => void
  autocompleteService?: any // kept for API compatibility
}

function formatFullAddress(data: StoreAddressData): string {
  const parts = []
  if (data.street) parts.push(data.street)
  if (data.number) parts.push(`nº ${data.number}`)
  if (data.complement) parts.push(data.complement)
  if (data.neighborhood) parts.push(data.neighborhood)
  if (data.city && data.state) parts.push(`${data.city}/${data.state}`)
  if (data.cep) parts.push(`CEP ${data.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}`)
  return parts.join(', ')
}

export { formatFullAddress }

export default function AddressAutocomplete({ value, onChange }: AddressAutocompleteProps) {
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const update = (patch: Partial<StoreAddressData>) => {
    onChange({ ...value, ...patch })
  }

  const handleCepChange = async (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    update({ cep: digits })

    if (digits.length === 8) {
      setCepStatus('loading')
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const data = await res.json()
        if (data.erro) {
          setCepStatus('error')
        } else {
          setCepStatus('ok')
          onChange({
            ...value,
            cep: digits,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          })
        }
      } catch {
        setCepStatus('error')
      }
    } else {
      setCepStatus('idle')
    }
  }

  const formatted = formatFullAddress(value)

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-primary" />
        Endereço da Loja
        <span className="text-[10px] text-muted-foreground font-normal ml-1">(usado como origem no cálculo de frete)</span>
      </Label>

      <div className="p-4 border rounded-xl bg-muted/20 space-y-3">
        {/* CEP */}
        <div className="space-y-1.5">
          <Label htmlFor="store_cep" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            CEP *
          </Label>
          <div className="relative max-w-[200px]">
            <Input
              id="store_cep"
              placeholder="00000-000"
              value={value.cep.length > 5 ? `${value.cep.slice(0, 5)}-${value.cep.slice(5)}` : value.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              className="pr-9"
              maxLength={9}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {cepStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {cepStatus === 'ok' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
          </div>
          {cepStatus === 'error' && (
            <p className="text-xs text-destructive">CEP não encontrado. Verifique e tente novamente.</p>
          )}
        </div>

        {/* Rua + Número */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="store_street" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rua / Logradouro</Label>
            <Input
              id="store_street"
              placeholder="Ex: Rua das Flores"
              value={value.street}
              onChange={(e) => update({ street: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store_number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Número</Label>
            <Input
              id="store_number"
              placeholder="Ex: 123"
              value={value.number}
              onChange={(e) => update({ number: e.target.value })}
            />
          </div>
        </div>

        {/* Complemento + Bairro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="store_complement" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Complemento</Label>
            <Input
              id="store_complement"
              placeholder="Sala, Bloco, Andar..."
              value={value.complement}
              onChange={(e) => update({ complement: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store_neighborhood" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bairro</Label>
            <Input
              id="store_neighborhood"
              placeholder="Ex: Centro"
              value={value.neighborhood}
              onChange={(e) => update({ neighborhood: e.target.value })}
            />
          </div>
        </div>

        {/* Cidade + UF */}
        <div className="grid grid-cols-[1fr_80px] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="store_city" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cidade</Label>
            <Input
              id="store_city"
              placeholder="Ex: Campina Grande"
              value={value.city}
              onChange={(e) => update({ city: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store_state" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UF</Label>
            <Input
              id="store_state"
              placeholder="PB"
              value={value.state}
              onChange={(e) => update({ state: e.target.value.toUpperCase().slice(0, 2) })}
              maxLength={2}
            />
          </div>
        </div>

        {/* Preview do endereço completo */}
        {formatted && (
          <div className="pt-3 border-t flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground italic">{formatted}</p>
          </div>
        )}
      </div>
    </div>
  )
}
