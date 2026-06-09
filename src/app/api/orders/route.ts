import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { appEmitter } from '@/lib/events'
import { orderSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    
    const whereClause = status ? { status } : {}

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        data: orders,
        total: orders.length,
        page: 1,
        limit: 100
      }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = orderSchema.parse(await req.json())
    } catch (e: any) {
      if (e && e.name === 'ZodError') {
        return NextResponse.json({ success: false, message: e.errors?.[0]?.message || 'Validation error' }, { status: 400 })
      }
      throw e;
    }
    const { orderType, status, total, notes, deliveryFee, deliveryDistance, discountAmount, customerId, items, payments } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Order must have items' }, { status: 400 })
    }

    // Generate random code like "A1B2"
    const code = Math.random().toString(36).substring(2, 6).toUpperCase()

    // Find active closure to attach to this order
    const activeClosure = await prisma.closure.findFirst({
      where: { status: 'open' }
    })

    const order = await prisma.order.create({
      data: {
        code,
        orderType: orderType || 'local',
        total,
        notes,
        deliveryFee: deliveryFee || 0,
        deliveryDistance: deliveryDistance || 0,
        discountAmount: discountAmount || 0,
        customerId: customerId ? parseInt(customerId.toString()) : null,
        closureId: activeClosure?.id,
        items: {
          create: items.map((item: { product_id: string | number; quantity: number; unit_price?: number; notes?: string }) => ({
            productId: parseInt(item.product_id.toString()),
            quantity: item.quantity,
            unitPrice: item.unit_price || 0,
            notes: item.notes
          }))
        },
        payments: payments ? {
          create: payments.map((payment: { method: string; amount: number }) => ({
            method: payment.method,
            amount: payment.amount
          }))
        } : undefined
      },
      include: {
        items: { include: { product: true } },
        payments: true
      }
    })

    // Emit event for real-time updates
    appEmitter.emit('new_order', order)

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
