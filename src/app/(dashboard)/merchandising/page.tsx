"use client";

import { useEffect, useState } from 'react'
import { merchandisingApi, productsApi } from '@/api/client'
import type { MerchandisingSection, Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Layout, Boxes, List, Grid3X3, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { extractMessage } from '@/lib/errors'

export default function MerchandisingPage() {
  const [sections, setSections] = useState<MerchandisingSection[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    layout_type: 'horizontal_list',
    order_index: 0,
    active: true,
    product_ids: [] as number[]
  })
  const [editing, setEditing] = useState<MerchandisingSection | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Usamos o endpoint de admin para ver inclusive seções inativas
      const [secRes, prodRes] = await Promise.all([
        merchandisingApi.getAllAdmin(),
        productsApi.getAll()
      ])
      
      if (secRes.success && secRes.data) {
        setSections(secRes.data)
      } else if (secRes.error) {
        console.error('[VITRINE] Erro API Sec:', secRes.error)
        toast.error(`Erro ao carregar seções: ${secRes.error}`)
      }

      if (prodRes.success && prodRes.data) {
        setAllProducts(prodRes.data)
      }
    } catch (err) {
      const msg = extractMessage(err)
      console.error('[VITRINE] Falha no carregamento:', err)
      toast.error(`Falha crítica ao carregar dados: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({
      title: '',
      subtitle: '',
      layout_type: 'horizontal_list',
      order_index: 0,
      active: true,
      product_ids: []
    })
    setDialogOpen(true)
  }

  const handleEdit = (section: MerchandisingSection) => {
    setEditing(section)
    setForm({
      title: section.title,
      subtitle: section.subtitle || '',
      layout_type: section.layout_type as any,
      order_index: section.order_index,
      active: section.active,
      product_ids: section.products?.map(p => p.id as unknown as number) || []
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta seção da vitrine?')) return

    try {
      const res = await merchandisingApi.deleteSection(id)
      if (res.success) {
        toast.success('Seção removida com sucesso')
        fetchData()
      } else {
        toast.error(`Não foi possível excluir: ${res.error}`)
      }
    } catch (err) {
      const msg = extractMessage(err)
      console.error('[VITRINE] Erro ao excluir:', err)
      toast.error(`Erro ao excluir seção: ${msg}`)
    }
  }

  const handleSubmit = async () => {
    if (!form.title) return toast.error('Título é obrigatório')

    try {
      const res = editing 
        ? await merchandisingApi.updateSection(editing.id as unknown as number, form)
        : await merchandisingApi.createSection(form)

      if (res.success) {
        toast.success(editing ? 'Seção atualizada com sucesso' : 'Seção criada e publicada')
        setDialogOpen(false)
        fetchData()
      } else {
        toast.error(`Erro ao salvar: ${res.error}`)
      }
    } catch (err) {
      const msg = extractMessage(err)
      console.error('[VITRINE] Erro no submit:', err)
      toast.error(`Falha ao salvar seção: ${msg}`)
    }
  }

  const toggleProduct = (productId: number) => {
    setForm(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão da Vitrine (Home)</h1>
          <p className="text-muted-foreground">Configure as seções e destaques que aparecem no seu App.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={(props) => <Button {...props} onClick={openCreate} />}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Seção
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Seção' : 'Criar Nova Seção'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Título da Seção</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Clássicos da Casa" />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo (Opcional)</Label>
                  <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Ex: Os burgers mais amados" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Layout</Label>
                  <Select value={form.layout_type} onValueChange={(v) => setForm({ ...form, layout_type: v as any })}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                         {form.layout_type === 'hero' && <Boxes className="h-4 w-4" />}
                         {form.layout_type === 'bento' && <Grid3X3 className="h-4 w-4" />}
                         {form.layout_type === 'horizontal_list' && <List className="h-4 w-4" />}
                         <span>{
                           form.layout_type === 'hero' ? 'Destaque Gigante (Hero)' :
                           form.layout_type === 'bento' ? 'Grade Mosaico (Bento)' :
                           'Lista Horizontal (Carrossel)'
                         }</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Destaque Gigante (Hero)</SelectItem>
                      <SelectItem value="bento">Grade Mosaico (Bento)</SelectItem>
                      <SelectItem value="horizontal_list">Lista Horizontal (Carrossel)</SelectItem>
                      <SelectItem value="grid">Grade Padrão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ordem de Exibição / Prioridade</Label>
                  <Input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox 
                  id="active" 
                  checked={form.active} 
                  onCheckedChange={(checked) => setForm({ ...form, active: !!checked })}
                />
                <Label htmlFor="active" className="cursor-pointer">Seção Ativa (Pública)</Label>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-bold text-sm">Selecionar Produtos nesta Seção</Label>
                  <Badge variant="secondary">{form.product_ids.length} selecionados</Badge>
                </div>
                <div className="max-h-72 overflow-y-auto border rounded-md p-2 flex flex-col gap-2">
                  {allProducts.map(product => (
                    <div 
                      key={product.id} 
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                        form.product_ids.includes(product.id as number) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleProduct(product.id as number)}
                    >
                      <Checkbox checked={form.product_ids.includes(product.id as number)} />
                      <span className="text-xs font-medium truncate">{product.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full h-11" onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                {editing ? 'Salvar Alterações' : 'Publicar Seção'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading && sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Layout className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">Carregando vitrine...</p>
          </div>
        ) : (
          sections.sort((a,b) => a.order_index - b.order_index).map((section) => (
            <Card key={section.id} className={!section.active ? 'opacity-60 grayscale-[0.5]' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Layout className={`h-5 w-5 ${section.active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{section.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize text-[10px]">
                     {section.layout_type}
                  </Badge>
                  <Badge variant={section.active ? 'default' : 'outline'} className={!section.active ? 'border-dashed' : ''}>
                    {section.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <div className="flex gap-1 ml-4">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(section)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                      onClick={() => handleDelete(section.id as unknown as number)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {section.products?.map(p => (
                    <Badge key={p.id} variant="outline" className="shrink-0 h-6 text-[10px]">
                      {p.name}
                    </Badge>
                  ))}
                  {(!section.products || section.products.length === 0) && (
                    <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Nenhum produto selecionado
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {!isLoading && sections.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
             <Layout className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-20" />
             <p className="text-muted-foreground">Nenhuma seção configurada ainda.</p>
             <Button variant="link" onClick={openCreate}>Comece criando sua primeira seção</Button>
          </div>
        )}
      </div>
    </div>
  )
}
