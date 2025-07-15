import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ログイン済みの場合はダッシュボードにリダイレクト
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <span className="text-8xl mb-6 block">🏰</span>
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              <span className="block">禁煙30日</span>
              <span className="block text-yellow-400">チャレンジ</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              タバコの煙から生まれた悪しき存在「マネーモンスター」からお金と健康を取り戻す冒険が始まります
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">🐉 マネーモンスターとの戦い</h2>
            <p className="text-gray-300 mb-6">
              あなたが喫煙によって失った大切なお金と健康は、マネーモンスターたちに奪われていました。
              毎日の記録でモンスターにダメージを与え、30日間で完全勝利を目指しましょう！
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-4">
                <span className="text-2xl block mb-2">💰</span>
                <h3 className="font-semibold text-white">金銭的インセンティブ</h3>
                <p className="text-gray-300">達成率に応じた募金で社会貢献</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <span className="text-2xl block mb-2">🎮</span>
                <h3 className="font-semibold text-white">ゲーム性</h3>
                <p className="text-gray-300">RPG風のストーリーで楽しく継続</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <span className="text-2xl block mb-2">📊</span>
                <h3 className="font-semibold text-white">進捗トラッキング</h3>
                <p className="text-gray-300">30日間の詳細な記録と分析</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              冒険を始める
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
            >
              仕組みを見る
            </Link>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">仕組み</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              どうやって禁煙を成功させるのか？
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white text-2xl mx-auto">
                  1️⃣
                </div>
                <h3 className="mt-6 text-lg leading-6 font-medium text-gray-900">設定</h3>
                <p className="mt-2 text-base text-gray-500">
                  喫煙状況と参加費を設定し、募金先を選択
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white text-2xl mx-auto">
                  2️⃣
                </div>
                <h3 className="mt-6 text-lg leading-6 font-medium text-gray-900">毎日記録</h3>
                <p className="mt-2 text-base text-gray-500">
                  30日間、毎日の禁煙状況を記録してモンスターと戦う
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white text-2xl mx-auto">
                  3️⃣
                </div>
                <h3 className="mt-6 text-lg leading-6 font-medium text-gray-900">進捗確認</h3>
                <p className="mt-2 text-base text-gray-500">
                  リアルタイムで達成率と募金予定額を確認
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white text-2xl mx-auto">
                  4️⃣
                </div>
                <h3 className="mt-6 text-lg leading-6 font-medium text-gray-900">社会貢献</h3>
                <p className="mt-2 text-base text-gray-500">
                  達成率に応じて選んだ団体に募金され、証明書を確認
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
