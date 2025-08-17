import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinnen.vercel.app'

export const metadata: Metadata = {
  title: 'ログイン / 新規登録 | 禁煙30日チャレンジ',
  description:
    'アカウントにログインまたは新規登録して、禁煙30日チャレンジを始めましょう。',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/auth/login`,
    title: 'ログイン / 新規登録 | 禁煙30日チャレンジ',
    description:
      'アカウントにログインまたは新規登録して、禁煙30日チャレンジを始めましょう。',
    images: [
      { url: '/og?title=%E3%83%AD%E3%82%B0%E3%82%A4%E3%83%B3', width: 1200, height: 630, alt: 'ログイン OGP' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ログイン / 新規登録 | 禁煙30日チャレンジ',
    description:
      'アカウントにログインまたは新規登録して、禁煙30日チャレンジを始めましょう。',
    images: ['/og?title=%E3%83%AD%E3%82%B0%E3%82%A4%E3%83%B3'],
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


