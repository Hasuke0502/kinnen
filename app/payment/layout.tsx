import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinnen.vercel.app'

export const metadata: Metadata = {
  title: '参加費のお支払い | 禁煙30日チャレンジ',
  description:
    'チャレンジの参加費を安全にお支払いください。Stripeによるクレジットカード決済に対応しています。',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/payment`,
    title: '参加費のお支払い | 禁煙30日チャレンジ',
    description: '安全なクレジットカード決済（Stripe）に対応しています。',
    images: [
      { url: '/og?title=%E6%94%AF%E6%89%95%E3%81%84', width: 1200, height: 630, alt: '支払いページ OGP' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '参加費のお支払い | 禁煙30日チャレンジ',
    description: '安全なクレジットカード決済（Stripe）に対応しています。',
    images: ['/og?title=%E6%94%AF%E6%89%95%E3%81%84'],
  },
}

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


