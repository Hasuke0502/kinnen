import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createPaymentIntent, convertToStripeAmount } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  console.log('🚀 Payment Intent API called')
  
  try {
    console.log('1️⃣ Creating Supabase client...')
    const supabase = await createClient()
    
    console.log('2️⃣ Checking user authentication...')
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: authError.message 
      }, { status: 401 })
    }
    if (!user) {
      console.log('❌ No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.email)

    console.log('3️⃣ Parsing request body...')
    const { amount, challengeId } = await request.json()
    console.log('📋 Request params:', { amount, challengeId })

    // リクエストの検証
    if (amount === undefined || !challengeId || amount < 0) {
      console.log('❌ Invalid request parameters')
      return NextResponse.json(
        { error: 'Invalid amount or challenge ID' }, 
        { status: 400 }
      )
    }
    console.log('✅ Request parameters valid')

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

    console.log('5️⃣ Creating Stripe Payment Intent...')
    // Stripe支払いインテントを作成
    const stripeAmount = convertToStripeAmount(amount)
    console.log('💰 Stripe amount:', stripeAmount)
    
    const paymentIntent = await createPaymentIntent(
      stripeAmount,
      'jpy',
      {
        user_id: user.id,
        challenge_id: challengeId,
        app_name: '禁煙30日チャレンジ'
      }
    )
    console.log('✅ Payment Intent created:', paymentIntent.id)

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
    console.error('💥 Payment intent creation error:', error)
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // より詳細なエラー情報を返す（開発時のみ）
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
      }, 
      { status: 500 }
    )
  }
} 