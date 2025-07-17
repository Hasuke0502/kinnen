import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MoneyMonster from '@/components/MoneyMonster'
import DashboardNavigation from '@/components/DashboardNavigation'

import { cookies } from 'next/headers'

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { message?: string }
}) {
  // cookies()を呼び出してキャッシュから除外
  await cookies()
  
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

  // 記録の取得
  const { data: records } = challenge ? await supabase
    .from('daily_records')
    .select('*')
    .eq('challenge_id', challenge.id)
    .order('record_date', { ascending: true }) : { data: null }

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
  const elapsedDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const remainingDays = Math.max(0, totalDays - elapsedDays)
  const achievementRate = totalDays > 0 ? (challenge.total_success_days / totalDays) * 100 : 0
  const currentSuccessRate = elapsedDays > 0 ? (challenge.total_success_days / elapsedDays) * 100 : 0
  
  // 返金・募金額の計算
  let payoutAmount = 0
  if (profile.payout_method === 'refund') {
    // 返金の場合：参加費が500円を超える場合のみ手数料を引いて計算
    if (profile.participation_fee > 500) {
      payoutAmount = Math.floor((profile.participation_fee - 500) * (challenge.total_success_days / totalDays))
    } else {
      payoutAmount = 0
    }
  } else {
    // 募金の場合：参加費全額が対象
    payoutAmount = Math.floor(profile.participation_fee * (challenge.total_success_days / totalDays))
  }
  
  const remainingAmount = profile.participation_fee - (profile.payout_method === 'donation' ? payoutAmount : (profile.participation_fee > 500 ? payoutAmount + 500 : payoutAmount))

  // カレンダー生成
  const generateCalendar = () => {
    const calendar = []
    const recordMap = new Map(records?.map(r => [r.record_date, r]) || [])
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const record = recordMap.get(dateStr)
      const isPast = date <= currentDate
      
      calendar.push({
        date: date,
        dateStr: dateStr,
        day: i + 1,
        record: record,
        isPast: isPast,
        isFuture: date > currentDate
      })
    }
    
    return calendar
  }

  const calendar = generateCalendar()

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
            <DashboardNavigation />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 成功メッセージ */}
          {searchParams.message && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {decodeURIComponent(searchParams.message)}
            </div>
          )}

          {/* 統計サマリー */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">達成率</p>
                  <p className="text-2xl font-semibold text-gray-900">{achievementRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🚭</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">記録成功日数</p>
                  <p className="text-2xl font-semibold text-gray-900">{challenge.total_success_days}日</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">残り日数</p>
                  <p className="text-2xl font-semibold text-gray-900">{remainingDays}日</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {profile.payout_method === 'refund' ? '返金予定額' : '募金予定額'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">¥{payoutAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

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

              {/* 30日間カレンダー */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">30日間カレンダー</h3>
                
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {calendar.map((day) => (
                    <div
                      key={day.dateStr}
                      className={`
                        aspect-square flex items-center justify-center text-sm font-medium rounded-lg border-2 relative
                        ${day.isFuture 
                          ? 'border-gray-200 bg-gray-50 text-gray-400' 
                          : day.record 
                            ? day.record.smoked 
                              ? 'border-red-200 bg-red-50 text-red-700' 
                              : 'border-green-200 bg-green-50 text-green-700'
                            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                        }
                      `}
                    >
                      <span>{day.day}</span>
                      {day.record && (
                        <span className="absolute top-1 right-1 text-xs">
                          {day.record.smoked ? '🚬' : '🚭'}
                        </span>
                      )}
                      {!day.record && day.isPast && !day.isFuture && (
                        <span className="absolute top-1 right-1 text-xs">❓</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded mr-2"></div>
                    <span>記録済み（禁煙）</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded mr-2"></div>
                    <span>記録済み（喫煙）</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-50 border-2 border-yellow-200 rounded mr-2"></div>
                    <span>未記録</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded mr-2"></div>
                    <span>未来</span>
                  </div>
                </div>
              </div>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* 現在の成績 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">現在の成績</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>現在の成功率</span>
                      <span className="font-medium">{currentSuccessRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, currentSuccessRate)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{challenge.total_success_days}</p>
                      <p className="text-xs text-gray-600">記録成功日数</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{challenge.total_failed_days}</p>
                      <p className="text-xs text-gray-600">未記録日数</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 返金・募金予定 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {profile.payout_method === 'refund' ? '返金状況' : '募金状況'}
                  </h3>
                  <Link
                    href={profile.payout_method === 'refund' ? "/settings" : "/donations"}
                    className={`text-sm hover:underline ${
                      profile.payout_method === 'refund' ? 'text-blue-600 hover:text-blue-800' : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {profile.payout_method === 'refund' ? '設定 →' : '証明 →'}
                  </Link>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      profile.payout_method === 'refund' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      ¥{payoutAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      現在の{profile.payout_method === 'refund' ? '返金' : '募金'}予定額
                    </p>
                  </div>
                  
                  {profile.payout_method === 'donation' && donationTarget && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-gray-900">{donationTarget.name}</h4>
                      <p className="text-sm text-gray-600">{donationTarget.description}</p>
                      {donationTarget.website_url && (
                        <a 
                          href={donationTarget.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          公式サイト →
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    {profile.payout_method === 'refund' 
                      ? profile.participation_fee > 500
                        ? '(参加費 - 500円) × (記録成功日数 ÷ 30日) = 返金額'
                        : '参加費が500円以下のため返金なし'
                      : '参加費 × (記録成功日数 ÷ 30日) = 募金額'
                    }
                  </div>
                </div>
              </div>

              {/* 設定情報 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">設定情報</h3>
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


            </div>
          </div>

          {/* 記録一覧 */}
          {records && records.length > 0 && (
            <div className="mt-8">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">記録履歴</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {records.slice().reverse().map((record) => (
                    <div key={record.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {record.smoked ? '🚬' : '🚭'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(record.record_date).toLocaleDateString('ja-JP')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {record.smoked ? '喫煙' : '禁煙成功'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ¥{Math.floor(profile.participation_fee / 30).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            記録成功日数カウント
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(record.created_at).toLocaleTimeString('ja-JP')}
                          </p>
                        </div>
                      </div>
                      {record.countermeasure && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>対策:</strong> {record.countermeasure}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 