import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createRefund } from '@/lib/stripe'

// Vercel Cron Job専用の認証チェック
function validateCronRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
  
  if (!expectedAuth || authHeader !== expectedAuth) {
    return false
  }
  return true
}

export async function GET(request: NextRequest) {
  console.log('🕒 Cron job: Processing completed challenges...')

  try {
    // Cron Jobの認証確認
    if (!validateCronRequest(request)) {
      console.error('❌ Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // 1. 完了対象のチャレンジを取得（30日経過したactive状態のもの）
    const today = new Date().toISOString().split('T')[0]
    console.log('📅 Checking challenges for date:', today)

    const { data: expiredChallenges, error: fetchError } = await supabase
      .from('challenges')
      .select(`
        id,
        user_id,
        start_date,
        end_date,
        status,
        total_success_days,
        payment_intent_id,
        payment_completed,
        refund_completed,
        refund_amount
      `)
      .eq('status', 'active')
      .lte('end_date', today)

    if (fetchError) {
      console.error('❌ Error fetching expired challenges:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch challenges', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!expiredChallenges || expiredChallenges.length === 0) {
      console.log('✅ No expired challenges found')
      return NextResponse.json({
        success: true,
        message: 'No expired challenges to process',
        processed_count: 0
      })
    }

    console.log(`📋 Found ${expiredChallenges.length} expired challenges`)

    let processedCount = 0
    let refundedCount = 0
    let donationCount = 0
    const errors: string[] = []

    // 2. 各チャレンジを処理
    for (const challenge of expiredChallenges) {
      try {
        console.log(`🔄 Processing challenge ${challenge.id} for user ${challenge.user_id}`)

        // チャレンジを完了状態に更新
        const { error: updateError } = await supabase
          .from('challenges')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', challenge.id)

        if (updateError) {
          console.error(`❌ Failed to update challenge ${challenge.id}:`, updateError)
          errors.push(`Challenge ${challenge.id}: ${updateError.message}`)
          continue
        }

        console.log(`✅ Challenge ${challenge.id} marked as completed`)
        processedCount++

        // 3. ユーザープロファイルを取得して返金処理判定
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('participation_fee, payout_method')
          .eq('user_id', challenge.user_id)
          .single()

        if (profileError || !profile) {
          console.error(`❌ Profile not found for user ${challenge.user_id}:`, profileError)
          errors.push(`Challenge ${challenge.id}: Profile not found`)
          continue
        }

        // 4. 返金処理（返金選択 且つ 決済完了済み 且つ 未返金）
        if (
          profile.payout_method === 'refund' &&
          challenge.payment_completed &&
          !challenge.refund_completed &&
          challenge.payment_intent_id &&
          challenge.payment_intent_id !== 'free_participation'
        ) {
          console.log(`💰 Processing refund for challenge ${challenge.id}`)

          // 返金額計算
          const totalSuccessDays = challenge.total_success_days || 0
          let refundAmount = 0
          
          if (profile.participation_fee > 500) {
            refundAmount = Math.floor((profile.participation_fee - 500) * (totalSuccessDays / 30))
          }

          console.log(`💰 Calculated refund: ${refundAmount} yen for ${totalSuccessDays} success days`)

          if (refundAmount > 0) {
            try {
              // Stripe返金処理
              const stripeRefundAmount = refundAmount * 100 // 円 -> セント変換
              const refund = await createRefund(
                challenge.payment_intent_id,
                stripeRefundAmount
              )

              // DB更新
              const { error: refundUpdateError } = await supabase
                .from('challenges')
                .update({
                  refund_completed: true,
                  refund_amount: refundAmount,
                  refund_completed_at: new Date().toISOString(),
                  stripe_refund_id: refund.id
                })
                .eq('id', challenge.id)

              if (refundUpdateError) {
                console.error(`❌ Failed to update refund status for ${challenge.id}:`, refundUpdateError)
                errors.push(`Challenge ${challenge.id}: Refund DB update failed`)
              } else {
                console.log(`✅ Refund completed for challenge ${challenge.id}: ¥${refundAmount}`)
                refundedCount++
              }

            } catch (refundError) {
              console.error(`❌ Stripe refund failed for ${challenge.id}:`, refundError)
              errors.push(`Challenge ${challenge.id}: Stripe refund failed - ${refundError instanceof Error ? refundError.message : String(refundError)}`)
            }
          } else {
            console.log(`ℹ️ No refund amount for challenge ${challenge.id} (calculated: ¥${refundAmount})`)
          }
        } else if (profile.payout_method === 'donation') {
          console.log(`🎁 Challenge ${challenge.id} marked for donation processing`)
          donationCount++
        }

      } catch (challengeError) {
        console.error(`💥 Error processing challenge ${challenge.id}:`, challengeError)
        errors.push(`Challenge ${challenge.id}: ${challengeError instanceof Error ? challengeError.message : String(challengeError)}`)
      }
    }

    // 5. 結果のサマリー
    console.log(`🎉 Cron processing completed:`)
    console.log(`   - Challenges processed: ${processedCount}`)
    console.log(`   - Refunds processed: ${refundedCount}`)
    console.log(`   - Donations marked: ${donationCount}`)
    console.log(`   - Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: 'Cron job completed successfully',
      summary: {
        processed_count: processedCount,
        refunded_count: refundedCount,
        donation_count: donationCount,
        error_count: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('💥 Cron job fatal error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 