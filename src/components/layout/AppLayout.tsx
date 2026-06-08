import { useCallback } from 'react'

import Sidebar from './Sidebar'
import Header from './Header'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useOrderStore } from '@/stores/orderStore'
import { toast } from 'sonner'
import type { WSMessage } from '@/types'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { addFromWebSocket } = useOrderStore()

  const handleWSMessage = useCallback((msg: WSMessage) => {
    if (msg.event === 'new_order') {
      const { lastCreatedOrderId, setLastCreatedOrderId } = useOrderStore.getState()
      
      // Se este ID foi criado localmente agorinha, não mostramos a notificação redundante
      const isMyOwnOrder = lastCreatedOrderId === msg.data.id
      
      addFromWebSocket(msg.data)
      
      if (!isMyOwnOrder) {
        // Som de notificação apenas para novos pedidos externos
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
        audio.play().catch(e => console.debug("Audio play blocked by browser:", e))

        toast.success(`Novo pedido ${msg.data.code}`, {
          description: `Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(msg.data.total)}`,
          duration: 5000,
        })
      } else {
        // Limpa o marcador pois já processamos o broadcast do nosso próprio pedido
        setLastCreatedOrderId(null)
      }
    } else if (msg.event === 'order_updated') {
      const { lastStatusUpdate, setLastStatusUpdate } = useOrderStore.getState()
      
      // Verifica se fomos nós que acabamos de atualizar este status
      const isMyOwnUpdate = lastStatusUpdate?.id === msg.data.id && lastStatusUpdate?.status === msg.data.status
      
      addFromWebSocket(msg.data)
      
      if (!isMyOwnUpdate) {
        toast.info(`Pedido ${msg.data.code} atualizado`, {
          description: `Status: ${msg.data.status}`,
          duration: 3000,
        })
      } else {
        // Limpa o marcador
        setLastStatusUpdate(null)
      }
    }
  }, [addFromWebSocket])

  const { status: wsStatus } = useWebSocket(handleWSMessage)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header wsStatus={wsStatus} />
        <main className="flex-1 p-6 bg-muted/30 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
