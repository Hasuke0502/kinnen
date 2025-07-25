'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'

interface HeaderProps {
  title: string
  icon?: string
  showBackButton?: boolean
  backHref?: string
  backLabel?: string
}

export default function Header({ 
  title, 
  icon = '🏰', 
  showBackButton = false, 
  backHref = '/dashboard',
  backLabel = 'ダッシュボード' 
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLinkClick = (item?: { isScrollLink?: boolean; href: string }) => {
    
    // スクロールリンクの場合の処理
    if (item?.isScrollLink && item.href.includes('#')) {
      const [path, anchor] = item.href.split('#')
      
      // 現在のページがダッシュボードの場合、スムーズスクロール
      if (pathname === '/dashboard' && path === '/dashboard') {
        setTimeout(() => {
          const element = document.getElementById(anchor)
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            })
          }
        }, 100)
        return false // リンクの通常動作を防ぐ
      }
    }
  }

  // ナビゲーションアイテム
  const navigationItems = [
    {
      href: '/dashboard',
      label: 'ダッシュボード',
      icon: '🏠',
      isActive: pathname === '/dashboard'
    },
    {
      href: '/dashboard#records-history',
      label: '記録履歴',
      icon: '📋',
      isActive: false, // 記録履歴は常にダッシュボード内のセクションなので個別のアクティブ状態は持たない
      isScrollLink: true
    },
    {
      href: '/donations',
      label: '募金証明',
      icon: '🤝',
      isActive: pathname === '/donations'
    },
    {
      href: '/settings',
      label: '設定',
      icon: '⚙️',
      isActive: pathname === '/settings'
    }
  ]

  return (
    <header className="bg-white shadow-md relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 sm:py-6">
          {/* 左側: タイトル部分 */}
          <div className="flex items-center">
            {showBackButton && (
              <Link 
                href={backHref} 
                className="text-gray-500 hover:text-gray-700 mr-3 sm:mr-4 text-sm sm:text-base"
              >
                ← {backLabel}
              </Link>
            )}
            <span className="text-xl sm:text-2xl mr-2 sm:mr-3">{icon}</span>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {title}
            </h1>
          </div>

          {/* 右側: デスクトップナビゲーション */}
          <nav className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navigationItems.map((item) => (
                item.isScrollLink ? (
                  <button
                    key={item.href}
                    onClick={(e) => {
                      e.preventDefault()
                      handleLinkClick(item)
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    onClick={() => handleLinkClick()}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              ))}
              
              <form action={logout} className="ml-2">
                <button
                  type="submit"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </nav>

          {/* モバイル: ハンバーガーメニューボタン */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            onClick={handleMenuToggle}
            aria-expanded={isMenuOpen}
            aria-label="メニューを開く"
          >
            <svg
              className={`h-6 w-6 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t animate-slide-down z-40">
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item) => (
              item.isScrollLink ? (
                <button
                  key={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    handleLinkClick(item)
                  }}
                  className={`w-full flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    item.isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    item.isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  onClick={() => handleLinkClick()}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              )
            ))}
            
            <div className="pt-2 border-t border-gray-200">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  <span className="mr-3 text-lg">🚪</span>
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* モバイルメニューが開いている時のオーバーレイ */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-25 z-30"
          onClick={handleMenuToggle}
          aria-hidden="true"
        />
      )}
    </header>
  )
} 