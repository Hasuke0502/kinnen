import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinnen.vercel.app'

export const metadata: Metadata = {
  title: 'オンボーディング | 禁煙30日チャレンジ',
  description: '初回設定を行い、参加費と記録時間を決めて禁煙30日チャレンジを開始しましょう。',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/onboarding`,
    title: 'オンボーディング | 禁煙30日チャレンジ',
    description: '初回設定を行い、参加費と記録時間を決めてチャレンジを開始しましょう。',
    images: [
      { url: '/og?title=%E3%82%AA%E3%83%B3%E3%83%9C%E3%83%BC%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0', width: 1200, height: 630, alt: 'オンボーディング OGP' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'オンボーディング | 禁煙30日チャレンジ',
    description: '初回設定を行い、参加費と記録時間を決めてチャレンジを開始しましょう。',
    images: ['/og?title=%E3%82%AA%E3%83%B3%E3%83%9C%E3%83%BC%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0'],
  },
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


