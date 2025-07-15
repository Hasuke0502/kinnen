import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'
import MoneyMonster from '@/components/MoneyMonster'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/auth/login')
  }

  // ユーザープロファイルの取得
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // プロファイルが存在しない場合はオンボーディングへ
  if (!profile) {
    redirect('/onboarding')
  }

  // アクティブなチャレンジの取得
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // 今日の記録を取得
  const today = new Date().toISOString().split('T')[0]
  const { data: todayRecord } = challenge ? await supabase
    .from('daily_records')
    .select('*')
    .eq('challenge_id', challenge.id)
    .eq('record_date', today)
    .single() : { data: null }

  // 募金先の取得
  const { data: donationTarget } = await supabase
    .from('donation_targets')
    .select('*')
    .eq('id', profile.donation_target_id)
    .single()

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">チャレンジが見つかりません</h1>
          <p className="text-gray-600 mb-6">新しいチャレンジを開始してください</p>
        </div>
      </div>
    )
  }

  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  const currentDate = new Date()
  const totalDays = 30
  const elapsedDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const remainingDays = Math.max(0, totalDays - elapsedDays)
  const achievementRate = totalDays > 0 ? (challenge.total_success_days / totalDays) * 100 : 0
  const donationAmount = Math.floor(profile.participation_fee * (challenge.total_success_days / totalDays))
  const remainingAmount = profile.participation_fee - donationAmount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏰</span>
              <h1 className="text-xl font-semibold text-gray-900">禁煙30日チャレンジ</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/progress"
                className="text-indigo-600 hover:text-indigo-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                進捗詳細
              </Link>
              <Link
                href="/donations"
                className="text-green-600 hover:text-green-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                募金証明
              </Link>
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                設定
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* メインエリア */}
            <div className="lg:col-span-2 space-y-6">
              {/* マネーモンスター */}
              <MoneyMonster
                totalAmount={profile.participation_fee}
                remainingAmount={remainingAmount}
                achievementRate={achievementRate}
                totalSuccessDays={challenge.total_success_days}
                totalFailedDays={challenge.total_failed_days}
              />

              {/* 今日の記録 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">今日の記録</h3>
                {todayRecord ? (
                  <div className="text-center">
                    <span className="text-4xl block mb-4">
                      {todayRecord.smoked ? '😔' : '🎉'}
                    </span>
                    <p className="text-lg font-medium">
                      {todayRecord.smoked ? '今日は喫煙してしまいました' : '今日は禁煙成功！'}
                    </p>
                    {todayRecord.smoked && todayRecord.countermeasure && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>明日への対策:</strong> {todayRecord.countermeasure}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-4">
                      記録済み: {new Date(todayRecord.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-4xl block mb-4">❓</span>
                    <p className="text-lg font-medium mb-4">今日の記録をつけましょう</p>
                    <Link
                      href="/record"
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 inline-block"
                    >
                      記録をつける
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* 進捗状況 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">進捗状況</h3>
                  <Link
                    href="/progress"
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    詳細 →
                  </Link>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>残り日数</span>
                      <span>{remainingDays}日</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(elapsedDays / totalDays) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>禁煙成功日</span>
                      <span>{challenge.total_success_days}日</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>達成率</span>
                      <span>{achievementRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 募金予定 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">募金状況</h3>
                  <Link
                    href="/donations"
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    証明 →
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      ¥{donationAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">現在の募金予定額</p>
                  </div>
                  
                  {donationTarget && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-gray-900">{donationTarget.name}</h4>
                      <p className="text-sm text-gray-600">{donationTarget.description}</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    参加費 × (禁煙成功日 ÷ 30日) = 募金額
                  </div>
                </div>
              </div>

              {/* 設定情報 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">設定情報</h3>
                  <Link
                    href="/settings"
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    設定 →
                  </Link>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>参加費</span>
                    <span>¥{profile.participation_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>記録時間</span>
                    <span>{profile.record_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>開始日</span>
                    <span>{startDate.toLocaleDateString('ja-JP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>終了日</span>
                    <span>{endDate.toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              </div>

              {/* クイックアクション */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">クイックアクション</h3>
                <div className="space-y-3">
                  {!todayRecord ? (
                    <Link
                      href="/record"
                      className="w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-md font-medium hover:bg-indigo-700 block"
                    >
                      今日の記録をつける
                    </Link>
                  ) : (
                    <div className="text-center text-gray-500">
                      今日の記録は完了しています
                    </div>
                  )}
                  <Link
                    href="/progress"
                    className="w-full bg-gray-600 text-white text-center py-2 px-4 rounded-md font-medium hover:bg-gray-700 block"
                  >
                    進捗詳細を見る
                  </Link>
                  <Link
                    href="/donations"
                    className="w-full bg-green-600 text-white text-center py-2 px-4 rounded-md font-medium hover:bg-green-700 block"
                  >
                    募金証明を見る
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 