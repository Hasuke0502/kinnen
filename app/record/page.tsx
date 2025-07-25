import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RecordForm from '@/components/RecordForm'

export default async function RecordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  // searchParamsを非同期で取得
  const resolvedSearchParams = await searchParams
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

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

  if (!profileResult.data) {
    redirect('/onboarding')
  }

  if (!challengeResult.data) {
    redirect('/dashboard')
  }

  const profile = profileResult.data
  const challenge = challengeResult.data

  // 今日の記録があるかチェック
  const today = new Date().toISOString().split('T')[0]
  const { data: existingRecord } = await supabase
    .from('daily_records')
    .select('*')
    .eq('challenge_id', challenge.id)
    .eq('record_date', today)
    .single()

  if (existingRecord) {
    redirect('/dashboard?message=今日の記録は既に完了しています')
  }

  const dailyDamage = Math.floor(profile.participation_fee / 30)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-white hover:text-gray-200 mb-4">
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-3xl font-bold text-white">今日の戦闘記録</h1>
          <p className="text-purple-200 mt-2">マネーモンスターとの戦いの結果を記録しよう</p>
        </div>

        {/* エラーメッセージ */}
        {resolvedSearchParams.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {resolvedSearchParams.error}
          </div>
        )}

        {/* 成功メッセージ */}
        {resolvedSearchParams.message && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {resolvedSearchParams.message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-8">
          <RecordForm dailyDamage={dailyDamage} />
        </div>
      </div>
    </div>
  )
} 