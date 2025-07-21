import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { verifyWebhookSignature } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature found' }, { status: 400 })
    }

    // Webhook署名を検証
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    const supabase = await createClient()

    // イベントタイプに応じて処理
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent, supabase)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent, supabase)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' }, 
      { status: 400 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    const challengeId = paymentIntent.metadata.challenge_id
    const userId = paymentIntent.metadata.user_id

    if (!challengeId || !userId) {
      console.error('Missing metadata in payment intent:', paymentIntent.id)
      return
    }

    // チャレンジの状態を更新（支払い完了を記録し、アクティブ状態に変更）
    const { error: updateError } = await supabase
      .from('challenges')
      .update({ 
        payment_completed: true,
        payment_completed_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', challengeId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Failed to update challenge payment status:', updateError)
      return
    }

    console.log(`Payment successful for challenge ${challengeId}`)

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    const challengeId = paymentIntent.metadata.challenge_id
    const userId = paymentIntent.metadata.user_id

    if (!challengeId || !userId) {
      console.error('Missing metadata in payment intent:', paymentIntent.id)
      return
    }

    // 支払い失敗をログに記録
    console.log(`Payment failed for challenge ${challengeId}`)

    // 必要に応じてチャレンジの状態を更新
    // 例：チャレンジを一時停止状態にする等

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
} 