import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationPermissionModal from '@/components/NotificationPermissionModal';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kinnen.vercel.app";

export const metadata: Metadata = {
  title: "禁煙30日チャレンジ",
  description:
    "マネーモンスターと戦い、30日間で禁煙を成功させよう！金銭的なインセンティブとゲーム性で禁煙をサポートします。",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "禁煙30日チャレンジ",
    description:
      "マネーモンスターと戦い、30日間で禁煙を成功させよう！金銭的なインセンティブとゲーム性で禁煙をサポートします。",
    url: siteUrl,
    siteName: "禁煙30日チャレンジ",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/og?title=%E7%A6%81%E7%85%9930%E6%97%A5%E3%83%81%E3%83%A3%E3%83%AC%E3%83%B3%E3%82%B8",
        width: 1200,
        height: 630,
        alt: "禁煙30日チャレンジ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "禁煙30日チャレンジ",
    description:
      "マネーモンスターと戦い、30日間で禁煙を成功させよう！金銭的なインセンティブとゲーム性で禁煙をサポートします。",
    images: [
      "/og?title=%E7%A6%81%E7%85%9930%E6%97%A5%E3%83%81%E3%83%A3%E3%83%AC%E3%83%B3%E3%82%B8",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: "/favicon.ico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        {children}
        <NotificationPermissionModal />
        <Footer />
      </body>
    </html>
  );
}
