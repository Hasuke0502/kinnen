import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(_request: NextRequest) {
  console.log('🧪 Test Refund API called')
  
  try {
    // 開発環境でのみ動作
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' }, 
        { status: 403 }
      )
    }

    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 完了状態のチャレンジを取得
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'No completed challenge found' }, 
        { status: 404 }
      )
    }

    // プロファイルを取得
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' }, 
        { status: 404 }
      )
    }

    // 返金選択ユーザーかチェック
    if (profile.payout_method !== 'refund') {
      return NextResponse.json(
        { error: 'User did not select refund option' }, 
        { status: 400 }
      )
    }

    // 返金額の計算
    const totalSuccessDays = challenge.total_success_days || 0
    let refundAmount = 0
    
    if (profile.participation_fee > 500) {
      refundAmount = Math.floor((profile.participation_fee - 500) * (totalSuccessDays / 30))
    }

    console.log('🧪 Simulating refund for testing...', {
      participationFee: profile.participation_fee,
      successDays: totalSuccessDays,
      calculatedRefund: refundAmount
    })

    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: 'No refund amount available' }, 
        { status: 400 }
      )
    }

    // テスト用：実際のStripe処理をスキップして、DB更新のみ実行
    const mockRefundId = `test_refund_${Date.now()}`
    
    const { error: updateError } = await supabase
      .from('challenges')
      .update({
        refund_completed: true,
        refund_amount: refundAmount,
        refund_completed_at: new Date().toISOString(),
        stripe_refund_id: mockRefundId
      })
      .eq('id', challenge.id)

    if (updateError) {
      console.error('❌ Failed to update challenge:', updateError)
      return NextResponse.json(
        { error: 'Failed to update challenge' }, 
        { status: 500 }
      )
    }

    console.log('✅ Test refund simulation completed')
    return NextResponse.json({
      success: true,
      message: '返金処理をシミュレートしました（テスト用・実際の決済は行われていません）',
      refund_id: mockRefundId,
      refund_amount: refundAmount,
      test_mode: true
    })

  } catch (error) {
    console.error('💥 Test refund error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 