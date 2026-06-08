export interface PaymentIntentResponse {
  id: string
  clientSecret: string
  status: string
  qrCodeUrl?: string
  pixCopyPaste?: string
}

export interface PaymentGateway {
  createPixPayment(amount: number, metadata?: Record<string, string>): Promise<PaymentIntentResponse>
  createCreditCardPayment(amount: number, metadata?: Record<string, string>): Promise<PaymentIntentResponse>
}
