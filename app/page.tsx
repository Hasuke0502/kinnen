import type { Metadata } from "next";
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "禁煙30日チャレンジ | マネーモンスターと戦い禁煙を習慣化",
  description: "金銭的インセンティブとゲーム性で30日間の禁煙をサポートするアプリ。毎日記録をつけてマネーモンスターを倒し、お金と健康を取り戻そう。",
};

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
              タバコの煙から生まれた悪しき存在「マネーモンスター」があなたのお金を奪っています！
              毎日記録をつけるだけでモンスターにダメージを与え、お金を取り戻すことができます。
              <span className="block mt-2 text-yellow-300 font-semibold">
                禁煙できた日も、吸ってしまった日も、記録すれば成功日としてカウントされます！
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-4">
                <span className="text-2xl block mb-2">💰</span>
                <h3 className="font-semibold text-white">金銭的インセンティブ</h3>
                <p className="text-gray-300">達成率に応じて返金受取または募金で社会貢献を選択</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <span className="text-2xl block mb-2">🎮</span>
                <h3 className="font-semibold text-white">ゲーム性</h3>
                <p className="text-gray-300">マネーモンスターを倒してお金を取り戻すRPG風ストーリー</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <span className="text-2xl block mb-2">📊</span>
                <h3 className="font-semibold text-white">簡単な記録システム</h3>
                <p className="text-gray-300">記録するだけで成功！30日間の進捗を視覚的に確認</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center mb-8 sm:mb-12">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              冒険を始める
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
                  喫煙状況と参加費（0円も可能）を設定し、返金か募金かを選択
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white text-2xl mx-auto">
                  2️⃣
                </div>
                <h3 className="mt-6 text-lg leading-6 font-medium text-gray-900">毎日記録</h3>
                <p className="mt-2 text-base text-gray-500">
                  30日間、記録をつけるだけでOK！禁煙した日も吸った日も成功日にカウント
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white text-2xl mx-auto">
                  3️⃣
                </div>
                <h3 className="mt-6 text-lg leading-6 font-medium text-gray-900">進捗確認</h3>
                <p className="mt-2 text-base text-gray-500">
                  マネーモンスターとの戦いを可視化！取り戻し予定額をリアルタイム表示
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white text-2xl mx-auto">
                  4️⃣
                </div>
                <h3 className="mt-6 text-lg leading-6 font-medium text-gray-900">結果</h3>
                <p className="mt-2 text-base text-gray-500">
                  達成率に応じて返金を受取、または選んだ団体への募金で社会貢献
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 特定商取引法へのリンク（トップにも明示） */}
      <div className="bg-white/10 text-center py-8">
        <Link href="/legal/commercial-transactions" className="text-gray-100 underline">
          特定商取引法に基づく表記
        </Link>
      </div>
    </div>
  )
}
