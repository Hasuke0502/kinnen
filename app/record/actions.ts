'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

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
    
    console.log('記録データ:', { smoked, countermeasure })

    // プロファイルとチャレンジを取得
    const [profileResult, challengeResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('participation_fee')
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
    const today = new Date().toISOString().split('T')[0]

    console.log('取得データ:', {
      participationFee: profile.participation_fee,
      challengeId: challenge.id,
      currentSuccessDays: challenge.total_success_days,
      currentFailedDays: challenge.total_failed_days,
      today
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

    // チャレンジの統計を更新（記録すれば成功日数としてカウント）
    const newSuccessDays = challenge.total_success_days + 1 // 記録すれば禁煙の有無に関わらず成功日数増加
    
    // 経過日数を計算（開始日から今日まで）
    const startDate = new Date(challenge.start_date)
    const todayDate = new Date()
    const elapsedDays = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // 未記録日数 = 経過日数 - 記録成功日数
    const newFailedDays = Math.max(0, elapsedDays - newSuccessDays)
    
    const newAchievementRate = (newSuccessDays / 30) * 100
    const newDonationAmount = Math.floor(profile.participation_fee * (newSuccessDays / 30))

    console.log('チャレンジ統計更新:', {
      oldSuccessDays: challenge.total_success_days,
      newSuccessDays,
      oldFailedDays: challenge.total_failed_days,
      newFailedDays,
      elapsedDays,
      newAchievementRate,
      newDonationAmount
    })

    const { error: challengeError } = await supabase
      .from('challenges')
      .update({
        total_success_days: newSuccessDays,
        total_failed_days: newFailedDays,
        achievement_rate: newAchievementRate,
        donation_amount: newDonationAmount
      })
      .eq('id', challenge.id)

    if (challengeError) {
      console.error('チャレンジ更新エラー:', challengeError)
      throw new Error(`チャレンジの更新に失敗しました: ${challengeError.message}`)
    }

    console.log('チャレンジ統計更新完了')

    // キャッシュの再検証を強化
    console.log('キャッシュを再検証中...')
    revalidatePath('/dashboard', 'page')
    revalidatePath('/progress', 'page')
    revalidatePath('/record', 'page')
    revalidatePath('/', 'layout') // レイアウト全体も再検証

    console.log('キャッシュ再検証完了')

    // 成功メッセージと共にダッシュボードにリダイレクト
    const successMessage = smoked 
      ? '記録完了！記録を続けることが重要です。明日も頑張りましょう！'
      : '記録完了！マネーモンスターに大ダメージを与えました！'
    
    console.log('リダイレクト中:', successMessage)
    redirect(`/dashboard?message=${encodeURIComponent(successMessage)}`)

  } catch (error) {
    console.error('記録エラー:', error)
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました'
    redirect(`/record?error=${encodeURIComponent(errorMessage)}`)
  }
} 