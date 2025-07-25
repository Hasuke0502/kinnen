'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface DonationTarget {
  id: string
  name: string
  description: string
  logo_url: string | null
  website_url: string | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [donationTargets, setDonationTargets] = useState<DonationTarget[]>([])
  const [error, setError] = useState('')
  const [isLoadingTargets, setIsLoadingTargets] = useState(false)
  const [totalTargetsCount, setTotalTargetsCount] = useState(0)
  
  // フォームデータ
  const [formData, setFormData] = useState({
    smokingFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    smokingAmount: 1,
    participationFee: 15000,
    payoutMethod: 'donation' as 'refund' | 'donation',
    donationTargetId: '',
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

  const fetchDonationTargets = useCallback(async () => {
    setIsLoadingTargets(true)
    try {
      const { data, error, count } = await supabase
        .from('donation_targets')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('name')
      
      if (error) {
        console.error('募金先取得エラー:', error)
        setError('募金先の取得に失敗しました')
        return
      }

      if (data && data.length > 0) {
        setTotalTargetsCount(count || data.length)
        // ランダムに並び替えて6つのおすすめを選択
        const shuffledData = [...data].sort(() => Math.random() - 0.5)
        const recommendedTargets = shuffledData.slice(0, 6)
        setDonationTargets(recommendedTargets)
        setFormData(prev => ({ ...prev, donationTargetId: recommendedTargets[0].id }))
      } else {
        setError('利用可能な募金先がありません')
      }
    } catch (error) {
      console.error('募金先取得エラー:', error)
      setError('募金先の取得に失敗しました')
    } finally {
      setIsLoadingTargets(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDonationTargets()
    checkUserProfile()
  }, [fetchDonationTargets, checkUserProfile])

  const refreshRecommendations = () => {
    fetchDonationTargets()
  }

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
      if (formData.payoutMethod === 'donation' && !formData.donationTargetId) {
        console.log('❌ 募金先未選択')
        setError('募金先を選択してください')
        return
      }
      console.log('✅ バリデーション成功')

      console.log('3️⃣ プロファイル作成データ準備中...')
      const profileData = {
        user_id: user.id,
        smoking_frequency: formData.smokingFrequency,
        smoking_amount: formData.smokingAmount,
        participation_fee: formData.participationFee,
        payout_method: formData.payoutMethod,
        donation_target_id: formData.payoutMethod === 'donation' ? formData.donationTargetId : null,
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
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 30)

      const challengeData = {
        user_id: user.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
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
    // 返金選択時はステップ4（募金先選択）をスキップ
    if (step === 3 && formData.payoutMethod === 'refund') {
      setStep(5)
    } else {
      setStep(step + 1)
    }
  }
  
  const prevStep = () => {
    setError('')
    // 返金選択時でステップ5から戻る場合はステップ3に戻る
    if (step === 5 && formData.payoutMethod === 'refund') {
      setStep(3)
    } else {
      setStep(step - 1)
    }
  }

  const handleSelectChange = (callback: () => void) => {
    callback()
  }

  const handleRadioClick = (callback: () => void) => {
    callback()
  }

  const handleRefreshRecommendations = () => {
    refreshRecommendations()
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
              <span className="text-sm font-medium text-gray-600">{step + 1}/6</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((step + 1) / 6) * 100}%` }}
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
                      <p className="text-gray-600">記録日数に応じて、お金を取り戻したり、募金したりできます</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="font-medium text-gray-900">2つの選択肢</p>
                      <p className="text-gray-600">返金を受け取るか、慈善団体への募金かを選べます</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">💡 重要なポイント</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• <strong>返金選択時</strong>：手数料500円を差し引いた金額が対象となります</li>
                  <li>• <strong>募金選択時</strong>：参加費の全額が対象となります（手数料なし）</li>
                  <li>• <strong>記録をつけなかった日はカウントされません</strong></li>
                  <li>• 30日間毎日記録をつけた場合、満額が返金または募金されます</li>
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

          {/* ステップ3: 返金・募金選択 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-4xl block mb-4">💰</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">取り戻したお金の使い道</h2>
                <p className="text-gray-600">マネーモンスターから取り戻したお金をどうするか選択してください</p>
              </div>

              <div className="space-y-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.payoutMethod === 'refund' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRadioClick(() => setFormData(prev => ({ ...prev, payoutMethod: 'refund' })))}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="payoutMethod"
                      value="refund"
                      checked={formData.payoutMethod === 'refund'}
                      onChange={() => handleRadioClick(() => setFormData(prev => ({ ...prev, payoutMethod: 'refund' })))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">💳 返金を受け取る</h3>
                      <p className="text-sm text-gray-600 mb-3">記録日数に応じて、参加費の一部が返金されます</p>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                        <p className="font-medium text-yellow-900 mb-1">⚠️ 手数料について</p>
                        <p className="text-yellow-800">
                          {formData.participationFee === 0 
                            ? '参加費0円の場合、手数料はかかりません'
                            : formData.participationFee <= 500
                            ? '参加費が500円以下の場合、返金額は0円となります'
                            : '返金処理手数料として500円がかかります'
                          }
                        </p>
                        
                        <div className="mt-2 text-xs text-yellow-700">
                          {formData.participationFee === 0 ? (
                            <>
                              <p><strong>計算方法：</strong> 0円（手数料なし）</p>
                              <p><strong>例：</strong> 参加費0円、20日記録成功した場合</p>
                              <p>→ <strong>0円が返金</strong>（手数料なし）</p>
                            </>
                          ) : formData.participationFee <= 500 ? (
                            <>
                              <p><strong>計算方法：</strong> 0円（参加費が500円以下）</p>
                              <p><strong>例：</strong> 参加費{formData.participationFee}円、20日記録成功した場合</p>
                              <p>→ <strong>0円が返金</strong></p>
                            </>
                          ) : (
                            <>
                              <p><strong>計算方法：</strong> （参加費 - 500円）× 記録成功日数 ÷ 30日</p>
                              <p><strong>例：</strong> 参加費{formData.participationFee.toLocaleString()}円、20日記録成功した場合</p>
                              <p>→ （{formData.participationFee.toLocaleString()}円 - 500円）× 20 ÷ 30 = <strong>{Math.round((formData.participationFee - 500) * 20 / 30).toLocaleString()}円が返金</strong></p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.payoutMethod === 'donation' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRadioClick(() => setFormData(prev => ({ ...prev, payoutMethod: 'donation' })))}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="payoutMethod"
                      value="donation"
                      checked={formData.payoutMethod === 'donation'}
                      onChange={() => handleRadioClick(() => setFormData(prev => ({ ...prev, payoutMethod: 'donation' })))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">🎁 募金する</h3>
                      <p className="text-sm text-gray-600 mb-3">記録日数に応じた金額を、選択した団体に寄付します</p>
                      
                      <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                        <p className="font-medium text-green-900 mb-1">✨ 手数料なし</p>
                        <p className="text-green-800">参加費の全額が寄付対象となります</p>
                        
                        <div className="mt-2 text-xs text-green-700">
                          <p><strong>計算方法：</strong> 参加費 × 記録成功日数 ÷ 30日</p>
                          <p><strong>例：</strong> 参加費{formData.participationFee.toLocaleString()}円、20日記録成功した場合</p>
                          <p>→ {formData.participationFee.toLocaleString()}円 × 20 ÷ 30 = <strong>{Math.round(formData.participationFee * 20 / 30).toLocaleString()}円を募金</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 重要なルール</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 毎日記録をつけることで「記録成功日数」としてカウントされます</li>
                  <li>• 禁煙できた日も、吸ってしまった日も、記録すれば成功日としてカウントされます</li>
                  <li>• チャレンジの途中放棄も可能ですが、参加費の返金はありません</li>
                  <li>• 30日間毎日記録をつけた場合：
                    {formData.payoutMethod === 'refund' ? (
                      formData.participationFee > 500 
                        ? ` 満額（参加費-500円）が返金されます`
                        : ` 返金額は0円となります`
                    ) : ` 満額（参加費）が募金されます`}
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">💡 目標金額</h4>
                <p className="text-gray-700 text-sm">
                  {formData.payoutMethod === 'refund' ? (
                    <>
                      <strong>目標取り戻し金額:</strong> ¥{
                        formData.participationFee > 500 
                          ? (formData.participationFee - 500).toLocaleString()
                          : '0'
                      }
                      <br />
                      <span className="text-xs text-gray-600">
                        {formData.participationFee === 0 
                          ? '（参加費0円のため手数料なし）'
                          : formData.participationFee <= 500
                          ? '（参加費が500円以下のため返金なし）'
                          : '（参加費 - 手数料500円）'
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>目標募金額:</strong> ¥{formData.participationFee.toLocaleString()}
                      <br />
                      <span className="text-xs text-gray-600">（参加費の全額）</span>
                    </>
                  )}
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

          {/* ステップ4: 募金先選択（募金選択時のみ） */}
          {step === 4 && formData.payoutMethod === 'donation' && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-4xl block mb-4">🎯</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">おすすめ寄付先</h2>
                <p className="text-gray-600">
                  チャレンジ達成率に応じた金額を寄付します
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {totalTargetsCount}の寄付先から厳選した6つをご紹介
                </p>
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={handleRefreshRecommendations}
                    disabled={isLoadingTargets}
                    className="inline-flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                  >
                    🔄 別の寄付先を提案
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {isLoadingTargets ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    新しい寄付先を探しています...
                  </div>
                ) : donationTargets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    利用可能な募金先がありません。
                    <button
                      onClick={handleRefreshRecommendations}
                      className="ml-2 text-indigo-600 hover:underline"
                    >
                      再読み込み
                    </button>
                  </div>
                ) : (
                  donationTargets.map((target) => (
                    <label
                      key={target.id}
                      className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.donationTargetId === target.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => handleRadioClick(() => setFormData(prev => ({ 
                        ...prev, 
                        donationTargetId: target.id 
                      })))}
                    >
                      <input
                        type="radio"
                        name="donationTarget"
                        value={target.id}
                        checked={formData.donationTargetId === target.id}
                        onChange={(e) => handleRadioClick(() => setFormData(prev => ({ 
                          ...prev, 
                          donationTargetId: e.target.value 
                        })))}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{target.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{target.description}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {target.website_url && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                if (target.website_url) {
                                  window.open(target.website_url, '_blank')
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-2 py-1"
                            >
                              詳細
                            </button>
                          )}
                          {formData.donationTargetId === target.id && (
                            <span className="text-indigo-600 text-lg">✓</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              
              <div className="text-center text-xs text-gray-500 bg-gray-50 p-3 rounded">
                💡 毎回異なる寄付先をおすすめしています。あなたの関心に合う活動を見つけてください。
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
                  disabled={!formData.donationTargetId}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {/* ステップ5: 記録時間設定 */}
          {step === 5 && (
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