import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import DashboardClient from '@/components/DashboardClient'
import { cookies } from 'next/headers'
import { getJSTDate } from '@/lib/dateUtils';

export const metadata: Metadata = {
  title: 'ダッシュボード | 禁煙30日チャレンジ',
  description: 'あなたの禁煙30日チャレンジの進捗、マネーモンスターとの戦いの状況、取り戻し予定金額をリアルタイムで確認できます。',
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string, gameCompleted?: string }>
}) {
  // searchParamsを非同期で解決
  const resolvedSearchParams = await searchParams
  const isGameCompletedFromParams = resolvedSearchParams.gameCompleted === 'true'

  // cookies()を呼び出してキャッシュから除外
  await cookies()
  
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // プロファイルとアクティブなチャレンジを取得
  const [profileResponse, challengeResponse] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
  ])

  if (profileResponse.error || !profileResponse.data) {
    console.error('Profile error:', profileResponse.error)
    redirect('/onboarding')
  }

  if (challengeResponse.error || !challengeResponse.data) {
    console.error('Challenge error:', challengeResponse.error)
    redirect('/onboarding')
  }

  const profile = profileResponse.data
  const challenge = challengeResponse.data

  // 今日の記録を取得
  const todayStr = getJSTDate()
  const { data: todayRecord } = await supabase
    .from('daily_records')
    .select('*')
    .eq('challenge_id', challenge.id)
    .eq('record_date', todayStr)
    .single()

  // 記録履歴を取得
  const { data: records } = await supabase
    .from('daily_records')
    .select('*')
    .eq('challenge_id', challenge.id)
    .order('record_date', { ascending: true })

  // 募金先情報を取得（募金選択の場合）
  let donationTarget = null
  if (profile.payout_method === 'donation' && profile.donation_target_id) {
    const { data } = await supabase
      .from('donation_targets')
      .select('*')
      .eq('id', profile.donation_target_id)
      .single()
    donationTarget = data
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="禁煙30日チャレンジ" icon="🏰" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <DashboardClient
            profile={profile}
            challenge={challenge}
            todayRecord={todayRecord}
            records={records || []}
            donationTarget={donationTarget}
            message={resolvedSearchParams.message}
            isGameCompletedFromParams={isGameCompletedFromParams}
          />
        </div>
      </main>
    </div>
  )
} 