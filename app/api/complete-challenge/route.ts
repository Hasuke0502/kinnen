import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createRefund } from '@/lib/stripe'

export async function POST(_request: NextRequest) {
  console.log('🚀 Challenge completion check API called')
  
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

    // アクティブなチャレンジを取得
    console.log('3️⃣ Fetching active challenge...')
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (challengeError || !challenge) {
      console.log('❌ No active challenge found')
      return NextResponse.json(
        { error: 'No active challenge found' }, 
        { status: 404 }
      )
    }

    // チャレンジ期間の確認（JST基準で最終日の終了後）
    const startDate = new Date(challenge.start_date)
    const endDate = new Date(challenge.end_date)
    // 日本時間の現在時刻
    const currentDateTimeJST = new Date(Date.now() + 9 * 60 * 60 * 1000)
    // 最終日の終了時刻（JST 23:59:59.999）
    const endDateTime = new Date(endDate)
    endDateTime.setHours(23, 59, 59, 999)
    
    console.log('📅 Date check:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      endDateTime: endDateTime.toISOString(),
      currentDate: currentDateTimeJST.toISOString(),
      isCompleted: currentDateTimeJST > endDateTime
    })

    // 30日後の日付が終了したかチェック
    if (currentDateTimeJST <= endDateTime) {
      return NextResponse.json({
        message: 'Challenge is still ongoing',
        remaining_days: Math.ceil((endDateTime.getTime() - currentDateTimeJST.getTime()) / (1000 * 60 * 60 * 24))
      })
    }

    // チャレンジを完了状態に更新
    console.log('4️⃣ Updating challenge status to completed...')
    const { error: updateError } = await supabase
      .from('challenges')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', challenge.id)

    if (updateError) {
      console.error('❌ Failed to update challenge status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update challenge status' }, 
        { status: 500 }
      )
    }

    // ユーザープロファイルを取得して返金処理が必要かチェック
    console.log('5️⃣ Checking if refund is needed...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ Profile not found:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' }, 
        { status: 404 }
      )
    }

    // 返金が必要な場合は返金処理を直接実行
    if (
      profile.payout_method === 'refund' &&
      challenge.payment_completed &&
      challenge.payment_intent_id &&
      challenge.payment_intent_id !== 'free_participation' &&
      !challenge.refund_completed
    ) {
      console.log('6️⃣ Initiating refund process (direct)...')

      const totalSuccessDays = challenge.total_success_days || 0
      const refundAmount = Math.floor(profile.participation_fee * (totalSuccessDays / 30))

      if (refundAmount <= 0) {
        return NextResponse.json({
          challenge_completed: true,
          refund_status: 'skipped',
          refund_amount: 0,
          message: '返金対象額がありません'
        })
      }

      try {
        const refund = await createRefund(
          challenge.payment_intent_id,
          // JPYは最小単位=1円のため、そのまま渡す
          refundAmount
        )

        const { error: updateError } = await supabase
          .from('challenges')
          .update({
            refund_completed: true,
            refund_amount: refundAmount,
            refund_completed_at: new Date().toISOString(),
            stripe_refund_id: refund.id
          })
          .eq('id', challenge.id)

        if (updateError) {
          console.error('❌ Failed to update challenge after refund:', updateError)
          return NextResponse.json({
            challenge_completed: true,
            refund_status: 'partial',
            refund_amount: refundAmount,
            refund_id: refund.id,
            message: '返金は完了しましたが、記録更新に失敗しました'
          }, { status: 500 })
        }

        console.log('✅ Refund successful:', refund.id)
        return NextResponse.json({
          challenge_completed: true,
          refund_status: 'success',
          refund_amount: refundAmount,
          refund_id: refund.id,
          message: 'チャレンジ完了と返金処理が正常に完了しました'
        })

      } catch (refundError) {
        console.error('❌ Refund process error:', refundError)
        return NextResponse.json({
          challenge_completed: true,
          refund_status: 'failed',
          refund_error: refundError instanceof Error ? refundError.message : String(refundError),
          message: 'チャレンジは完了しましたが、返金処理でエラーが発生しました'
        })
      }
    }

    // 返金対象でない場合（返金選択ではない、または支払い未完了など）
    return NextResponse.json({
      challenge_completed: true,
      refund_status: 'none',
      message: 'チャレンジが完了しました'
    })

  } catch (error) {
    console.error('💥 Challenge completion check error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 