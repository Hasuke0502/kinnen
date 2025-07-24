import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

export default async function DonationsPage() {
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

  // ユーザーのチャレンジ情報を取得
  const { data: userChallenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // 全ての募金先を取得
  const { data: donationTargets } = await supabase
    .from('donation_targets')
    .select('*')
    .eq('is_active', true)
    .order('name')

  // 全ての募金証明を取得
  const { data: donationProofs } = await supabase
    .from('donation_proofs')
    .select(`
      *,
      donation_targets (*)
    `)
    .order('donation_date', { ascending: false })

  // 各募金先ごとの総額を計算
  const totalByTarget = donationProofs?.reduce((acc, proof) => {
    const targetId = proof.donation_target_id
    acc[targetId] = (acc[targetId] || 0) + proof.total_amount
    return acc
  }, {} as Record<string, number>) || {}

  // 全体の総募金額
  const totalDonated = donationProofs?.reduce((sum, proof) => sum + proof.total_amount, 0) || 0

  // ユーザーの貢献額
  const userContribution = userChallenge ? 
    Math.floor(profile.participation_fee * (userChallenge.total_success_days / 30)) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="募金証明・社会貢献" 
        icon="🤝" 
        showBackButton={true}
        backHref="/dashboard"
        backLabel="ダッシュボード"
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 概要セクション */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white mb-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">📊 募金実績サマリー</h2>
              <p className="text-green-100 mb-6">
                禁煙チャレンジアプリを通じて、多くのユーザーの禁煙成功が社会貢献に繋がっています
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-2xl font-bold">¥{totalDonated.toLocaleString()}</p>
                  <p className="text-green-100">総募金額</p>
                </div>
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-2xl font-bold">{donationTargets?.length || 0}</p>
                  <p className="text-green-100">支援団体数</p>
                </div>
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-2xl font-bold">{donationProofs?.length || 0}</p>
                  <p className="text-green-100">募金実施回数</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* あなたの貢献 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🌟 あなたの貢献</h3>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    ¥{userContribution.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    現在の募金予定額
                  </p>
                  
                  {userChallenge && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>記録成功日数:</span>
                        <span className="font-medium">{userChallenge.total_success_days}日</span>
                      </div>
                      <div className="flex justify-between">
                        <span>達成率:</span>
                        <span className="font-medium">{((userChallenge.total_success_days / 30) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {userContribution > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      あなたの禁煙成功により、¥{userContribution.toLocaleString()}が社会貢献に繋がります！
                    </p>
                  </div>
                )}
              </div>
              
              {/* 選択している募金先 */}
              {donationTargets && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 あなたの選択</h3>
                  {donationTargets.find(target => target.id === profile.donation_target_id) && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">
                        {donationTargets.find(target => target.id === profile.donation_target_id)?.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {donationTargets.find(target => target.id === profile.donation_target_id)?.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        総募金額: ¥{(totalByTarget[profile.donation_target_id] || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 募金先一覧と実績 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">📋 募金実績一覧</h3>
                </div>
                
                {donationTargets && donationTargets.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {donationTargets.map((target) => {
                      const targetProofs = donationProofs?.filter(proof => proof.donation_target_id === target.id) || []
                      const targetTotal = totalByTarget[target.id] || 0
                      
                      return (
                        <div key={target.id} className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900">{target.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{target.description}</p>
                              
                              {target.website_url && (
                                <a
                                  href={target.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
                                >
                                  公式サイト →
                                </a>
                              )}
                            </div>
                            
                            <div className="text-right ml-6">
                              <p className="text-xl font-bold text-green-600">
                                ¥{targetTotal.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">総募金額</p>
                            </div>
                          </div>
                          
                          {/* 募金証明リスト */}
                          {targetProofs.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h5 className="text-sm font-medium text-gray-700">募金証明:</h5>
                              {targetProofs.map((proof) => (
                                <div key={proof.id} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium">
                                        ¥{proof.total_amount.toLocaleString()} - {new Date(proof.donation_date).toLocaleDateString('ja-JP')}
                                      </p>
                                      {proof.description && (
                                        <p className="text-xs text-gray-600 mt-1">{proof.description}</p>
                                      )}
                                    </div>
                                    <div className="flex space-x-2">
                                      {proof.proof_url && (
                                        <a
                                          href={proof.proof_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                        >
                                          証明書
                                        </a>
                                      )}
                                      {proof.receipt_url && (
                                        <a
                                          href={proof.receipt_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                                        >
                                          領収書
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {targetProofs.length === 0 && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                この団体への募金実績はまだありません
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    募金先が設定されていません
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 説明セクション */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">💡 募金の仕組み</h3>
            <div className="prose prose-blue text-sm">
              <ul className="space-y-2">
                <li>
                  <strong>個人別募金:</strong> 各ユーザーの禁煙チャレンジ達成率に応じて、参加費の一部が選択した団体に寄付されます
                </li>
                <li>
                  <strong>集約募金:</strong> 個々の少額寄付をアプリ全体で集計し、定期的に（月次）まとめて各団体に寄付を行います
                </li>
                <li>
                  <strong>透明性:</strong> すべての募金実績は証明書や領収書とともに公開され、寄付の透明性を確保しています
                </li>
                <li>
                  <strong>計算式:</strong> 募金額 = 参加費 × (記録成功日数 ÷ 30日)
                </li>
              </ul>
            </div>
          </div>

          {/* 免責事項 */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">⚠️ 重要事項</h4>
            <p className="text-xs text-gray-600">
              ※ 募金は定期的に実施されます。チャレンジ完了から実際の募金実施まで時間差が生じる場合があります。
              ※ 税務上の寄付金控除については、各団体のポリシーに従います。
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 