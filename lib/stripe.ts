import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18',
})

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  client_secret: string
}

// 支払いインテントを作成
export async function createPaymentIntent(
  amount: number,
  currency: string = 'jpy',
  metadata?: Record<string, string>
): Promise<PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret!,
    }
  } catch (error) {
    console.error('Failed to create payment intent:', error)
    throw new Error('Payment intent creation failed')
  }
}

// 支払いインテントの状態を確認
export async function getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret!,
    }
  } catch (error) {
    console.error('Failed to retrieve payment intent:', error)
    return null
  }
}

// Webhookの署名を検証
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}

// 金額をStripe形式（最小単位）に変換
export function convertToStripeAmount(amount: number, currency: string = 'jpy'): number {
  // 日本円は最小単位が1円なのでそのまま
  if (currency === 'jpy') {
    return amount
  }
  
  // その他の通貨（USD等）は通常100倍（セント単位）
  return Math.round(amount * 100)
}

// Stripe形式の金額を通常の金額に変換
export function convertFromStripeAmount(amount: number, currency: string = 'jpy'): number {
  if (currency === 'jpy') {
    return amount
  }
  
  return amount / 100
} 