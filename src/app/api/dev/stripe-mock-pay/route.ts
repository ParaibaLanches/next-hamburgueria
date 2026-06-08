import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { appEmitter } from '@/lib/events'

export async function POST(req: Request) {
  try {
    const { providerId } = await req.json()
    if (!providerId) return NextResponse.json({ error: 'providerId is required' }, { status: 400 })

    const payment = await prisma.payment.findFirst({
      where: { providerId }
    })

    if (payment && payment.status !== 'paid') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'paid' }
      })

      const updatedOrder = await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'preparing' },
        include: { 
          items: { include: { product: true } },
          payments: true
        }
      })

      appEmitter.emit('order_updated', updatedOrder)
      return NextResponse.json({ success: true, message: 'Mock payment succeeded!', order: updatedOrder.code })
    }

    return NextResponse.json({ success: false, message: 'Payment not found or already paid' }, { status: 404 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
