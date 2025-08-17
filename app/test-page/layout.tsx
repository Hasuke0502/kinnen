import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'テストページ | 禁煙30日チャレンジ',
  description:
    'UIコンポーネントの表示やモーダル挙動を検証するためのテストページです。',
  robots: { index: false, follow: false },
}

export default function TestPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


