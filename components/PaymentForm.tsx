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
      <h3 className="text-lg font-medium text-gray-900 mb-4">💳 参加費のお支払い</h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">お支払い金額</h4>
          <p className="text-2xl font-bold text-blue-900">¥{amount.toLocaleString()}</p>
          <p className="text-sm text-blue-700 mt-1">
            30日間の禁煙チャレンジ参加費
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">💡 お支払いについて</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• 参加費は30日間のチャレンジ開始時にお支払いいただきます</li>
            <li>• 禁煙成功日数に応じて、選択した団体に募金されます</li>
            <li>• 未達成分はアプリの運営費として使用されます</li>
            <li>• 安全で確実な決済処理を提供します</li>
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
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                処理中...
              </div>
            ) : (
              `¥${amount.toLocaleString()}を支払ってチャレンジを開始`
            )}
          </button>

          <p className="text-xs text-gray-600 text-center">
            お支払いにより、利用規約と返金ポリシーに同意したものとみなされます
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