import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NotificationSettings from '@/components/NotificationSettings'

export default async function SettingsPage() {
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

  // 募金先の取得
  const { data: donationTarget } = await supabase
    .from('donation_targets')
    .select('*')
    .eq('id', profile.donation_target_id)
    .single()

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
              <span className="text-2xl mr-3">⚙️</span>
              <h1 className="text-xl font-semibold text-gray-900">設定</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 通知設定 */}
            <NotificationSettings defaultRecordTime={profile.record_time} />

            {/* チャレンジ設定 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 チャレンジ設定</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">喫煙頻度</p>
                    <p className="text-xs text-gray-600">
                      {profile.smoking_frequency === 'daily' ? '1日' : 
                       profile.smoking_frequency === 'weekly' ? '1週間' : '1ヶ月'}に{profile.smoking_amount}箱
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">参加費</p>
                    <p className="text-xs text-gray-600">¥{profile.participation_fee.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">記録時間</p>
                    <p className="text-xs text-gray-600">{profile.record_time}</p>
                  </div>
                </div>

                {donationTarget && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">募金先</p>
                      <p className="text-xs text-gray-600">{donationTarget.name}</p>
                    </div>
                  </div>
                )}

                {challenge && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">チャレンジ期間</p>
                      <p className="text-xs text-gray-600">
                        {new Date(challenge.start_date).toLocaleDateString('ja-JP')} ～ {new Date(challenge.end_date).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ チャレンジ期間中は設定を変更できません。新しいチャレンジを開始する際に設定を変更できます。
                  </p>
                </div>
              </div>
            </div>

            {/* アカウント設定 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">👤 アカウント設定</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">メールアドレス</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">アカウント作成日</p>
                    <p className="text-xs text-gray-600">{new Date(user.created_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 アカウント情報の変更については、サポートまでお問い合わせください。
                  </p>
                </div>
              </div>
            </div>

            {/* データとプライバシー */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🔒 データとプライバシー</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">データの取り扱い</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 記録データは安全に暗号化されて保存されます</li>
                    <li>• 個人を特定できる情報は募金先と共有されません</li>
                    <li>• データは統計分析のため匿名化して使用される場合があります</li>
                  </ul>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">データのエクスポート</p>
                  <p className="text-xs text-gray-600 mb-2">
                    あなたの記録データをエクスポートできます
                  </p>
                  <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700">
                    データをエクスポート
                  </button>
                </div>

                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-900 mb-2">アカウント削除</p>
                  <p className="text-xs text-red-700 mb-2">
                    アカウントを削除すると、すべてのデータが永久に削除されます
                  </p>
                  <button className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
                    アカウントを削除
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 inline-block"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 