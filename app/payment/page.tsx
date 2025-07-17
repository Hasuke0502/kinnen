import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PaymentForm from '@/components/PaymentForm'

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: { challenge_id?: string }
}) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/auth/login')
  }

  const challengeId = searchParams.challenge_id
  if (!challengeId) {
    redirect('/dashboard')
  }

  // チャレンジの取得
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('user_id', user.id)
    .single()

  if (!challenge) {
    redirect('/dashboard')
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

  // 既に支払い済みの場合はダッシュボードへ
  if (challenge.payment_intent_id) {
    redirect('/dashboard')
  }

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
              <span className="text-2xl mr-3">💳</span>
              <h1 className="text-xl font-semibold text-gray-900">参加費のお支払い</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* チャレンジ概要 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">🎯 チャレンジ概要</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">期間</span>
                  <span className="text-sm font-medium">30日間</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">開始日</span>
                  <span className="text-sm font-medium">
                    {new Date(challenge.start_date).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">終了日</span>
                  <span className="text-sm font-medium">
                    {new Date(challenge.end_date).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">参加費</span>
                  <span className="text-sm font-medium">¥{profile.participation_fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">記録時間</span>
                  <span className="text-sm font-medium">{profile.record_time}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 支払いフォーム */}
          <PaymentForm 
            amount={profile.participation_fee}
            challengeId={challenge.id}
          />

          {/* 利用規約・返金ポリシー */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📋 重要事項</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">利用規約</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>30日間のチャレンジ期間中は、毎日の記録を行ってください</li>
                  <li>記録内容は正直に入力してください</li>
                  <li>チャレンジの途中放棄も可能ですが、参加費の返金はありません</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">返金ポリシー</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>参加費のお支払い後、チャレンジ開始前であれば全額返金可能です</li>
                  <li>チャレンジ開始後の返金は、技術的な問題等の場合のみ対応します</li>
                  <li>禁煙成功日数に応じた募金は、チャレンジ完了後に実施されます</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">募金について</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>募金額 = 参加費 × (記録成功日数 ÷ 30日)</li>
                  <li>募金先への寄付は月次でまとめて実施されます</li>
                  <li>募金の証明書は募金証明ページで確認できます</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 