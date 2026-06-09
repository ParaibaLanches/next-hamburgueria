'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ingredientsApi } from '@/api/client'
import type { Ingredient } from '@/types'
import { formatDate } from '@/lib/utils'

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [form, setForm] = useState({ name: '' })

  const loadData = async () => {
    try {
      const res = await ingredientsApi.getAll()
      if (res.success && res.data) {
        setIngredients(res.data)
      }
    } catch (error: any) {
      toast.error('Erro ao carregar ingredientes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async () => {
    if (!form.name.trim()) {
      return toast.error('O nome do ingrediente é obrigatório')
    }

    try {
      if (editing) {
        await ingredientsApi.update(editing.id, { name: form.name })
        toast.success('Ingrediente atualizado com sucesso')
      } else {
        await ingredientsApi.create({ name: form.name })
        toast.success('Ingrediente criado com sucesso')
      }
      setDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este ingrediente?')) return
    
    try {
      await ingredientsApi.delete(id)
      toast.success('Ingrediente excluído com sucesso')
      loadData()
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '' })
    setDialogOpen(true)
  }

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient)
    setForm({ name: ingredient.name })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Ingredientes</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Lista de Ingredientes</CardTitle>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Novo Ingrediente
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Carregando...</div>
          ) : ingredients.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Nenhum ingrediente cadastrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">#{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.createdAt ? formatDate(item.createdAt) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Edit2 className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Ingrediente' : 'Novo Ingrediente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input 
                placeholder="Ex: Bacon, Cheddar..." 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
