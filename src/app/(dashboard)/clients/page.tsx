"use client";

import { useState, useEffect } from 'react'
import { clientsApi } from '@/api/client'
import type { Client } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { maskDocument, maskPhone, unmask, maskCEP } from '@/lib/masks'

export default function ClientsPage() {
  const { isAdmin } = useAuth()
  const { isUnmasked } = useAuthStore()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  
  // Forms states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  
  // Structured Address States
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [complement, setComplement] = useState('')
  const [isFetchingCep, setIsFetchingCep] = useState(false)

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const res = await clientsApi.getAll(isUnmasked)
      if (res.success && res.data) {
        setClients(res.data)
      }
    } catch (err) {
      toast.error('Erro ao buscar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [isUnmasked])

  const handleCepChange = async (value: string) => {
    const cleanCep = value.replace(/\D/g, '')
    setCep(cleanCep)
    
    if (cleanCep.length === 8) {
      setIsFetchingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setStreet(data.logradouro || '')
          setNeighborhood(data.bairro || '')
          setCity(data.localidade || '')
          setState(data.uf || '')
          toast.success('Endereço localizado!')
        }
      } catch (err) {
        console.error('ViaCEP error:', err)
      } finally {
        setIsFetchingCep(false)
      }
    }
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.document && c.document.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const openNewClientModal = () => {
    setIsEditing(false)
    setCurrentId(null)
    setName('')
    setEmail('')
    setPassword('')
    setDocument('')
    setPhone('')
    setAddress('')
    setCep('')
    setStreet('')
    setNumber('')
    setNeighborhood('')
    setCity('')
    setState('')
    setComplement('')
    setIsModalOpen(true)
  }

  const openEditModal = async (client: Client) => {
    setIsEditing(true)
    setCurrentId(client.id)
    
    try {
      const res = await clientsApi.getById(client.id)
      if (res.success && res.data) {
        const full = res.data
        setName(full.name)
        setEmail(full.email)
        setPassword('')
        setDocument(full.document || '')
        setPhone(full.phone || '')
        setAddress(full.address || '')
        setCep(full.cep || '')
        setStreet(full.street || '')
        setNumber(full.number || '')
        setNeighborhood(full.neighborhood || '')
        setCity(full.city || '')
        setState(full.state || '')
        setComplement(full.complement || '')
        setIsModalOpen(true)
      } else {
        toast.error('Erro ao buscar dados completos')
      }
    } catch {
      toast.error('Erro de rede')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza? Isso pode falhar se ele tiver pedidos no histórico.')) return
    try {
      const res = await clientsApi.delete(id)
      if (res.success) {
        toast.success('Cliente removido')
        fetchClients()
      } else {
        toast.error(res.error || 'Erro ao remover cliente')
      }
    } catch {
      toast.error('Erro de servidor')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { 
        name, 
        email, 
        document: unmask(document), 
        phone: unmask(phone), 
        address: address || `${street}, ${number} - ${city}`,
        cep,
        street,
        number,
        neighborhood,
        city,
        state,
        complement
      }

      if (isEditing && currentId) {
        const res = await clientsApi.update(currentId, payload)
        if (res.success) {
          toast.success('Cliente atualizado')
          setIsModalOpen(false)
          fetchClients()
        } else {
          toast.error(res.error || 'Não foi possível salvar os dados.')
        }
      } else {
        if (password.length < 6) {
          toast.error('A senha base deve ter ao menos 6 dígitos')
          return
        }
        const createPayload = { ...payload, password }
        const res = await clientsApi.create(createPayload)
        if (res.success) {
          toast.success('Cliente registrado!')
          setIsModalOpen(false)
          fetchClients()
        } else {
          toast.error(res.error || 'Falha ao criar')
        }
      }
    } catch (err: any) {
      console.error('[ClientsPage] Submit Error:', err)
      const msg = err.response?.data?.error || err.message || 'Erro de conexão com o servidor'
      toast.error(msg)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-center">
        <h2 className="text-xl text-muted-foreground font-semibold flex flex-col gap-2 items-center">
          <Users className="w-12 h-12 text-destructive" />
          Acesso Restrito LGPD
          <span className="text-sm font-normal">Visualização permitida apenas a administradores.</span>
        </h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
        <div className="flex items-center gap-3">
          <Button onClick={openNewClientModal}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Base de Clientes Unificados</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(maskDocument(e.target.value))}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Endereço Completo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">Carregando carteira...</TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhum cliente mapeado.</TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-mono text-muted-foreground">#{client.id}</TableCell>
                      <TableCell className="font-semibold">{client.name || 'Sem Nome'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">{client.email}</span>
                          <span className="text-muted-foreground">{client.phone ? maskPhone(client.phone) : '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">
                            {client.street ? `${client.street}, ${client.number}` : client.address || '-'}
                          </span>
                          <span className="text-muted-foreground">
                            {client.neighborhood ? `${client.neighborhood} - ` : ''}
                            {client.city || '-'}{client.state ? `/${client.state}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{client.document ? maskDocument(client.document) : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(client)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Ficha Cadastral' : 'Novo Registro de Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto max-h-[70vh] pr-2">
            <div className="space-y-4 border-b pb-4">
              <h4 className="text-sm font-medium text-muted-foreground">Informações Básicas</h4>
              <div className="grid gap-2">
                <Label>Nome Completo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" />
              </div>
              <div className="grid gap-2">
                <Label>E-mail (Login)</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {!isEditing && (
                <div className="grid gap-2">
                  <Label>Senha Provisória</Label>
                  <Input type="text" placeholder="mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>CPF/CNPJ</Label>
                  <Input value={document} onChange={(e) => setDocument(maskDocument(e.target.value))} />
                </div>
                <div className="grid gap-2">
                  <Label>Celular</Label>
                  <Input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(83) 98888-7777" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Endereço de Entrega</h4>
                {isFetchingCep && <span className="text-[10px] text-blue-500 animate-pulse">Buscando CEP...</span>}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2 col-span-1">
                  <Label>CEP</Label>
                  <Input value={maskCEP(cep)} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label>Rua/Logradouro</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Número</Label>
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label>Complemento</Label>
                  <Input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, Bloco..." />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Bairro</Label>
                <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="grid gap-2 col-span-3">
                  <Label>Cidade</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>UF</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className="uppercase" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4">
              {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
