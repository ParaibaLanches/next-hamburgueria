"use client";

import { useEffect, useState } from 'react'
import { usersApi, authApi } from '@/api/client'
import type { UserResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  cashier: 'Caixa',
  kitchen: 'Cozinha',
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  admin: 'destructive',
  cashier: 'default',
  kitchen: 'secondary',
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UserResponse | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier' })

  const fetchUsers = async () => {
    const res = await usersApi.getAll()
    if (res.success && res.data) setUsers(res.data)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', email: '', password: '', role: 'cashier' })
    setDialogOpen(true)
  }

  const openEdit = (user: UserResponse) => {
    setEditing(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editing) {
        await usersApi.update(editing.id, { name: form.name, email: form.email, role: form.role })
        toast.success('Usuario atualizado')
      } else {
        await authApi.register({ name: form.name, email: form.email, password: form.password })
        toast.success('Usuario criado')
      }
      setDialogOpen(false)
      fetchUsers()
    } catch {
      toast.error('Erro ao salvar usuario')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await usersApi.delete(id)
      toast.success('Usuario removido')
      fetchUsers()
    } catch {
      toast.error('Erro ao remover usuario')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuario
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Usuario' : 'Novo Usuario'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {!editing && (
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Funcao</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v || '' })}>
                <SelectTrigger className="w-full">
                  <span>{roleLabels[form.role] || 'Selecionar'}</span>
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="cashier">Caixa</SelectItem>
                    <SelectItem value="kitchen">Cozinha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{users.length} usuarios</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Funcao</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[user.role] || 'secondary'}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(user)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(user.id)}>
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
