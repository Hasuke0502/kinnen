'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { getJSTDate } from '@/utils/date'

// 音声効果のための関数
const playClickSound = () => {
  try {
    const audio = new Audio('/sounds/click.mp3')
    audio.volume = 0.3 // 音量を30%に設定
    audio.play().catch(error => {
      console.log('音声再生エラー:', error)
    })
  } catch (error) {
    console.log('音声ファイル読み込みエラー:', error)
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // フォームデータ
  const [formData, setFormData] = useState({
    smokingFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    smokingAmount: 1,
    participationFee: 15000,
    payoutMethod: 'refund' as 'refund',
    refundPlan: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    recordTime: '20:00'
  })

  const checkUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // 既存のプロファイルがあるかチェック
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        // 既にプロファイルがある場合はダッシュボードへ
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('プロファイル確認エラー:', error)
    }
  }, [supabase, router])

  useEffect(() => {
    checkUserProfile()
  }, [checkUserProfile])

  const calculateMonthlyAmount = useCallback(() => {
    const pricePerPack = 500 // 1箱500円と仮定
    let monthlyPacks = 0

    switch (formData.smokingFrequency) {
      case 'daily':
        monthlyPacks = formData.smokingAmount * 30
        break
      case 'weekly':
        monthlyPacks = formData.smokingAmount * 4
        break
      case 'monthly':
        monthlyPacks = formData.smokingAmount
        break
    }

    const monthlyAmount = monthlyPacks * pricePerPack
    // 100の位で四捨五入
    return Math.round(monthlyAmount / 100) * 100
  }, [formData.smokingFrequency, formData.smokingAmount])

  useEffect(() => {
    const calculatedFee = calculateMonthlyAmount()
    setFormData(prev => ({ ...prev, participationFee: calculatedFee }))
  }, [calculateMonthlyAmount])

  // 参加費のプルダウン選択肢を動的に生成
  const generateParticipationFeeOptions = () => {
    const recommendedFee = calculateMonthlyAmount()
    const baseOptions = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000, 18000, 20000, 25000, 30000, 35000, 40000, 45000, 50000]
    
    // 推奨金額が既存の選択肢にない場合は追加
    if (!baseOptions.includes(recommendedFee)) {
      baseOptions.push(recommendedFee)
      baseOptions.sort((a, b) => a - b) // 昇順でソート
    }
    
    return baseOptions
  }

  const handleSubmit = async () => {
    console.log('🚀 チャレンジ開始ボタンが押されました')
    playClickSound()
    setLoading(true)
    setError('')
    
    try {
      console.log('1️⃣ ユーザー認証確認中...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ ユーザー認証失敗')
        setError('ユーザー認証が必要です')
        router.push('/auth/login')
        return
      }
      console.log('✅ ユーザー認証成功:', user.email)

      // バリデーション
      console.log('2️⃣ バリデーション確認中...')
      console.log('✅ バリデーション成功')

      console.log('3️⃣ プロファイル作成データ準備中...')
      const profileData = {
        user_id: user.id,
        smoking_frequency: formData.smokingFrequency,
        smoking_amount: formData.smokingAmount,
        participation_fee: formData.participationFee,
        payout_method: formData.payoutMethod,
        refund_plan: formData.refundPlan,
        record_time: formData.recordTime
      }
      console.log('📋 プロファイル作成データ:', profileData)

      // ユーザープロファイルの作成
      console.log('4️⃣ プロファイル作成実行中...')
      const { data: createdProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()

      if (profileError) {
        console.error('❌ プロファイル作成エラー:', profileError)
        setError(`プロファイル作成エラー: ${profileError.message}`)
        return
      }

      console.log('✅ プロファイル作成成功:', createdProfile)

      // チャレンジの作成
      console.log('5️⃣ チャレンジ作成準備中...')
      const jstToday = getJSTDate() // 日本時間での今日の日付を取得

      // 30日後の日付をJSTで計算
      const startDateObj = new Date(jstToday);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(startDateObj.getDate() + 29); // 30日チャレンジなので、開始日から29日後が最終日
      const jstEndDate = endDateObj.toISOString().split('T')[0];

      const challengeData = {
        user_id: user.id,
        start_date: jstToday, // 日本時間で取得した日付を設定
        end_date: jstEndDate, // 計算した日本時間での終了日を設定
        status: 'active' as const
      }

      console.log('📋 チャレンジ作成データ:', challengeData)

      console.log('6️⃣ チャレンジ作成実行中...')
      const { data: challengeResult, error: challengeError } = await supabase
        .from('challenges')
        .insert(challengeData)
        .select()

      if (challengeError) {
        console.error('❌ チャレンジ作成エラー:', challengeError)
        setError(`チャレンジ作成エラー: ${challengeError.message}`)
        return
      }

      console.log('✅ チャレンジ作成成功:', challengeResult)

      // 参加費が0円の場合は決済をスキップしてダッシュボードへ
      console.log('7️⃣ 遷移先決定中...')
      if (formData.participationFee === 0) {
        console.log('💰 0円参加 → ダッシュボードへ遷移')
        router.push('/dashboard?setup=complete')
      } else {
        console.log('💳 有料参加 → 決済ページへ遷移')
        router.push(`/payment?challenge_id=${challengeResult[0].id}`)
      }
      console.log('🎉 処理完了！')
    } catch (error) {
      console.error('💥 予期しないエラー:', error)
      setError(`予期しないエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
      console.log('🏁 handleSubmit処理終了')
    }
  }

  const nextStep = () => {
    setError('')
    playClickSound()
    setStep(step + 1)
  }
  
  const prevStep = () => {
    setError('')
    playClickSound()
    setStep(step - 1)
  }

  const handleSelectChange = (callback: () => void) => {
    playClickSound()
    callback()
  }

  const handleRadioClick = (callback: () => void) => {
    playClickSound()
    callback()
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* エラー表示 */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* プログレスバー */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">設定進捗</span>
              <span className="text-sm font-medium text-gray-600">{step + 1}/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((step + 1) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* ステップ0: ゲームルール説明 */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-6xl block mb-6">🐉</span>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">マネーモンスターとの戦い</h2>
                <p className="text-lg text-gray-600 mb-6">
                  禁煙30日チャレンジは、あなたのお金を奪う<br />
                  『マネーモンスター』を倒すゲームです！
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🎮 ゲームルール</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="font-medium text-gray-900">毎日記録をつけるだけ</p>
                      <p className="text-gray-600">禁煙できた日も、吸ってしまった日も、記録すればマネーモンスターにダメージを与えられます</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-medium text-gray-900">30日間の挑戦</p>
                      <p className="text-gray-600">記録日数に応じて、お金を取り戻すことができます</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="font-medium text-gray-900">返金システム</p>
                      <p className="text-gray-600">記録成功日数に応じて参加費の一部が返金されます</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">💡 重要なポイント</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• <strong>返金システム</strong>：参加費と記録日数に応じて返金されます</li>
                  <li>• <strong>記録をつけなかった日はカウントされません</strong></li>
                  <li>• 30日間毎日記録をつけた場合、満額（参加費の全額）が返金されます</li>
                </ul>
              </div>

              <button
                onClick={nextStep}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md text-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                マネーモンスターとの戦いを始める 🚀
              </button>
            </div>
          )}

          {/* ステップ1: 喫煙状況 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-4xl block mb-4">🚬</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">喫煙状況を教えてください</h2>
                <p className="text-gray-600">現在の喫煙状況に基づいて参加費を算出します</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">頻度</label>
                  <select
                    value={formData.smokingFrequency}
                    onChange={(e) => handleSelectChange(() => setFormData(prev => ({ 
                      ...prev, 
                      smokingFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' 
                    })))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="daily">1日</option>
                    <option value="weekly">1週間</option>
                    <option value="monthly">1ヶ月</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">箱数</label>
                  <select
                    value={formData.smokingAmount}
                    onChange={(e) => handleSelectChange(() => setFormData(prev => ({ 
                      ...prev, 
                      smokingAmount: parseFloat(e.target.value) 
                    })))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="0.5">0.5箱</option>
                    <option value="1">1箱</option>
                    <option value="1.5">1.5箱</option>
                    <option value="2">2箱</option>
                    <option value="2.5">2.5箱</option>
                    <option value="3">3箱</option>
                    <option value="3.5">3.5箱</option>
                    <option value="4">4箱</option>
                    <option value="4.5">4.5箱</option>
                    <option value="5">5箱</option>
                    <option value="5.5">5.5箱</option>
                    <option value="6">6箱</option>
                    <option value="6.5">6.5箱</option>
                    <option value="7">7箱</option>
                    <option value="7.5">7.5箱</option>
                    <option value="8">8箱</option>
                    <option value="8.5">8.5箱</option>
                    <option value="9">9箱</option>
                    <option value="9.5">9.5箱</option>
                    <option value="10">10箱</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-indigo-800">
                  <span className="font-medium">月額タバコ代: ¥{calculateMonthlyAmount().toLocaleString()}</span>
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {/* ステップ2: 参加費設定 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-4xl block mb-4">💰</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">参加費を設定してください</h2>
                <p className="text-gray-600">
                  月額タバコ代を基に推奨金額を算出しました
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  参加費（推奨: ¥{calculateMonthlyAmount().toLocaleString()}）
                </label>
                <select
                  value={formData.participationFee}
                  onChange={(e) => handleSelectChange(() => setFormData(prev => ({ 
                    ...prev, 
                    participationFee: parseInt(e.target.value) 
                  })))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {generateParticipationFeeOptions().map(amount => (
                    <option key={amount} value={amount}>
                      ¥{amount.toLocaleString()}
                      {amount === calculateMonthlyAmount() && ' (推奨)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">🐉 マネーモンスターの体力</h4>
                <p className="text-purple-800 text-sm mb-3">
                  参加費¥{formData.participationFee.toLocaleString()}が、マネーモンスターの体力となります。
                  毎日の記録でダメージを与え、30日間で完全勝利を目指しましょう！
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {/* ステップ3: 返金プラン選択 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-4xl block mb-4">🎯</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">返金プランを選択してください</h2>
                <p className="text-gray-600">あなたの禁煙意欲に合わせてプランを選んでください</p>
              </div>

              <div className="space-y-4">
                {/* 初級プラン */}
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.refundPlan === 'beginner' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  onClick={() => {
                    playClickSound()
                    setFormData(prev => ({ ...prev, refundPlan: 'beginner' }))
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">初級プラン</h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">MVP</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        現在の返金システムをそのまま適用する最も基本的なプランです
                      </p>
                      
                      {/* 返金計算ロジック */}
                      <div className="bg-blue-50 p-3 rounded text-sm mb-3">
                        <p className="font-medium text-blue-900 mb-1">返金計算ロジック</p>
                        <p className="text-blue-800 mb-2">
                          参加費 × 記録成功日数 ÷ 30日
                        </p>
                        <p className="text-blue-700 text-xs">
                          禁煙できた日も、吸ってしまった日も、記録すれば成功日としてカウントされます
                        </p>
                      </div>

                      {/* 返金計算ロジックの具体例 */}
                      <div className="bg-green-50 p-3 rounded text-sm mb-3">
                        <p className="font-medium text-green-900 mb-1">📊 返金計算例</p>
                        <div className="text-green-800 text-xs">
                          <p><strong>参加費{formData.participationFee.toLocaleString()}円、20日記録成功した場合</strong></p>
                          <p>→ {formData.participationFee.toLocaleString()}円 × 20 ÷ 30 = <strong>{Math.round(formData.participationFee * 20 / 30).toLocaleString()}円が返金</strong></p>
                        </div>
                      </div>

                      {/* 重要なルール */}
                      <div className="bg-yellow-50 p-3 rounded text-sm">
                        <p className="font-medium text-yellow-900 mb-1">⚠️ 重要なルール</p>
                        <ul className="text-yellow-800 text-xs space-y-1">
                          <li>• 毎日記録をつけることで「記録成功日数」としてカウントされます</li>
                          <li>• 禁煙できた日も、吸ってしまった日も、記録すれば成功日としてカウントされます</li>
                          <li>• 30日間毎日記録をつけた場合： 満額（参加費の全額）が返金されます</li>
                          <li>• チャレンジの途中放棄も可能ですが、参加費の返金はありません</li>
                        </ul>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.refundPlan === 'beginner' 
                          ? 'border-green-500 bg-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {formData.refundPlan === 'beginner' && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 中級プラン */}
                <div className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50 relative">
                  <div className="absolute top-2 right-2">
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      🔒 準備中
                    </span>
                  </div>
                  <div className="flex items-start justify-between opacity-60">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">中級プラン</h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">準備中</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        ユーザーの禁煙成功日数に応じて返金額が変動するプラン
                      </p>
                      <div className="bg-yellow-50 p-3 rounded text-sm mb-3">
                        <p className="font-medium text-yellow-900 mb-1">返金計算ロジック</p>
                        <p className="text-yellow-800">(満額 - 500円) × 禁煙成功日 / 30日</p>
                        <p className="text-yellow-700 text-xs mt-1">
                          禁煙努力が直接返金額に反映されます
                        </p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded text-sm">
                        <p className="font-medium text-orange-900 mb-1">📝 「禁煙成功日」の定義</p>
                        <p className="text-orange-800 text-xs">
                          中級プランにおける「禁煙成功日」は、喫煙を記録しなかった日数を指します
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">🔒</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 上級プラン */}
                <div className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50 relative">
                  <div className="absolute top-2 right-2">
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      🔒 準備中
                    </span>
                  </div>
                  <div className="flex items-start justify-between opacity-60">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">上級プラン</h3>
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">準備中</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        毎日の禁煙記録が厳密に管理され、一度でも失敗すると返金対象外となる厳格なプラン
                      </p>
                      <div className="bg-red-50 p-3 rounded text-sm mb-3">
                        <p className="font-medium text-red-900 mb-1">返金計算ロジック</p>
                        <p className="text-red-800">毎日禁煙記録を達成した場合: 満額 - 500円が返金</p>
                        <p className="text-red-700 text-xs mt-1">
                          一度でも喫煙を記録した場合、または未記録のまま次の日が到来した場合: ゲームオーバー（返金なし）
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 rounded text-sm">
                        <p className="font-medium text-red-900 mb-1">📝 「未記録」の定義</p>
                        <p className="text-red-800 text-xs">
                          上級プランにおける「未記録」は、特定の日の喫煙状況が記録されずに次の日が始まった時点を指します
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">🔒</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">💰 参加費とリターン</h4>
                <div className="text-sm text-purple-800 space-y-2">
                  <p><strong>参加費:</strong> 月のタバコ代を目安に設定します（¥{formData.participationFee.toLocaleString()}）</p>
                  <p><strong>返金:</strong> 記録日数に応じて、参加費の一部が返金されます</p>
                  <p><strong>目標金額:</strong> ¥{formData.participationFee.toLocaleString()}（参加費の全額）</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  次へ
                </button>
              </div>
            </div>
          )}



          {/* ステップ4: 記録時間設定 */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-4xl block mb-4">⏰</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">記録時間を設定してください</h2>
                <p className="text-gray-600">毎日この時間に記録を促すリマインダーが届きます</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">記録時間</label>
                <input
                  type="time"
                  value={formData.recordTime}
                  onChange={(e) => handleSelectChange(() => setFormData(prev => ({ 
                    ...prev, 
                    recordTime: e.target.value 
                  })))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">🏁 設定完了！</h3>
                <p className="text-green-700 text-sm">
                  これで30日間の禁煙チャレンジを開始する準備が整いました。
                  マネーモンスターとの戦いを始めましょう！
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '設定中...' : 'チャレンジ開始！'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 