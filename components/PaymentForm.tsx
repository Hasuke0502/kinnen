'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  StripeCardElementChangeEvent
} from '@stripe/react-stripe-js'

// Stripe初期化
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  challengeId: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

// 実際の決済フォームコンポーネント
function CheckoutForm({ amount, challengeId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [cardComplete, setCardComplete] = useState(false)
  const [cardError, setCardError] = useState('')

  // Payment Intent作成
  const createPaymentIntent = useCallback(async () => {
    try {
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

      const { client_secret } = await response.json()
      setClientSecret(client_secret)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [amount, challengeId, onError])

  useEffect(() => {
    if (amount > 0) {
      createPaymentIntent()
    }
  }, [amount, createPaymentIntent])

  // カード情報の変更を監視
  const handleCardChange = (event: StripeCardElementChangeEvent) => {
    console.log('🔍 Card Change Event:', {
      complete: event.complete,
      error: event.error?.message,
      empty: event.empty
    })
    
    if (event.error) {
      setCardError(event.error.message)
      setCardComplete(false)
    } else {
      setCardError('')
      setCardComplete(event.complete)
    }
    
    // デバッグ: ボタン状態確認
    console.log('🔘 Button State Check:', {
      loading,
      stripe: !!stripe,
      clientSecret: !!clientSecret,
      cardComplete: event.complete,
      cardError: !!event.error,
      willBeDisabled: loading || !stripe || !clientSecret || !event.complete || !!event.error
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError('')
    setCardError('')

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('カード情報の入力が必要です')
      setLoading(false)
      return
    }

    try {
      // 決済確認
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      )

      if (confirmError) {
        setError(confirmError.message || '決済に失敗しました')
        onError?.(confirmError.message || '決済に失敗しました')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 決済成功
        onSuccess?.()
        router.push('/dashboard?payment=success')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFreeParticipation = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 0,
          challengeId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '参加登録に失敗しました')
      }

      onSuccess?.()
      router.push('/dashboard?payment=free')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true, // 郵便番号（住所）入力フィールドを非表示
    disableLink: true, // Link機能を無効化
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

        {amount === 0 ? (
          // 0円の場合
          <div className="space-y-3">
            <button
              onClick={handleFreeParticipation}
              disabled={loading}
              className="w-full py-3 px-4 rounded-md font-medium disabled:opacity-50 transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  処理中...
                </div>
              ) : (
                '無料でチャレンジを開始'
              )}
            </button>

            <p className="text-xs text-gray-600 text-center">
              チャレンジの開始により、利用規約に同意したものとみなされます
            </p>
          </div>
        ) : (
          // 有料の場合
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カード情報
              </label>
              <div className={`p-3 border rounded-md transition-colors ${
                cardError 
                  ? 'border-red-300 focus-within:ring-red-500 focus-within:border-red-500'
                  : cardComplete
                  ? 'border-green-300 focus-within:ring-green-500 focus-within:border-green-500'
                  : 'border-gray-300 focus-within:ring-indigo-500 focus-within:border-indigo-500'
              }`}>
                <CardElement 
                  options={cardElementOptions} 
                  onChange={handleCardChange}
                />
              </div>
              {cardError && (
                <p className="mt-1 text-sm text-red-600">{cardError}</p>
              )}
              {cardComplete && !cardError && (
                <p className="mt-1 text-sm text-green-600">✅ カード情報が正常に入力されました</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || !stripe || !clientSecret || !cardComplete || !!cardError}
                className={`w-full py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                  loading || !stripe || !clientSecret || !cardComplete || !!cardError
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg transform hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    処理中...
                  </div>
                ) : !cardComplete ? (
                  'カード情報を入力してください'
                ) : cardError ? (
                  'カード情報を確認してください'
                ) : (
                  `¥${amount.toLocaleString()}を支払ってチャレンジを開始`
                )}
              </button>

              <p className="text-xs text-gray-600 text-center">
                お支払いにより、利用規約と返金ポリシーに同意したものとみなされます
              </p>
            </div>
          </form>
        )}

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">🔒 安全な決済</h4>
          <p className="text-sm text-green-800">
            このサイトはStripeによって保護されています。クレジットカード情報は暗号化され、安全に処理されます。
          </p>
        </div>
      </div>
    </div>
  )
}

// メインのPaymentFormコンポーネント
export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
} 