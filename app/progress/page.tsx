import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'

export default async function ProgressPage() {
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

  if (!challenge) {
    redirect('/dashboard')
  }

  // 記録の取得
  const { data: records } = await supabase
    .from('daily_records')
    .select('*')
    .eq('challenge_id', challenge.id)
    .order('record_date', { ascending: true })

  // 募金先の取得
  const { data: donationTarget } = await supabase
    .from('donation_targets')
    .select('*')
    .eq('id', profile.donation_target_id)
    .single()

  // 統計計算
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
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
                ← ダッシュボード
              </Link>
              <span className="text-2xl mr-3">📊</span>
              <h1 className="text-xl font-semibold text-gray-900">進捗トラッキング</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
            {/* カレンダー */}
            <div className="lg:col-span-2">
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

            {/* 詳細統計 */}
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

              {/* マネーモンスター状況 */}
              <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-lg shadow p-6 text-white">
                <h3 className="text-lg font-medium mb-4">🐉 マネーモンスター</h3>
                <div className="text-center">
                  <p className="text-sm text-purple-200 mb-2">残り体力</p>
                  <p className="text-xl font-bold mb-4">¥{(profile.participation_fee - payoutAmount).toLocaleString()}</p>
                  
                  <div className="w-full bg-purple-800 rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, 100 - achievementRate)}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-purple-200">
                    あと{achievementRate >= 100 ? '0' : (100 - achievementRate).toFixed(1)}%でマネーモンスター完全撃破！
                  </p>
                </div>
              </div>

              {/* 募金情報 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {profile.payout_method === 'refund' ? '返金情報' : '募金情報'}
                </h3>
                <div className="space-y-3">
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
                  
                  {donationTarget && profile.payout_method === 'donation' && (
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
                  
                  <div className="text-xs text-gray-500 pt-3 border-t">
                    <p>計算式:</p>
                    <p>
                      {profile.payout_method === 'refund' 
                        ? profile.participation_fee > 500
                          ? `(¥${profile.participation_fee.toLocaleString()} - ¥500) × (${challenge.total_success_days}/30) = ¥${payoutAmount.toLocaleString()}`
                          : '参加費が500円以下のため返金なし'
                        : `¥${profile.participation_fee.toLocaleString()} × (${challenge.total_success_days}/30) = ¥${payoutAmount.toLocaleString()}`
                      }
                    </p>
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