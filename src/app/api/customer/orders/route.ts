import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { appEmitter } from '@/lib/events'
import { ProcessPaymentUseCase } from '@/core/usecases/orders/process-payment.usecase'

async function getClientFromToken(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token) as any
  if (!decoded || !decoded.id || decoded.role !== 'customer') return null

  return prisma.client.findUnique({ where: { id: decoded.id } })
}

export async function GET(req: Request) {
  try {
    const client = await getClientFromToken(req)
    if (!client) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { customerId: client.id },
      include: {
        items: { include: { product: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: orders.map(order => ({
        ...order,
        order_type: order.orderType,
        delivery_fee: order.deliveryFee ? Number(order.deliveryFee) : 0,
        subtotal: order.subtotal ? Number(order.subtotal) : Number(order.total),
        total: Number(order.total),
        discount: order.discountAmount ? Number(order.discountAmount) : 0,
        items: order.items.map(item => ({
          ...item,
          order_id: item.orderId,
          product_id: item.productId,
          unit_price: Number(item.unitPrice),
          product: {
            ...item.product,
            category_id: item.product.categoryId,
            image_url: item.product.imageUrl,
            price: Number(item.product.price)
          }
        })),
        payments: order.payments.map(payment => ({
          ...payment,
          amount: Number(payment.amount)
        }))
      }))
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const client = await getClientFromToken(req)
    if (!client) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { order_type, notes, items, payments } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Pedido deve conter itens' }, { status: 400 })
    }

    // Securely calculate totals based on database prices
    let calculatedTotal = 0
    const processedItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: parseInt(item.product_id.toString()) } })
      if (!product) {
        return NextResponse.json({ success: false, message: `Produto ${item.product_id} não encontrado` }, { status: 400 })
      }

      const unitPrice = product.promotionalPrice ? Number(product.promotionalPrice) : Number(product.price)
      calculatedTotal += unitPrice * item.quantity

      processedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: unitPrice,
        notes: item.notes || ''
      })
    }

    const code = Math.random().toString(36).substring(2, 6).toUpperCase()

    const order = await prisma.order.create({
      data: {
        code,
        orderType: order_type || 'delivery',
        total: calculatedTotal,
        subtotal: calculatedTotal,
        notes: notes || '',
        customerId: client.id,
        items: {
          create: processedItems
        },
        payments: payments ? {
          create: payments.map((payment: any) => ({
            method: payment.method,
            amount: Number(payment.amount)
          }))
        } : undefined
      },
      include: {
        items: { include: { product: true } },
        payments: true
      }
    })

    // Emit event for real-time updates to admin PDV
    appEmitter.emit('new_order', order)

    // Check if we need to process external payment (Stripe)
    let paymentIntent = null
    const onlinePayment = payments?.find((p: any) => p.method === 'pix' || p.method === 'credit_card')
    
    if (onlinePayment) {
      paymentIntent = await ProcessPaymentUseCase.execute(order.id, onlinePayment.method, calculatedTotal)
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...order, 
        order_type: order.orderType,
        payment_intent: paymentIntent 
      } 
    }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
