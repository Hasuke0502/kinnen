import Stripe from 'stripe'

// Stripe初期化（遅延）
let stripe: Stripe | null = null
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (stripeSecretKey) {
  // APIバージョンは安定版に固定（または未指定でデフォルトに委ねる）
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  })
} else {
  // 本番では未設定は致命的。開発環境ではモック返金で回避可能に。
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Stripe features are disabled. In development, refunds will be mocked.')
}

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
  console.log('🔧 Stripe createPaymentIntent called:', { amount, currency, metadata })
  
  try {
    console.log('🔧 Creating Stripe Payment Intent...')
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      payment_method_types: ['card'], // カード決済のみに限定
    })
    console.log('🔧 Stripe Payment Intent created successfully:', paymentIntent.id)

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret!,
    }
  } catch (error) {
    console.error('🔧 Stripe createPaymentIntent error:', error)
    console.error('🔧 Error details:', {
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error
    })
    
    // Stripeのエラーの場合、より詳細な情報を提供
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as Stripe.StripeRawError
      console.error('🔧 Stripe Error Type:', stripeError.type)
      console.error('🔧 Stripe Error Code:', stripeError.code)
    }
    
    throw new Error(`Payment intent creation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 支払いインテントの状態を確認
export async function getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
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
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
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

// 返金処理
export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<{ id: string; amount: number; status: string }> {
  console.log('🔧 Stripe createRefund called:', { paymentIntentId, amount })
  
  try {
    console.log('🔧 Creating Stripe Refund...')
    if (!stripe) {
      // 開発環境ではStripe未設定でも返金フローの検証ができるようにモック
      if (process.env.NODE_ENV !== 'production') {
        const mock = {
          id: `test_refund_${Date.now()}`,
          amount: amount ?? 0,
          status: 'succeeded',
        }
        console.warn('🧪 Returning mocked refund (dev only):', mock)
        return mock
      }
      throw new Error('Stripe is not configured')
    }
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount && { amount }),
      metadata: {
        refund_reason: 'challenge_completion',
        processed_at: new Date().toISOString()
      }
    })
    console.log('🔧 Stripe Refund created successfully:', refund.id)

    return {
      id: refund.id,
      amount: refund.amount,
      status: refund.status || 'unknown',
    }
  } catch (error) {
    console.error('🔧 Stripe createRefund error:', error)
    
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as Stripe.StripeRawError
      console.error('🔧 Stripe Error Type:', stripeError.type)
      console.error('🔧 Stripe Error Code:', stripeError.code)
    }
    
    throw new Error(`Refund creation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
} 