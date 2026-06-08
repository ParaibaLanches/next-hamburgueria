import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { appEmitter } from '@/lib/events'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const { status } = await req.json()

    if (!status) {
      return NextResponse.json({ success: false, message: 'Status is required' }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true
      }
    })

    // Emit event for real-time updates
    appEmitter.emit('order_updated', order)

    return NextResponse.json({ success: true, data: order })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
