"use client";

import { useEffect, useState } from 'react'
import { productsApi, categoriesApi } from '@/api/client'
import { formatCurrency } from '@/lib/utils'
import { getFullImageUrl } from '@/api/client'
import type { Product, Category, Ingredient } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Search, ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}



export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    category_id: 0, 
    image_url: '', 
    is_featured: false, 
    featured_slot: 'none', 
    promotion_label: '',
    promotional_price: '',
    discount_percentage: '',
    ingredient_ids: [] as number[]
  })
  const [isUploading, setIsUploading] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)


  const fetchProducts = async () => {
    const res = await productsApi.getAll()
    if (res.success && res.data) setProducts(res.data)
  }

  const fetchCategories = async () => {
    const res = await categoriesApi.getAll()
    if (res.success && res.data) {
      setCategories(res.data)
      // Se não estiver editando e não tiver categoria selecionada, pega a primeira
      if (res.data.length > 0 && !editing && form.category_id === 0) {
        setForm((f) => ({ ...f, category_id: res.data[0].id }))
      }
    }
  }

  const fetchIngredients = async () => {
    const res = await productsApi.getIngredients()
    if (res.success && res.data) setAllIngredients(res.data)
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchIngredients()
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditing(null)
    setForm({ 
      name: '', 
      description: '', 
      price: '',
      category_id: categories[0]?.id || 0, 
      image_url: '',
      is_featured: false,
      featured_slot: 'none',
      promotion_label: '',
      promotional_price: '',
      discount_percentage: '',
      ingredient_ids: []
    })
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description,
      price: Number(product.price).toFixed(2).replace('.', ','),
      category_id: (product.category_id !== undefined ? product.category_id : (product as any).categoryId) || 0,
      image_url: product.image_url || (product as any).imageUrl || '',
      is_featured: product.is_featured || (product as any).isFeatured || false,
      featured_slot: product.featured_slot || (product as any).featuredSlot || 'none',
      promotion_label: product.promotion_label || (product as any).promotionLabel || '',
      promotional_price: (product.promotional_price || (product as any).promotionalPrice) ? Number(product.promotional_price || (product as any).promotionalPrice).toFixed(2).replace('.', ',') : '',
      discount_percentage: '',
      ingredient_ids: product.ingredients?.map(i => i.id) || []
    })
    setDialogOpen(true)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const res = await productsApi.uploadImage(file)
      if (res.success && res.data) {
        setForm({ ...form, image_url: res.data })
        toast.success('Imagem enviada')
      }
    } catch {
      toast.error('Erro ao enviar imagem')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    // Substitui vírgula por ponto para aceitar padrão brasileiro
    const normalizedPrice = form.price.replace(',', '.')
    const priceNum = parseFloat(normalizedPrice)
    
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Preço inválido. Digite um valor maior que zero.')
      return
    }

    const data = {
      name: form.name,
      description: form.description,
      price: priceNum,
      category_id: form.category_id,
      image_url: form.image_url,
      is_featured: form.is_featured || form.featured_slot !== 'none',
      featured_slot: form.featured_slot,
      promotion_label: form.promotion_label,
      promotional_price: form.promotional_price ? parseFloat(form.promotional_price.replace(',', '.')) : undefined,
      discount_percentage: form.discount_percentage ? parseFloat(form.discount_percentage.replace(',', '.')) : undefined,
      ingredient_ids: form.ingredient_ids,
    }

    if (data.category_id === 0) {
      toast.error('Selecione uma categoria')
      return
    }

    try {
      let res;
      if (editing) {
        res = await productsApi.update(editing.id, data)
      } else {
        res = await productsApi.create(data)
      }

      if (res.success) {
        toast.success(editing ? 'Produto atualizado' : 'Produto criado')
        setDialogOpen(false)
        fetchProducts()
      } else {
        toast.error(res.error || 'Erro ao salvar produto')
      }
    } catch (err: any) {
      console.error('[ProductsPage] Error:', err)
      const msg = err.response?.data?.error || 'Erro de conexão ao salvar'
      toast.error(msg)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await productsApi.delete(id)
      toast.success('Produto removido')
      fetchProducts()
    } catch {
      toast.error('Erro ao remover produto')
    }
  }

  const toggleAvailable = async (product: Product) => {
    try {
      await productsApi.update(product.id, { available: !product.available } as never)
      fetchProducts()
    } catch {
      toast.error('Erro ao atualizar disponibilidade')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input 
                    type="text" 
                    value={form.price} 
                    onChange={(e) => setForm({ ...form, price: e.target.value })} 
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select 
                    value={form.category_id.toString()} 
                    onValueChange={(v) => setForm({ ...form, category_id: parseInt(v || '0') })}
                  >
                    <SelectTrigger className="w-full">
                      <span>{capitalize(categories.find(c => c.id === form.category_id)?.name || 'Selecionar')}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {capitalize(cat.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Etiqueta de Destaque</Label>
                  <Input value={form.promotion_label} onChange={(e) => setForm({ ...form, promotion_label: e.target.value })} placeholder="Ex: O Favorito" />
                </div>
                <div className="space-y-2">
                  <Label>Slot da Home</Label>
                  <Select 
                    value={form.featured_slot} 
                    onValueChange={(v) => setForm({ ...form, featured_slot: v || 'none' })}
                  >
                    <SelectTrigger className="w-full">
                      <span>{
                        form.featured_slot === 'hero' ? 'Banner Topo (Hero)' :
                        form.featured_slot === 'bento_1' ? 'Bento Esq (P)' :
                        form.featured_slot === 'bento_2' ? 'Bento Dir (P)' :
                        'Lista Comum'
                      }</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Lista Comum</SelectItem>
                      <SelectItem value="hero">Banner Topo (Hero)</SelectItem>
                      <SelectItem value="bento_1">Bento Esquerdo (P)</SelectItem>
                      <SelectItem value="bento_2">Bento Direito (P)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                   <Label>Desconto (%)</Label>
                   <Input 
                    type="text" 
                    value={form.discount_percentage} 
                    onChange={(e) => {
                      const pctStr = e.target.value.replace(',', '.')
                      const pct = parseFloat(pctStr)
                      const priceStr = form.price.replace(',', '.')
                      const price = parseFloat(priceStr)
                      
                      if (!isNaN(price) && !isNaN(pct)) {
                        const promo = price * (1 - pct / 100)
                        setForm({ ...form, discount_percentage: e.target.value, promotional_price: promo.toFixed(2).replace('.', ',') })
                      } else {
                        setForm({ ...form, discount_percentage: e.target.value })
                      }
                    }} 
                    placeholder="Ex: 10" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Promo (R$)</Label>
                  <Input 
                    type="text" 
                    value={form.promotional_price} 
                    onChange={(e) => setForm({ ...form, promotional_price: e.target.value, discount_percentage: '' })} 
                    placeholder="0,00" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ingredientes</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/30">
                  {allIngredients.map((ing) => {
                    const isSelected = form.ingredient_ids.includes(ing.id)
                    return (
                      <Badge 
                        key={ing.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:scale-105 capitalize"
                        onClick={() => {
                          const newIds = isSelected 
                            ? form.ingredient_ids.filter(id => id !== ing.id)
                            : [...form.ingredient_ids, ing.id]
                          setForm({ ...form, ingredient_ids: newIds })
                        }}
                      >
                        {ing.name}
                      </Badge>
                    )
                  })}
                  {allIngredients.length === 0 && <p className="text-[10px] text-muted-foreground italic">Nenhum ingrediente cadastrado ou carregando...</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagem do Produto</Label>
                <div className="flex items-center gap-4">
                  {form.image_url ? (
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden border bg-muted shrink-0">
                      <Image 
                        src={getFullImageUrl(form.image_url)!} 
                        alt="Preview" 
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      <button 
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                        onClick={() => setForm({...form, image_url: ''})}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted shrink-0">
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      disabled={isUploading}
                      className="text-xs h-9"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Recomendado: 500x500px, PNG ou JPG</p>
                  </div>
                </div>
              </div>

              <Button className="w-full font-bold h-11" onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar Alterações' : 'Criar Produto'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{filtered.length} produtos</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Img</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted border">
                      {(product.image_url || (product as any).imageUrl) ? (
                        <Image 
                          src={getFullImageUrl(product.image_url || (product as any).imageUrl)!} 
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.name}
                    {(product.promotion_label || (product as any).promotionLabel) && (
                      <Badge variant="outline" className="ml-2 h-5 text-[10px] border-amber-500 text-amber-600">
                        {product.promotion_label || (product as any).promotionLabel}
                      </Badge>
                    )}
                    {((product.featured_slot || (product as any).featuredSlot) && (product.featured_slot || (product as any).featuredSlot) !== 'none') && (
                      <Badge variant="default" className="ml-2 h-5 text-[10px] bg-amber-500">
                        {(product.featured_slot || (product as any).featuredSlot) === 'hero' ? 'Hero' : (product.featured_slot || (product as any).featuredSlot) === 'bento_1' ? 'Bento 1' : 'Bento 2'}
                      </Badge>
                    )}
                  </TableCell>
                   <TableCell>
                    <Badge variant="secondary">{capitalize(product.category?.name || 'Sem categoria')}</Badge>
                  </TableCell>
                  <TableCell>
                    {(product.promotional_price || (product as any).promotionalPrice) ? (
                      <div className="flex flex-col">
                        <span className="text-xs line-through text-muted-foreground">{formatCurrency(product.price)}</span>
                        <span className="font-bold text-green-600">{formatCurrency(product.promotional_price || (product as any).promotionalPrice)}</span>
                      </div>
                    ) : (
                      formatCurrency(product.price)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="cursor-pointer"
                      variant={product.available ? 'default' : 'destructive'}
                      onClick={() => toggleAvailable(product)}
                    >
                      {product.available ? 'Disponivel' : 'Indisponivel'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(product)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
