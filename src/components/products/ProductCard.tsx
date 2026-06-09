import type { Product } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ImageIcon } from 'lucide-react'
import { getFullImageUrl } from '@/api/client'
import Image from 'next/image'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden group" onClick={() => onAdd(product)}>
      <div className="h-32 w-full bg-muted border-b relative overflow-hidden">
        {product.image_url ? (
          <Image 
            src={getFullImageUrl(product.image_url)!} 
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center opacity-20">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{product.name}</h3>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
            )}
          </div>
          <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8 bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground transition-colors">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-primary font-bold mt-2">{formatCurrency(product.price)}</p>
      </CardContent>
    </Card>
  )
}
