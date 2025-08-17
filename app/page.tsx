import type { Metadata } from "next";
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinnen.vercel.app'

export const metadata: Metadata = {
  title: "禁煙30日チャレンジ | マネーモンスターと戦い禁煙を習慣化",
  description: "金銭的インセンティブとゲーム性で30日間の禁煙をサポートするアプリ。毎日記録をつけてマネーモンスターを倒し、お金と健康を取り戻そう。",
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: '禁煙30日チャレンジ | マネーモンスターと戦い禁煙を習慣化',
    description: '金銭的インセンティブとゲーム性で30日間の禁煙をサポートするアプリ。',
    images: [
      {
        url: '/og?title=%E7%A6%81%E7%85%99%E3%81%AB%E6%88%A6%E3%81%84%E5%8B%9D%E3%81%A4%EF%BC%81',
        width: 1200,
        height: 630,
        alt: '禁煙30日チャレンジ トップ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '禁煙30日チャレンジ | マネーモンスターと戦い禁煙を習慣化',
    description: '金銭的インセンティブとゲーム性で30日間の禁煙をサポートするアプリ。',
    images: ['/og?title=%E7%A6%81%E7%85%99%E3%81%AB%E6%88%A6%E3%81%84%E5%8B%9D%E3%81%A4%EF%BC%81'],
  },
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
            
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
              <p>
                今日も店にタバコを買いに行こうとしているね。
              </p>
              <p className="text-yellow-300 font-semibold text-xl">
                しかし、あなたの今月のたばこ代はマネーモンスターが奪ったぞ。
              </p>
              <p className="text-white font-bold text-2xl">
                禁煙を成功させ、お金を取り戻せ！！
              </p>
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
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center">
             
             <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
               禁煙の記録すれば、お金が戻ってくる
             </p>
           </div>

           <div className="mt-12">
             <div className="bg-indigo-50 rounded-2xl p-8 border border-indigo-200">
               <div className="text-center space-y-6">
                 <div className="text-6xl">💰</div>
                 <h3 className="text-2xl font-bold text-gray-900">シンプルな返金システム</h3>
                 <div className="max-w-2xl mx-auto space-y-4 text-lg text-gray-700">
                   <p>
                     <span className="font-semibold text-indigo-600">参加費を設定</span>（0円も可能）
                   </p>
                   <p>
                     <span className="font-semibold text-indigo-600">30日間、毎日記録</span>（禁煙できた日も吸った日もOK）
                   </p>
                   <p>
                     <span className="font-semibold text-indigo-600">達成率に応じて返金</span>（30日間記録成功で全額返金）
                   </p>
                 </div>
                 
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
