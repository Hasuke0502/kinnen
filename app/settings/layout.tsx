import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinnen.vercel.app'

export const metadata: Metadata = {
  title: '設定 | 禁煙30日チャレンジ',
  description:
    '通知設定やチャレンジ設定、アカウント情報などを確認・更新できます。',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/settings`,
    title: '設定 | 禁煙30日チャレンジ',
    description: '通知設定やチャレンジ設定、アカウント情報などを確認・更新できます。',
    images: [
      { url: '/og?title=%E8%A8%AD%E5%AE%9A', width: 1200, height: 630, alt: '設定 OGP' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '設定 | 禁煙30日チャレンジ',
    description: '通知設定やチャレンジ設定、アカウント情報などを確認・更新できます。',
    images: ['/og?title=%E8%A8%AD%E5%AE%9A'],
  },
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


