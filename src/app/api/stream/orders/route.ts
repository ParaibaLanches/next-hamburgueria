import { appEmitter } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Send a ping immediately to open connection
      controller.enqueue(encoder.encode(': connected\n\n'))

      // Keep connection alive with periodic pings (every 30s)
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(pingInterval)
        }
      }, 30000)

      // Listeners
      const handleNewOrder = (order: unknown) => {
        try {
          const data = JSON.stringify({ event: 'new_order', data: order })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch (error) {
          console.error("Erro ao emitir new_order:", error)
        }
      }

      const handleOrderUpdated = (order: unknown) => {
        try {
          const data = JSON.stringify({ event: 'order_updated', data: order })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch (error) {
          console.error("Erro ao emitir order_updated:", error)
        }
      }

      appEmitter.on('new_order', handleNewOrder)
      appEmitter.on('order_updated', handleOrderUpdated)

      // Clean up when client disconnects
      req: Request // Dummy var to satisfy Next.js signature if needed, but not required
      
      // We can hook into the stream cancellation
      // @ts-ignore
      controller.abort = () => {
        clearInterval(pingInterval)
        appEmitter.off('new_order', handleNewOrder)
        appEmitter.off('order_updated', handleOrderUpdated)
      }
    },
    cancel() {
      // Cleanup
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
