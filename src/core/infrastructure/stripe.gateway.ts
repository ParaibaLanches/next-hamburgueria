import Stripe from 'stripe'
import { PaymentGateway, PaymentIntentResponse } from '../interfaces/payment.gateway'

export class StripeGateway implements PaymentGateway {
  private stripe: Stripe

  constructor() {
    // If not set, use a mock key so it doesn't crash in dev before configuring
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_123', {
      apiVersion: '2023-10-16' as any, // Using stable typing, actual API version might differ
    })
  }

  async createPixPayment(amount: number, metadata?: Record<string, string>): Promise<PaymentIntentResponse> {
    // DEV MODE: Mock payment if no real key is provided
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock_123') {
      const mockId = `pi_mock_${Date.now()}`
      console.log('\n=============================================')
      console.log('💳 MOCK PIX PAYMENT CREATED')
      console.log(`To simulate payment success, run this command in your terminal:`)
      console.log(`curl -X POST http://localhost:3000/api/dev/stripe-mock-pay -H "Content-Type: application/json" -d '{"providerId":"${mockId}"}'`)
      console.log('=============================================\n')

      return {
        id: mockId,
        clientSecret: 'secret_mock_123',
        status: 'requires_payment_method',
        qrCodeUrl: 'https://mock.stripe.com/qr',
        pixCopyPaste: `00020101021226580014br.gov.bcb.pix0136mock-payment-key-12345204000053039865404${amount}5802BR5916Hamburgueria Mock6009SAO PAULO62070503***6304ABCD`,
      }
    }

    const amountInCents = Math.round(amount * 100)
    
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'brl',
      payment_method_types: ['pix'],
      metadata,
    })

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      status: paymentIntent.status,
      // The pix_display_details are usually only available after creation
      // or we might need to retrieve it, but next_action contains it.
      // Note: 'pix_display_details' is cast to any as Stripe Node types might lag for specific regional methods
      qrCodeUrl: (paymentIntent.next_action as any)?.pix_display_details?.hosted_instructions_url,
      pixCopyPaste: (paymentIntent.next_action as any)?.pix_display_details?.expires_at ? 
        (paymentIntent.next_action as any)?.pix_display_details?.pix_string : undefined,
    }
  }

  async createCreditCardPayment(amount: number, metadata?: Record<string, string>): Promise<PaymentIntentResponse> {
    // DEV MODE: Mock payment if no real key is provided
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock_123') {
      return {
        id: `pi_mock_cc_${Date.now()}`,
        clientSecret: 'secret_mock_cc_123',
        status: 'requires_payment_method',
      }
    }

    const amountInCents = Math.round(amount * 100)
    
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'brl',
      payment_method_types: ['card'],
      metadata,
    })

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      status: paymentIntent.status,
    }
  }
}
