import { createClient } from '@supabase/supabase-js'

interface Database {
  public: {
    Tables: {
      challenges: {
        Row: {
          id: string
          user_id: string
          start_date: string
          end_date: string
          status: 'active' | 'completed' | 'abandoned'
          total_success_days: number
          payment_intent_id: string | null
          payment_completed: boolean
          refund_completed: boolean
          refund_amount: number | null
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          participation_fee: number
          payout_method: 'refund'
        }
      }
    }
  }
}

// Stripe返金処理用の型定義
interface RefundResponse {
  id: string
  amount: number
  status: string
}

Deno.serve(async (req: Request) => {
  try {
    console.log('🚀 Processing completed challenges...')
    
    // CORS対応
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // 認証とSupabaseクライアントの初期化
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. 完了対象のチャレンジを取得（30日後の日付が終了したactive状態のもの）
    const today = new Date().toISOString().split('T')[0]
    console.log('📅 Checking challenges for date:', today)

    // 日本時間の今日（JST）を使用し、end_date が「今日より前」のもののみを完了対象とする
    const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const jstTodayStr = jst.toISOString().split('T')[0]

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
      .lt('end_date', jstTodayStr)

    if (fetchError) {
      console.error('❌ Error fetching expired challenges:', fetchError)
      throw fetchError
    }

    if (!expiredChallenges || expiredChallenges.length === 0) {
      console.log('✅ No expired challenges found')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No expired challenges to process',
          processed_count: 0
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`📋 Found ${expiredChallenges.length} expired challenges`)

    let processedCount = 0
    let refundedCount = 0
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
          
          // 手数料なしで計算：参加費 × (記録成功日数 / 30)
          const refundAmount = Math.floor(profile.participation_fee * (totalSuccessDays / 30))

          console.log(`💰 Calculated refund: ${refundAmount} yen for ${totalSuccessDays} success days`)

          if (refundAmount > 0) {
            // Stripe返金処理を呼び出し
            const refundResult = await processStripeRefund(
              challenge.payment_intent_id,
              refundAmount
            )

            if (refundResult.success) {
              // DB更新
              const { error: refundUpdateError } = await supabase
                .from('challenges')
                .update({
                  refund_completed: true,
                  refund_amount: refundAmount,
                  refund_completed_at: new Date().toISOString(),
                  stripe_refund_id: refundResult.refund_id
                })
                .eq('id', challenge.id)

              if (refundUpdateError) {
                console.error(`❌ Failed to update refund status for ${challenge.id}:`, refundUpdateError)
                errors.push(`Challenge ${challenge.id}: Refund DB update failed`)
              } else {
                console.log(`✅ Refund completed for challenge ${challenge.id}: ¥${refundAmount}`)
                refundedCount++
              }
            } else {
              console.error(`❌ Stripe refund failed for ${challenge.id}:`, refundResult.error)
              errors.push(`Challenge ${challenge.id}: Stripe refund failed - ${refundResult.error}`)
            }
          } else {
            console.log(`ℹ️ No refund amount for challenge ${challenge.id} (calculated: ¥${refundAmount})`)
          }
        }

      } catch (challengeError) {
        console.error(`💥 Error processing challenge ${challenge.id}:`, challengeError)
        errors.push(`Challenge ${challenge.id}: ${challengeError instanceof Error ? challengeError.message : String(challengeError)}`)
      }
    }

    // 5. 結果のサマリー
    console.log(`🎉 Processing completed:`)
    console.log(`   - Challenges processed: ${processedCount}`)
    console.log(`   - Refunds processed: ${refundedCount}`)
    console.log(`   - Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Challenge processing completed',
        summary: {
          processed_count: processedCount,
          refunded_count: refundedCount,
          error_count: errors.length
        },
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 Fatal error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Stripe返金処理関数
async function processStripeRefund(
  paymentIntentId: string,
  refundAmountYen: number
): Promise<{ success: boolean; refund_id?: string; error?: string }> {
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    // JPYはゼロ小数通貨のため、そのままの金額（円）を渡す
    const stripeRefundAmount = refundAmountYen

    console.log(`🔧 Creating Stripe refund for ${paymentIntentId}: ${stripeRefundAmount} JPY`)

    const response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_intent: paymentIntentId,
        amount: stripeRefundAmount.toString(),
        'metadata[refund_reason]': 'challenge_completion',
        'metadata[processed_at]': new Date().toISOString()
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ Stripe API error:', errorData)
      throw new Error(`Stripe API error: ${response.status} - ${errorData}`)
    }

    const refund = await response.json()
    console.log(`✅ Stripe refund created:`, refund.id)

    return {
      success: true,
      refund_id: refund.id
    }

  } catch (error) {
    console.error('💥 Stripe refund error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
} 