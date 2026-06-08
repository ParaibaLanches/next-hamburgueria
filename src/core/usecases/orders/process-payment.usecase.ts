import prisma from '@/lib/prisma'
import { PaymentGateway, PaymentIntentResponse } from '../../interfaces/payment.gateway'
import { StripeGateway } from '../../infrastructure/stripe.gateway'

const paymentGateway: PaymentGateway = new StripeGateway()

export class ProcessPaymentUseCase {
  static async execute(orderId: number, method: string, amount: number): Promise<PaymentIntentResponse | null> {
    
    if (method !== 'pix' && method !== 'credit_card') {
      return null
    }

    let paymentIntent: PaymentIntentResponse

    if (method === 'pix') {
      paymentIntent = await paymentGateway.createPixPayment(amount, { orderId: orderId.toString() })
    } else {
      paymentIntent = await paymentGateway.createCreditCardPayment(amount, { orderId: orderId.toString() })
    }

    // Update the payment record in the DB that matches this order and method (pending)
    // Actually, we can just find the payment created in the transaction and update it.
    const payment = await prisma.payment.findFirst({
      where: { orderId, method }
    })

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerId: paymentIntent.id,
          status: 'pending_payment'
        }
      })
    } else {
      // Fallback if not created yet
      await prisma.payment.create({
        data: {
          orderId,
          method,
          amount,
          providerId: paymentIntent.id,
          status: 'pending_payment'
        }
      })
    }

    // Update order status to pending_payment if we are holding for Stripe
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'pending_payment' }
    })

    return paymentIntent
  }
}
