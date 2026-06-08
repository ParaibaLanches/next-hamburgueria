import * as React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { WS_URL } from '@/lib/config'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  cashier: 'Caixa',
  kitchen: 'Cozinha',
}

export default function Header({ wsStatus }: { wsStatus?: 'connecting' | 'open' | 'closed' | 'error' }) {
  const { user, logout, isAdmin } = useAuth()
  const { isUnmasked, toggleUnmask } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const initials = React.useMemo(() => {
    if (!user?.name) return '??'
    const parts = user.name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [user])

  if (!user) return null

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {isAdmin && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleUnmask}
            className={`h-9 px-3 font-bold transition-all ${isUnmasked ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-inner' : 'text-muted-foreground'}`}
          >
            {isUnmasked ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            <span className="hidden md:inline">
              {isUnmasked ? 'DADOS VISÍVEIS' : 'DADOS OCULTOS'}
            </span>
            {isUnmasked && <ShieldCheck className="h-3 w-3 ml-2 animate-pulse text-blue-500" />}
          </Button>
        )}

        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border text-[10px] font-medium tracking-wider uppercase transition-all"
          title={`URL: ${WS_URL}`}
        >
          <div className={
            `h-2 w-2 rounded-full animate-pulse transition-colors ${
              wsStatus === 'open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
              wsStatus === 'connecting' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
              'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]'
            }`
          } />
          <span className="hidden sm:inline">
            {wsStatus === 'open' ? 'Sincronizado' :
             wsStatus === 'connecting' ? 'Conectando...' : 
             'Sem Conexão'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button {...props} variant="ghost" className="flex items-center gap-2.5 px-2 h-9">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:flex flex-col gap-0.5">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {roleLabels[user.role] || user.role}
                  </span>
                </div>
              </Button>
            )}
          />
          <DropdownMenuContent align="end" className="w-56 p-2">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-2 py-2">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/account')} className="cursor-pointer gap-2 px-2">
              <User className="h-4 w-4" />
              Minha conta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 cursor-pointer gap-2 px-2">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
