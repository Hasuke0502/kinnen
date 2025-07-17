import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createPaymentIntent, convertToStripeAmount } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, challengeId } = await request.json()

    // リクエストの検証
    if (amount === undefined || !challengeId || amount < 0) {
      return NextResponse.json(
        { error: 'Invalid amount or challenge ID' }, 
        { status: 400 }
      )
    }

    // 0円の場合は決済処理をスキップ
    if (amount === 0) {
      // チャレンジの状態を直接更新
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ 
          payment_intent_id: 'free_participation',
          status: 'active'
        })
        .eq('id', challengeId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Challenge update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update challenge' }, 
          { status: 500 }
        )
      }

      return NextResponse.json({
        client_secret: null,
        payment_intent_id: 'free_participation',
        amount: 0,
        message: '0円での参加が完了しました'
      })
    }

    // チャレンジの存在確認
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('user_id', user.id)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' }, 
        { status: 404 }
      )
    }

    // 既に支払い済みかチェック
    if (challenge.payment_intent_id) {
      return NextResponse.json(
        { error: 'Payment already exists for this challenge' }, 
        { status: 400 }
      )
    }

    // Stripe支払いインテントを作成
    const stripeAmount = convertToStripeAmount(amount)
    const paymentIntent = await createPaymentIntent(
      stripeAmount,
      'jpy',
      {
        user_id: user.id,
        challenge_id: challengeId,
        app_name: '禁煙30日チャレンジ'
      }
    )

    // チャレンジに支払いインテントIDを保存
    const { error: updateError } = await supabase
      .from('challenges')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', challengeId)

    if (updateError) {
      console.error('Failed to update challenge with payment intent:', updateError)
      // 支払いインテントはキャンセルするか、別途処理が必要
    }

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 