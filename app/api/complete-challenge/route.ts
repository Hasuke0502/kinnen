import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
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

    // チャレンジ期間の確認
    const startDate = new Date(challenge.start_date)
    const endDate = new Date(challenge.end_date)
    const currentDate = new Date()
    
    console.log('📅 Date check:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      currentDate: currentDate.toISOString(),
      isCompleted: currentDate >= endDate
    })

    // 30日経過したかチェック
    if (currentDate < endDate) {
      return NextResponse.json({
        message: 'Challenge is still ongoing',
        remaining_days: Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
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

    // 返金が必要な場合は返金処理を実行
    if (profile.payout_method === 'refund' && challenge.payment_completed) {
      console.log('6️⃣ Initiating refund process...')
      
      try {
        const refundResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}` // 認証情報を渡す
          },
          body: JSON.stringify({
            challengeId: challenge.id
          })
        })

        if (!refundResponse.ok) {
          const errorData = await refundResponse.json()
          console.error('❌ Refund failed:', errorData)
          
          return NextResponse.json({
            challenge_completed: true,
            refund_status: 'failed',
            refund_error: errorData.error,
            message: 'チャレンジは完了しましたが、返金処理でエラーが発生しました'
          })
        }

        const refundData = await refundResponse.json()
        console.log('✅ Refund successful:', refundData)

        return NextResponse.json({
          challenge_completed: true,
          refund_status: 'success',
          refund_amount: refundData.refund_amount,
          refund_id: refundData.refund_id,
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

    // 募金選択の場合
    console.log('6️⃣ Challenge completed (donation selected)')
    return NextResponse.json({
      challenge_completed: true,
      payout_method: 'donation',
      message: 'チャレンジが完了しました（募金選択）'
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