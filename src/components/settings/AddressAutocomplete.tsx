import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GooglePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  autocompleteService: any;
}

export default function AddressAutocomplete({ value, onChange, autocompleteService }: AddressAutocompleteProps) {
  const [addressPredictions, setAddressPredictions] = useState<GooglePrediction[]>([])
  const [showAddressPredictions, setShowAddressPredictions] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressInputRef.current && !addressInputRef.current.contains(e.target as Node)) {
        setShowAddressPredictions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddressInputChange = (inputValue: string) => {
    onChange(inputValue)
    
    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current)
    }

    if (inputValue.length < 3) {
      setAddressPredictions([])
      setShowAddressPredictions(false)
      return
    }

    addressDebounceRef.current = setTimeout(async () => {
      if (autocompleteService) {
        setIsSearchingAddress(true)
        try {
          if (typeof autocompleteService.fetchAutocompleteSuggestions === 'function') {
            try {
              const { suggestions } = await autocompleteService.fetchAutocompleteSuggestions({
                input: inputValue,
                includedRegionCodes: ['BR']
              })
              
              const mapped = suggestions.map((s: any) => {
                const p = s.placePrediction
                const fullText = p?.text?.text || s.description || ''
                const mainText = p?.structuredFormat?.mainText?.text || fullText
                const secondaryText = p?.structuredFormat?.secondaryText?.text || ''
                
                return {
                  place_id: p?.placeId || s.placeId || Math.random().toString(),
                  description: fullText,
                  structured_formatting: {
                    main_text: mainText,
                    secondary_text: secondaryText
                  }
                }
              })
              
              setAddressPredictions(mapped)
              setShowAddressPredictions(mapped.length > 0)
              setIsSearchingAddress(false)
              return 
            } catch (apiNewErr) {
              // Fallback silencioso
            }
          }

          const legacyService = window.google?.maps?.places?.AutocompleteService 
            ? new window.google.maps.places.AutocompleteService() 
            : null

          if (legacyService) {
            legacyService.getPlacePredictions(
              { input: inputValue, componentRestrictions: { country: 'br' } },
              (results: any[], status: any) => {
                setAddressPredictions(status === 'OK' ? results : [])
                setShowAddressPredictions(status === 'OK')
                setIsSearchingAddress(false)
              }
            )
          } else {
            setIsSearchingAddress(false)
          }
        } catch (err) {
          setAddressPredictions([])
          setShowAddressPredictions(false)
          setIsSearchingAddress(false)
        }
      }
    }, 500)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="store_address">Endereço da Loja (Origem)</Label>
      <div className="relative" ref={addressInputRef}>
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          id="store_address"
          className="pl-9"
          value={value} 
          onChange={(e) => handleAddressInputChange(e.target.value)}
          onFocus={() => {
            if (addressPredictions.length > 0) setShowAddressPredictions(true)
          }}
          placeholder="Endereço completo para o cálculo de distância"
        />

        {showAddressPredictions && addressPredictions.length > 0 && (
          <div className="absolute top-full left-0 w-full z-[100] mt-1 bg-card border rounded-md shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-60 overflow-y-auto">
              {addressPredictions.map((p) => (
                <div
                  key={p.place_id}
                  className="px-3 py-2 text-sm hover:bg-muted cursor-pointer transition-colors border-b last:border-0 group"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(p.description)
                    setAddressPredictions([])
                    setShowAddressPredictions(false)
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-primary transition-colors">{p.structured_formatting.main_text}</span>
                    <span className="text-[10px] text-muted-foreground">{p.structured_formatting.secondary_text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSearchingAddress && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  )
}
