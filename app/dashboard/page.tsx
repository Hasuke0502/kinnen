import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import DashboardClient from '@/components/DashboardClient'
import { cookies } from 'next/headers'
import { getJSTDate } from '@/lib/dateUtils';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinnen.vercel.app'

export const metadata: Metadata = {
  title: 'ダッシュボード | 禁煙30日チャレンジ',
  description: 'あなたの禁煙30日チャレンジの進捗、マネーモンスターとの戦いの状況、取り戻し予定金額をリアルタイムで確認できます。',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/dashboard`,
    title: 'ダッシュボード | 禁煙30日チャレンジ',
    description: '進捗と取り戻し予定金額をリアルタイムで確認',
    images: [
      { url: '/og?title=%E3%83%80%E3%83%83%E3%82%B7%E3%83%A5%E3%83%9C%E3%83%BC%E3%83%89', width: 1200, height: 630, alt: 'ダッシュボード OGP' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ダッシュボード | 禁煙30日チャレンジ',
    description: '進捗と取り戻し予定金額をリアルタイムで確認',
    images: ['/og?title=%E3%83%80%E3%83%83%E3%82%B7%E3%83%A5%E3%83%9C%E3%83%BC%E3%83%89'],
  },
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

  console.log('Current user ID:', user.id)

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

  console.log('Profile response:', { error: profileResponse.error, data: profileResponse.data })
  console.log('Challenge response:', { error: challengeResponse.error, data: challengeResponse.data })

  // プロファイルが存在しない場合
  if (profileResponse.error) {
    if (profileResponse.error.code === 'PGRST116') {
      // プロファイルが見つからない場合
      console.log('Profile not found for user:', user.id)
      redirect('/onboarding')
    } else {
      // その他のエラーの場合
      console.error('Profile error:', profileResponse.error)
      console.error('User ID:', user.id)
      redirect('/onboarding')
    }
  }

  if (!profileResponse.data) {
    console.log('No profile data found for user:', user.id)
    redirect('/onboarding')
  }

  // チャレンジが存在しない場合
  if (challengeResponse.error) {
    if (challengeResponse.error.code === 'PGRST116') {
      // チャレンジが見つからない場合
      console.log('Active challenge not found for user:', user.id)
      redirect('/onboarding')
    } else {
      // その他のエラーの場合
      console.error('Challenge error:', challengeResponse.error)
      console.error('User ID:', user.id)
      redirect('/onboarding')
    }
  }

  if (!challengeResponse.data) {
    console.log('No active challenge found for user:', user.id)
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
            message={resolvedSearchParams.message}
            isGameCompletedFromParams={isGameCompletedFromParams}
          />
        </div>
      </main>
    </div>
  )
} 