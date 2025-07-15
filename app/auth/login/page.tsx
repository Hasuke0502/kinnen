'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // URLからエラーやメッセージを取得
  useState(() => {
    const urlError = searchParams.get('error')
    const urlMessage = searchParams.get('message')
    
    if (urlError) {
      setError(decodeURIComponent(urlError))
    }
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage))
    }
  })

  const resetForm = () => {
    setError('')
    setMessage('')
    setEmail('')
    setPassword('')
  }

  const handleTabChange = (isLoginTab: boolean) => {
    setIsLogin(isLoginTab)
    resetForm()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError('ログインに失敗しました: ' + error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError('アカウント作成に失敗しました: ' + error.message)
      } else {
        setMessage('確認メールを送信しました。メールをご確認ください。')
      }
    } catch (error) {
      setError('予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー部分 */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
            <span className="text-4xl">👹</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            禁煙30日チャレンジ
          </h2>
          <p className="mt-2 text-center text-sm text-purple-200">
            マネーモンスターと戦い、あなたのお金を取り戻そう！
          </p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="bg-green-900/50 border border-green-500 text-green-100 px-4 py-3 rounded-lg backdrop-blur-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 px-4 py-3 rounded-lg backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-8 border border-white/20">
          {/* タブ */}
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => handleTabChange(true)}
              className={`flex-1 py-3 px-4 text-center font-medium rounded-l-lg transition-all duration-200 ${
                isLogin
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20'
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => handleTabChange(false)}
              className={`flex-1 py-3 px-4 text-center font-medium rounded-r-lg transition-all duration-200 ${
                !isLogin
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20'
              }`}
            >
              新規登録
            </button>
          </div>

          {/* フォーム */}
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg placeholder-purple-200 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 backdrop-blur-sm"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg placeholder-purple-200 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 backdrop-blur-sm"
                placeholder="パスワードを入力"
              />
              {!isLogin && (
                <p className="mt-2 text-xs text-purple-200">
                  パスワードは6文字以上で設定してください
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </div>
              ) : (
                <>
                  {isLogin ? (
                    <>
                      ログインして戦いを始める ⚔️
                    </>
                  ) : (
                    <>
                      アカウント作成してチャレンジ開始 🚀
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* 補足情報 */}
          <div className="mt-6 text-center">
            {isLogin ? (
              <p className="text-xs text-purple-200">
                アカウントをお持ちでない方は「新規登録」タブをクリック
              </p>
            ) : (
              <p className="text-xs text-purple-200">
                新規登録後、確認メールが送信されます。メールの認証を完了してからログインしてください。
              </p>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="text-center">
          <p className="text-xs text-purple-300">
            マネーモンスターからお金を取り戻す冒険が始まります
          </p>
        </div>
      </div>
    </div>
  )
} 