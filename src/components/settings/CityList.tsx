import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface IBGECity {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  is_ibge: boolean;
}

interface CityListProps {
  citiesStr: string;
  onChange: (value: string) => void;
}

export default function CityList({ citiesStr, onChange }: CityListProps) {
  const [newCity, setNewCity] = useState('')
  const [predictions, setPredictions] = useState<IBGECity[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isSearchingCities, setIsSearchingCities] = useState(false)
  const [isFetchingIBGE, setIsFetchingIBGE] = useState(false)
  
  const cityInputRef = useRef<HTMLInputElement>(null)
  const allCitiesCacheRef = useRef<IBGECity[] | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(e.target as Node)) {
        setShowPredictions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addCityToList = (cityName: string) => {
    const cities = citiesStr ? citiesStr.split(',')
      .map(c => c.trim())
      .filter(c => Boolean(c) && c !== 'false') : []
    
    if (cities.includes(cityName)) {
      return
    }

    const newList = [...cities, cityName].join(', ')
    onChange(newList)
    setNewCity('')
    setPredictions([])
    setShowPredictions(false)
  }

  const handleAddCity = () => {
    if (!newCity.trim()) return
    addCityToList(newCity.trim())
  }

  const handleRemoveCity = (cityToRemove: string) => {
    const cities = citiesStr ? citiesStr.split(',')
      .map(c => c.trim())
      .filter(c => Boolean(c) && c !== 'false') : []
    const newList = cities.filter(c => c !== cityToRemove).join(', ')
    onChange(newList)
  }

  const searchIBGECities = async (value: string) => {
    setIsSearchingCities(true)
    try {
      if (!allCitiesCacheRef.current && !isFetchingIBGE) {
        setIsFetchingIBGE(true)
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
        const data = await response.json()
        allCitiesCacheRef.current = data.map((c: any) => {
          const uf = c.microrregiao?.mesorregiao?.UF?.sigla || c['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla || 'BR'
          return {
            place_id: `ibge-${c.id}`,
            description: `${c.nome} - ${uf}`,
            structured_formatting: {
              main_text: c.nome,
              secondary_text: uf
            },
            is_ibge: true
          }
        })
        setIsFetchingIBGE(false)
      }

      if (allCitiesCacheRef.current) {
        const normalizedSearch = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        const filtered = allCitiesCacheRef.current.filter(c => 
          c.description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .includes(normalizedSearch)
        ).slice(0, 10)
        
        setPredictions(filtered)
        setShowPredictions(true)
      }
    } catch (err) {
      setPredictions([])
      setShowPredictions(false)
    } finally {
      setIsSearchingCities(false)
    }
  }

  const prepareIBGECities = async () => {
    if (!allCitiesCacheRef.current && !isFetchingIBGE) {
      searchIBGECities("") 
    }
  }

  const handleCityInputChange = async (value: string) => {
    setNewCity(value)
    
    if (value.length < 3) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    searchIBGECities(value)
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="delivery_allowed_cities">Cidades Atendidas (Whitelist)</Label>
      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/10 min-h-[50px]">
        {citiesStr
          .split(',')
          .map(c => c.trim())
          .filter(c => Boolean(c) && c !== 'false')
          .map((city, idx) => (
            <Badge key={idx} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1 group animate-in zoom-in-95">
              {city}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive p-0"
                onClick={() => handleRemoveCity(city)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        }
        {(!citiesStr || citiesStr.trim() === '') && (
          <span className="text-xs text-muted-foreground italic flex items-center h-8">
            Todas as cidades permitidas (sem restrição)
          </span>
        )}
      </div>
      <div className="flex gap-2 relative">
        <div className="flex-1 relative">
          <Input 
            ref={cityInputRef}
            placeholder="Adicionar nova cidade (ex: Cabedelo)"
            value={newCity}
            onChange={(e) => handleCityInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCity()
              }
            }}
            onFocus={() => {
              prepareIBGECities()
              if (predictions.length > 0) setShowPredictions(true)
            }}
            className="h-9"
          />
          
          {showPredictions && (
            <div className="absolute top-full left-0 w-full z-[9999] mt-1 bg-card border rounded-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-60 overflow-y-auto">
                {predictions.length > 0 ? predictions.map((p) => (
                  <div
                    key={p.place_id}
                    className="px-3 py-2 text-sm hover:bg-muted cursor-pointer transition-colors border-b last:border-0 flex items-center justify-between group"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      addCityToList(p.description)
                      setNewCity('')
                      setShowPredictions(false)
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {p.description}
                      </span>
                    </div>
                    <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )) : (
                  <div className="px-3 py-4 text-xs text-center text-muted-foreground italic bg-muted/5">
                    {isSearchingCities ? 'Buscando cidades...' : 'Nenhuma cidade encontrada'}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {isSearchingCities && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-9 px-3" onClick={handleAddCity}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground italic leading-tight">
        Digite a cidade e aperte Enter ou clique no (+). Pedidos de endereços fora desta lista serão bloqueados.
      </p>
    </div>
  )
}
