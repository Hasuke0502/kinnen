import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createRefund } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  console.log('🚀 Refund API called')
  
  try {
    console.log('1️⃣ Creating Supabase client...')
    const supabase = await createClient()
    
    console.log('2️⃣ Checking user authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.email)

    console.log('3️⃣ Parsing request body...')
    const { challengeId } = await request.json()
    console.log('📋 Request params:', { challengeId })

    if (!challengeId) {
      console.log('❌ Missing challenge ID')
      return NextResponse.json(
        { error: 'Challenge ID is required' }, 
        { status: 400 }
      )
    }

    // チャレンジとプロファイルの取得
    console.log('4️⃣ Fetching challenge and profile...')
    const [challengeResult, profileResult] = await Promise.all([
      supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
    ])

    if (challengeResult.error || !challengeResult.data) {
      console.error('❌ Challenge not found:', challengeResult.error)
      return NextResponse.json(
        { error: 'Challenge not found' }, 
        { status: 404 }
      )
    }

    if (profileResult.error || !profileResult.data) {
      console.error('❌ Profile not found:', profileResult.error)
      return NextResponse.json(
        { error: 'Profile not found' }, 
        { status: 404 }
      )
    }

    const challenge = challengeResult.data
    const profile = profileResult.data

    // 返金条件のチェック
    console.log('5️⃣ Checking refund conditions...')
    
    // 返金選択ユーザーかチェック
    if (profile.payout_method !== 'refund') {
      return NextResponse.json(
        { error: 'User did not select refund option' }, 
        { status: 400 }
      )
    }

    // チャレンジが完了状態かチェック
    if (challenge.status !== 'completed') {
      return NextResponse.json(
        { error: 'Challenge is not completed' }, 
        { status: 400 }
      )
    }

    // 決済が完了しているかチェック
    if (!challenge.payment_completed || !challenge.payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment to refund' }, 
        { status: 400 }
      )
    }

    // 返金額の計算
    const totalSuccessDays = challenge.total_success_days || 0
    let refundAmount = 0
    
    if (profile.participation_fee > 500) {
      refundAmount = Math.floor((profile.participation_fee - 500) * (totalSuccessDays / 30))
    }

    console.log('💰 Refund calculation:', {
      participationFee: profile.participation_fee,
      successDays: totalSuccessDays,
      refundAmount
    })

    // 返金額が0円の場合はエラー
    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: 'No refund amount available' }, 
        { status: 400 }
      )
    }

    // Stripe返金処理
    console.log('6️⃣ Processing Stripe refund...')
    const stripeRefundAmount = refundAmount * 100 // 円 → セント変換
    const refund = await createRefund(
      challenge.payment_intent_id,
      stripeRefundAmount
    )
    console.log('✅ Stripe refund created:', refund.id)

    // チャレンジの返金状態を更新
    console.log('7️⃣ Updating challenge status...')
    const { error: updateError } = await supabase
      .from('challenges')
      .update({
        refund_completed: true,
        refund_amount: refundAmount,
        refund_completed_at: new Date().toISOString(),
        stripe_refund_id: refund.id
      })
      .eq('id', challengeId)

    if (updateError) {
      console.error('❌ Failed to update challenge:', updateError)
      // 注意: Stripeでは返金が実行されているが、DBの更新に失敗した状態
      // この場合は手動で対応が必要
      return NextResponse.json(
        { 
          error: 'Refund processed but failed to update records',
          refund_id: refund.id
        }, 
        { status: 500 }
      )
    }

    console.log('🎉 Refund process completed successfully')
    return NextResponse.json({
      success: true,
      refund_id: refund.id,
      refund_amount: refundAmount,
      message: '返金処理が完了しました'
    })

  } catch (error) {
    console.error('💥 Refund process error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 