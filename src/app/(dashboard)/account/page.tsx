"use client";

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { usersApi, authApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Lock, Save, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  cashier: 'Caixa',
  kitchen: 'Cozinha',
}

export default function AccountPage() {
  const { user } = useAuth()
  const setUser = useAuthStore((s) => s.setUser)

  const initials = user?.name
    ? (() => {
        const parts = user.name.trim().split(/\s+/)
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      })()
    : '??'

  // ---- Profile form ----
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const handleSaveProfile = async () => {
    if (!user) return
    if (!profile.name.trim() || !profile.email.trim()) {
      toast.error('Nome e email são obrigatórios')
      return
    }
    setSavingProfile(true)
    try {
      const res = await usersApi.update(user.id, {
        name: profile.name.trim(),
        email: profile.email.trim(),
        role: user.role,
      })
      if (res.success && res.data) {
        setUser(res.data)
        toast.success('Perfil atualizado com sucesso')
      }
    } catch {
      // toast already handled by API interceptor
    } finally {
      setSavingProfile(false)
    }
  }

  // ---- Password form ----
  const [pwd, setPwd] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [savingPwd, setSavingPwd] = useState(false)

  const handleChangePassword = async () => {
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      toast.error('Preencha todos os campos de senha')
      return
    }
    if (pwd.next !== pwd.confirm) {
      toast.error('A nova senha e a confirmação não coincidem')
      return
    }
    if (pwd.next.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres')
      return
    }
    setSavingPwd(true)
    try {
      const res = await authApi.changePassword(pwd.current, pwd.next)
      if (res.success) {
        toast.success('Senha alterada com sucesso')
        setPwd({ current: '', next: '', confirm: '' })
      }
    } catch {
      // toast already handled by API interceptor
    } finally {
      setSavingPwd(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie suas informações pessoais e segurança
        </p>
      </div>

      {/* —— Profile Card —— */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-muted-foreground" />
                Informações do perfil
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-normal">
                  {roleLabels[user.role] || user.role}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
            <Save className="h-4 w-4" />
            {savingProfile ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </CardFooter>
      </Card>

      {/* —— Security Card —— */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Segurança
          </CardTitle>
          <CardDescription>
            Altere sua senha. Use uma senha forte com pelo menos 8 caracteres.
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pwd-current">Senha atual</Label>
            <Input
              id="pwd-current"
              type="password"
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pwd-next">Nova senha</Label>
              <Input
                id="pwd-next"
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd-confirm">Confirmar nova senha</Label>
              <Input
                id="pwd-confirm"
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <Button onClick={handleChangePassword} disabled={savingPwd} variant="outline" className="gap-2">
            <KeyRound className="h-4 w-4" />
            {savingPwd ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
