import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { appEmitter } from '@/lib/events'

// Need dynamic to prevent static generation of stream
export const dynamic = 'force-dynamic'

async function getClientFromToken(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) return null

  const decoded = verifyToken(token) as any
  if (!decoded || !decoded.id || decoded.role !== 'customer') return null

  return prisma.client.findUnique({ where: { id: decoded.id } })
}

export async function GET(req: Request) {
  const client = await getClientFromToken(req)
  
  if (!client) {
    return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
  }

  const encoder = new TextEncoder()
  const customReadable = new ReadableStream({
    start(controller) {
      const emitOrderUpdate = (orderData: any) => {
        // Only send updates for this client's orders
        if (orderData.customerId === client.id) {
          const formattedEvent = {
            event: 'order_updated',
            data: orderData,
            message: `O status do pedido #${orderData.id} mudou para ${orderData.status}`,
            timestamp: new Date().toISOString(),
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(formattedEvent)}\n\n`))
        }
      }

      appEmitter.on('order_updated', emitOrderUpdate)

      // Send initial heartbeat to establish connection
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'Conectado aos eventos do cliente' })}\n\n`))

      req.signal.addEventListener('abort', () => {
        appEmitter.off('order_updated', emitOrderUpdate)
        controller.close()
      })
    }
  })

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
