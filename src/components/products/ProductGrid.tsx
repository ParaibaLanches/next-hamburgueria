import { useState } from 'react'
import type { Product, Category } from '@/types'
import ProductCard from './ProductCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductGridProps {
  products: Product[]
  categories: Category[]
  onAdd: (product: Product) => void
}

export default function ProductGrid({ products, categories, onAdd }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const availableProducts = products.filter((p) => p.available)

  // Filtra por nome
  const searchedProducts = availableProducts.filter((p) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Adiciona a opção "Todos" no início
  const tabItems = [
    { id: 'all', name: 'Todos' },
    ...categories.map(c => ({ id: c.id.toString(), name: c.name.charAt(0).toUpperCase() + c.name.slice(1) }))
  ]

  return (
    <div className="space-y-4">
      {/* Barra de Busca */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Pesquisar produto pelo nome..."
          className="pl-10 pr-10 h-11 bg-background/50 hover:bg-background focus:bg-background transition-colors shadow-sm border-muted-foreground/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start">
          {tabItems.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="h-9 px-4 py-2 border bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary rounded-full transition-all"
            >
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabItems.map((cat) => {
          const filtered =
            cat.id === 'all'
              ? searchedProducts
              : searchedProducts.filter((p) => p.category_id === parseInt(cat.id))

          return (
            <TabsContent key={cat.id} value={cat.id} className="mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-muted p-4 rounded-full mb-3">
                    <Search className="h-8 w-8 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Nenhum produto encontrado</p>
                  {searchQuery && (
                    <Button 
                      variant="link" 
                      className="text-primary text-xs mt-1"
                      onClick={() => setSearchQuery('')}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={onAdd} />
                  ))}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
