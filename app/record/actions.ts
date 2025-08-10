'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createRefund } from '@/lib/stripe'

// 日本時間での日付を取得する関数
function getJSTDate(): string {
  const now = new Date()
  // 日本時間（UTC+9）に変換
  const jstOffset = 9 * 60 * 60 * 1000 // 9時間をミリ秒に変換
  const jstTime = new Date(now.getTime() + jstOffset)
  return jstTime.toISOString().split('T')[0]
}

// 日本時間での現在時刻（Dateオブジェクト）を取得する関数
function getJSTTime(): Date {
  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000
  return new Date(now.getTime() + jstOffset)
}

export async function submitRecord(formData: FormData) {
  const supabase = await createClient()
  
  try {
    console.log('記録保存開始')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('認証エラー: ユーザーが見つかりません')
      redirect('/auth/login')
    }

    // フォームデータを取得
    const smoked = formData.get('smoked') === 'true'
    const countermeasure = formData.get('countermeasure') as string || null
    const today = getJSTDate() // 日本時間での今日の日付
    
    console.log('記録データ:', { smoked, countermeasure, recordDate: today })

    // プロファイルとチャレンジを取得
    const [profileResult, challengeResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('participation_fee, payout_method')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
    ])

    if (profileResult.error) {
      console.error('プロファイル取得エラー:', profileResult.error)
      throw new Error(`プロファイル取得エラー: ${profileResult.error.message}`)
    }

    if (challengeResult.error) {
      console.error('チャレンジ取得エラー:', challengeResult.error)
      throw new Error(`チャレンジ取得エラー: ${challengeResult.error.message}`)
    }

    if (!profileResult.data || !challengeResult.data) {
      console.error('データが見つかりません:', { profile: !!profileResult.data, challenge: !!challengeResult.data })
      throw new Error('プロファイルまたはチャレンジが見つかりません')
    }

    const profile = profileResult.data
    const challenge = challengeResult.data

    console.log('取得データ:', {
      participationFee: profile.participation_fee,
      challengeId: challenge.id,
      currentSuccessDays: challenge.total_success_days,
      currentFailedDays: challenge.total_failed_days,
      recordDate: today
    })

    // 今日の記録があるかチェック
    const { data: existingRecord, error: existingError } = await supabase
      .from('daily_records')
      .select('*')
      .eq('challenge_id', challenge.id)
      .eq('record_date', today)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('既存記録チェックエラー:', existingError)
      throw new Error(`既存記録チェックエラー: ${existingError.message}`)
    }

    if (existingRecord) {
      console.log('今日の記録は既に存在します:', existingRecord)
      redirect('/dashboard?message=今日の記録は既に完了しています')
    }

    // 記録を保存
    console.log('記録を保存中...')
    const { error: recordError } = await supabase
      .from('daily_records')
      .insert({
        challenge_id: challenge.id,
        user_id: user.id,
        record_date: today,
        smoked: smoked,
        countermeasure: smoked ? countermeasure : null
      })

    if (recordError) {
      console.error('記録保存エラー:', recordError)
      throw new Error(`記録の保存に失敗しました: ${recordError.message}`)
    }

    console.log('記録保存完了')

    // 全ての記録を取得して正確な統計を計算
    const { data: allRecords } = await supabase
      .from('daily_records')
      .select('record_date')
      .eq('challenge_id', challenge.id)

    const recordCount = allRecords?.length || 0
    
    // 経過日数を計算（開始日から現在まで、日本時間基準）
    const startDate = new Date(challenge.start_date)
    const currentDate = new Date(getJSTDate() + 'T00:00:00') // 日本時間での今日を日付オブジェクトに変換
    const elapsedDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // 未記録日数 = 経過日数 - 記録成功日数（ただし30日を超えない）
    const cappedElapsedDays = Math.min(elapsedDays, 30)
    const newSuccessDays = recordCount
    const newFailedDays = Math.max(0, cappedElapsedDays - newSuccessDays)
    
    const newAchievementRate = (newSuccessDays / 30) * 100

    // チャレンジの終了日を計算（30日後の日付が終了した場合）
    const challengeEndDate = new Date(startDate)
    challengeEndDate.setDate(startDate.getDate() + 29) // 30日チャレンジなので、開始日から29日後が最終日
    
    // 現在時刻が最終日の終了時刻（23:59:59）を過ぎているかチェック
    const currentDateTime = getJSTTime() // 日本時間での現在時刻
    const endDateTime = new Date(challengeEndDate)
    endDateTime.setHours(23, 59, 59, 999) // 最終日の23:59:59.999
    
    const isFinalDayRecord = currentDateTime > endDateTime

    console.log('チャレンジ統計更新:', {
      recordCount,
      elapsedDays,
      cappedElapsedDays,
      newSuccessDays,
      newFailedDays,
      newAchievementRate
    })

    const { error: challengeError } = await supabase
      .from('challenges')
      .update({
        total_success_days: newSuccessDays,
        total_failed_days: newFailedDays,
        achievement_rate: newAchievementRate,
        status: isFinalDayRecord || newSuccessDays === 30 ? 'completed' : challenge.status // 最終日記録または30日成功で完了
      })
      .eq('id', challenge.id)

    if (challengeError) {
      console.error('チャレンジ更新エラー:', challengeError)
      throw new Error(`チャレンジの更新に失敗しました: ${challengeError.message}`)
    }

    console.log('チャレンジ統計更新完了')

    // ゲーム終了条件を満たした場合は自動返金を実行
    const didComplete = isFinalDayRecord || newSuccessDays === 30
    if (didComplete) {
      try {
        // 返金条件: 返金選択ユーザー、支払い完了、PaymentIntentあり、無料参加ではない
        if (
          profile.payout_method === 'refund' &&
          challenge.payment_completed &&
          !!challenge.payment_intent_id &&
          challenge.payment_intent_id !== 'free_participation' &&
          !challenge.refund_completed
        ) {
          const refundAmount = Math.floor(profile.participation_fee * (newSuccessDays / 30))

          if (refundAmount > 0) {
            const refund = await createRefund(
              challenge.payment_intent_id as string,
              // JPYは最小単位=1円
              refundAmount
            )

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
              console.error('返金後のチャレンジ更新に失敗しました:', refundUpdateError)
            } else {
              console.log('返金完了:', { refundId: refund.id, refundAmount })
            }
          } else {
            console.log('返金対象額が0円のためスキップしました')
          }
        } else {
          console.log('返金条件を満たさないためスキップしました')
        }
      } catch (refundError) {
        console.error('自動返金処理でエラーが発生しました:', refundError)
        // ここでは処理を中断せず、UXを優先してダッシュボードへリダイレクトを続行
      }
    }

    // キャッシュの再検証を強化
    console.log('キャッシュを再検証中...')
    revalidatePath('/dashboard', 'page')
    revalidatePath('/progress', 'page')
    revalidatePath('/record', 'page')
    revalidatePath('/', 'layout') // レイアウト全体も再検証

    console.log('キャッシュ再検証完了')

    // 成功メッセージと共にダッシュボードにリダイレクト
    const successMessage = smoked 
      ? '記録完了！記録を続けることが重要です！明日も頑張りましょう！'
      : '記録完了！マネーモンスターに大ダメージを与えました！'
    
    console.log('リダイレクト中:', successMessage)
    // ゲーム完了フラグを付与してリダイレクト
    const redirectTo = isFinalDayRecord || newSuccessDays === 30 
      ? `/dashboard?message=${encodeURIComponent(successMessage)}&gameCompleted=true`
      : `/dashboard?message=${encodeURIComponent(successMessage)}`
    
    redirect(redirectTo)

  } catch (error) {
    console.error('記録エラー:', error)
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました'
    redirect(`/record?error=${encodeURIComponent(errorMessage)}`)
  }
} 