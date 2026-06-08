import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { appEmitter } from '@/lib/events'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_123', {
  apiVersion: '2023-10-16' as any,
})

export async function POST(req: Request) {
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
    } else {
      // For development without secrets
      event = JSON.parse(payload) as Stripe.Event
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        const payment = await prisma.payment.findFirst({
          where: { providerId: paymentIntent.id }
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
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object as Stripe.PaymentIntent
        const failedPayment = await prisma.payment.findFirst({
          where: { providerId: failedIntent.id }
        })
        if (failedPayment) {
          await prisma.payment.update({
            where: { id: failedPayment.id },
            data: { status: 'failed' }
          })
          await prisma.order.update({
            where: { id: failedPayment.orderId },
            data: { status: 'cancelled' }
          })
        }
        break;
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Stripe Webhook error:', err)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }
}
