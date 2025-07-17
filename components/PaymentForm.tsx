'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaymentFormProps {
  amount: number
  challengeId: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function PaymentForm({ amount, challengeId, onSuccess, onError }: PaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      // 0円の場合は決済処理をスキップ
      if (amount === 0) {
        console.log('参加費が0円のため決済処理をスキップします')
        onSuccess?.()
        router.push('/dashboard?payment=free')
        return
      }

      // 支払いインテントを作成
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          challengeId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '支払い処理に失敗しました')
      }

      const { client_secret, payment_intent_id } = await response.json()

      // 実際の本番環境では、ここでStripe Elements等を使用して決済処理を行う
      // MVPとしては支払い完了として扱う
      console.log('Payment intent created:', payment_intent_id)
      
      // デモ用：3秒後に成功とみなす
      await new Promise(resolve => setTimeout(resolve, 3000))

      onSuccess?.()
      router.push('/dashboard?payment=success')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {amount === 0 ? '🎉 無料でチャレンジ開始' : '💳 参加費のお支払い'}
      </h3>
      
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${amount === 0 ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
          <h4 className={`font-medium mb-2 ${amount === 0 ? 'text-green-900' : 'text-blue-900'}`}>
            {amount === 0 ? '参加費' : 'お支払い金額'}
          </h4>
          <p className={`text-2xl font-bold ${amount === 0 ? 'text-green-900' : 'text-blue-900'}`}>
            ¥{amount.toLocaleString()}
          </p>
          <p className={`text-sm mt-1 ${amount === 0 ? 'text-green-700' : 'text-blue-700'}`}>
            {amount === 0 ? '無料で30日間の禁煙チャレンジに参加' : '30日間の禁煙チャレンジ参加費'}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 チャレンジについて</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {amount === 0 ? (
              <>
                <li>• 参加費0円で30日間の禁煙チャレンジに参加できます</li>
                <li>• 毎日の記録でマネーモンスターにダメージを与えましょう</li>
                <li>• 金銭的なリターンはありませんが、健康と達成感を得られます</li>
                <li>• いつでも設定から参加費を変更してリチャレンジ可能</li>
              </>
            ) : (
              <>
                <li>• 参加費は30日間のチャレンジ開始時にお支払いいただきます</li>
                <li>• 記録成功日数に応じて、選択した方法で処理されます</li>
                <li>• 未達成分はアプリの運営費として使用されます</li>
                <li>• 安全で確実な決済処理を提供します</li>
              </>
            )}
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md font-medium disabled:opacity-50 transition-colors ${
              amount === 0 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                処理中...
              </div>
            ) : amount === 0 ? (
              '無料でチャレンジを開始'
            ) : (
              `¥${amount.toLocaleString()}を支払ってチャレンジを開始`
            )}
          </button>

          <p className="text-xs text-gray-600 text-center">
            {amount === 0 
              ? 'チャレンジの開始により、利用規約に同意したものとみなされます'
              : 'お支払いにより、利用規約と返金ポリシーに同意したものとみなされます'
            }
          </p>
        </div>

        {/* デモ用の注意書き */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">🚧 デモ版について</h4>
          <p className="text-sm text-yellow-800">
            これはデモ版です。実際の決済は行われません。
            本番環境では、Stripe Elementsを使用した安全な決済フォームが表示されます。
          </p>
        </div>
      </div>
    </div>
  )
} 