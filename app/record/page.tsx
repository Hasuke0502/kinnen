'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Challenge {
  id: string
  start_date: string
  end_date: string
  total_success_days: number
  total_failed_days: number
}

interface UserProfile {
  participation_fee: number
}

export default function RecordPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    smoked: null as boolean | null,
    countermeasure: ''
  })
  const [step, setStep] = useState(1) // 1: 質問, 2: 対策(必要時), 3: 結果

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
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

    if (profileResult.data) setProfile(profileResult.data)
    if (challengeResult.data) setChallenge(challengeResult.data)

    // 今日の記録があるかチェック
    if (challengeResult.data) {
      const today = new Date().toISOString().split('T')[0]
      const { data: existingRecord } = await supabase
        .from('daily_records')
        .select('*')
        .eq('challenge_id', challengeResult.data.id)
        .eq('record_date', today)
        .single()

      if (existingRecord) {
        // 既に記録済みの場合はダッシュボードへ
        router.push('/dashboard?message=今日の記録は既に完了しています')
      }
    }
  }

  const handleSubmit = async () => {
    if (!challenge || !profile || formData.smoked === null) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]

      // 記録を保存
      const { error: recordError } = await supabase
        .from('daily_records')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          record_date: today,
          smoked: formData.smoked,
          countermeasure: formData.smoked ? formData.countermeasure : null
        })

      if (recordError) {
        console.error('記録保存エラー:', recordError)
        alert('記録の保存に失敗しました')
        return
      }

      // チャレンジの統計を更新
      const newSuccessDays = formData.smoked ? challenge.total_success_days : challenge.total_success_days + 1
      const newFailedDays = formData.smoked ? challenge.total_failed_days + 1 : challenge.total_failed_days
      const newAchievementRate = (newSuccessDays / 30) * 100
      const newDonationAmount = Math.floor(profile.participation_fee * (newSuccessDays / 30))

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
      }

      setStep(3)
    } catch (error) {
      console.error('エラー:', error)
      alert('予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (smoked: boolean) => {
    setFormData(prev => ({ ...prev, smoked }))
    if (!smoked) {
      // 禁煙成功の場合は対策不要なので直接送信可能
      setStep(1)
    } else {
      // 喫煙した場合は対策入力へ
      setStep(2)
    }
  }

  if (!challenge || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  const dailyDamage = Math.floor(profile.participation_fee / 30)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-white hover:text-gray-200 mb-4">
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-3xl font-bold text-white">今日の戦闘記録</h1>
          <p className="text-purple-200 mt-2">マネーモンスターとの戦いの結果を記録しよう</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* ステップ1: 喫煙質問 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-6xl block mb-6">🐉</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  今日煙草を吸いましたか？
                </h2>
                <p className="text-gray-600">
                  正直な記録がマネーモンスターへの最も効果的な攻撃となります
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => handleAnswerChange(false)}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    formData.smoked === false
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <span className="text-4xl block mb-2">🚭</span>
                  <span className="text-lg font-medium text-gray-900">いいえ</span>
                  <p className="text-sm text-gray-600 mt-1">今日は禁煙できました！</p>
                </button>

                <button
                  onClick={() => handleAnswerChange(true)}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    formData.smoked === true
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                >
                  <span className="text-4xl block mb-2">🚬</span>
                  <span className="text-lg font-medium text-gray-900">はい</span>
                  <p className="text-sm text-gray-600 mt-1">今日は吸ってしまいました</p>
                </button>
              </div>

              {formData.smoked === false && (
                <div className="text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? '記録中...' : '記録する'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ステップ2: 対策入力 */}
          {step === 2 && formData.smoked === true && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-4xl block mb-4">💭</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  明日の禁煙のための対策
                </h2>
                <p className="text-gray-600">
                  今日の経験を活かして、明日はマネーモンスターに大ダメージを与えましょう
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  明日の禁煙のためにどのような対策を取るつもりですか？
                </label>
                <textarea
                  value={formData.countermeasure}
                  onChange={(e) => setFormData(prev => ({ ...prev, countermeasure: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例：ストレス発散のために散歩をする、ガムを噛む、禁煙アプリを使う など"
                />
              </div>

              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? '記録中...' : '記録する'}
                </button>
              </div>
            </div>
          )}

          {/* ステップ3: 結果表示 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                {formData.smoked ? (
                  <>
                    <span className="text-6xl block mb-4">⚔️</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      小さなダメージを与えました
                    </h2>
                    <p className="text-gray-600 mb-6">
                      残念！今日はマネーモンスターに少し隙を与えてしまいました。
                      しかし、記録したことで、あなたは今日、再び奴に立ち向かう意思を示しました！
                    </p>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="text-blue-800">
                        <strong>与えたダメージ:</strong> ¥{Math.floor(dailyDamage * 0.1).toLocaleString()}
                        <br />
                        <span className="text-sm">（記録による小ダメージ）</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-6xl block mb-4">⚡</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      会心の一撃！
                    </h2>
                    <p className="text-gray-600 mb-6">
                      おめでとうございます！マネーモンスターに大ダメージを与え、
                      ¥{dailyDamage.toLocaleString()}を取り戻しました！
                      この調子で奴を打ち倒しましょう！
                    </p>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <p className="text-green-800">
                        <strong>与えたダメージ:</strong> ¥{dailyDamage.toLocaleString()}
                        <br />
                        <span className="text-sm">（禁煙成功による大ダメージ）</span>
                      </p>
                    </div>
                  </>
                )}

                {formData.smoked && formData.countermeasure && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
                    <p className="text-yellow-800">
                      <strong>明日への対策:</strong> {formData.countermeasure}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  明日も頑張ってマネーモンスターを倒しましょう！
                </p>
                <Link
                  href="/dashboard"
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 inline-block"
                >
                  ダッシュボードに戻る
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 