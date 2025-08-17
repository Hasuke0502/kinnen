import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinnen.vercel.app'

export const metadata: Metadata = {
  title: '今日の記録 | 禁煙30日チャレンジ',
  description:
    'マネーモンスターとの戦いの結果を今日も記録しましょう。禁煙成功日は自動で成功日にカウントされます。',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/record`,
    title: '今日の記録 | 禁煙30日チャレンジ',
    description: '今日の戦闘記録を入力しましょう。',
    images: [
      { url: '/og?title=%E4%BB%8A%E6%97%A5%E3%81%AE%E8%A8%98%E9%8C%B2', width: 1200, height: 630, alt: '今日の記録 OGP' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '今日の記録 | 禁煙30日チャレンジ',
    description: '今日の戦闘記録を入力しましょう。',
    images: ['/og?title=%E4%BB%8A%E6%97%A5%E3%81%AE%E8%A8%98%E9%8C%B2'],
  },
}

export default function RecordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


