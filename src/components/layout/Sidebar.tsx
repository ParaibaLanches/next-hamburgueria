import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  Users,
  Tag,
  UtensilsCrossed,
  FileText,
  ChevronLeft,
  Menu,
  Contact,
  Settings,
  Ticket,
  Layout,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/stores/configStore'

const navGroups = [
  {
    title: 'Operacional',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'cashier', 'kitchen'] },
      { to: '/orders', icon: ClipboardList, label: 'Pedidos', roles: ['admin', 'cashier', 'kitchen'] },
      { to: '/orders/history', icon: FileText, label: 'Histórico', roles: ['admin', 'cashier', 'kitchen'] },
      { to: '/new-order', icon: ShoppingCart, label: 'Novo Pedido', roles: ['admin', 'cashier'] },
      { to: '/closures', icon: Tag, label: 'Fechamento', roles: ['admin', 'cashier'] },
    ]
  },
  {
    title: 'Administração',
    items: [
      { to: '/clients', icon: Contact, label: 'Clientes', roles: ['admin'] },
      { to: '/products', icon: Package, label: 'Produtos', roles: ['admin'] },
      { to: '/categories', icon: Tag, label: 'Categorias', roles: ['admin'] },
      { to: '/ingredients', icon: UtensilsCrossed, label: 'Ingredientes', roles: ['admin'] },
      { to: '/coupons', icon: Ticket, label: 'Cupons', roles: ['admin'] },
      { to: '/users', icon: Users, label: 'Usuarios', roles: ['admin'] },
      { to: '/settings', icon: Settings, label: 'Ajustes', roles: ['admin'] },
    ]
  }
]

export default function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const { getBool, getSetting } = useConfigStore()
  const [isExpanded, setIsExpanded] = useState(!getBool('sidebar_collapsed_default', false))
  const appName = getSetting('app_name', 'Paraíba Lanches')

  return (
    <aside className={cn(
      "bg-sidebar text-sidebar-foreground flex flex-col min-h-screen border-r border-sidebar-border transition-all duration-300 relative",
      isExpanded ? "w-64" : "w-20"
    )}>
      <div className={cn("p-6 flex items-center gap-3 border-b border-sidebar-border h-[88px]", !isExpanded && "px-0 justify-center")}>
        <div className="bg-sidebar-primary rounded-lg min-w-10 min-h-10 flex items-center justify-center shrink-0">
          <UtensilsCrossed className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {isExpanded && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-lg leading-tight truncate">{appName}</h1>
            <p className="text-xs text-sidebar-foreground/60 truncate">Sistema PDV</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-7 bg-sidebar border border-sidebar-border rounded-full p-1 text-sidebar-foreground hover:bg-sidebar-accent transition-colors z-20"
      >
        {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group) => {
          const filteredItems = group.items.filter(
            (item) => user && item.roles.includes(user.role)
          )

          if (filteredItems.length === 0) return null

          return (
            <div key={group.title} className="space-y-1">
              {isExpanded && (
                <h2 className="px-3 text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/40 mb-2">
                  {group.title}
                </h2>
              )}
              {filteredItems.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  title={!isExpanded ? item.label : undefined}
                  className={
                    cn(
                      'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                      isExpanded ? 'px-3 py-2' : 'justify-center p-3',
                      (item.to === '/orders' ? pathname === '/orders' : (pathname === item.to || (item.to !== '/' && pathname?.startsWith(item.to))))
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {isExpanded && <span className="truncate">{item.label}</span>}
                </Link>
              ))}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
