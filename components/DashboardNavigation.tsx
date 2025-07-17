'use client'

import Link from 'next/link'
import { SoundButton, useSoundManager } from './SoundManager'
import { logout } from '@/app/auth/actions'

export default function DashboardNavigation() {
  const { playClickSound } = useSoundManager()

  const handleLinkClick = () => {
    playClickSound()
  }

  return (
    <div className="flex items-center space-x-4">
      <Link
        href="/donations"
        className="text-green-600 hover:text-green-800 px-4 py-2 rounded-md text-sm font-medium"
        onClick={handleLinkClick}
      >
        募金証明
      </Link>
      <Link
        href="/settings"
        className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
        onClick={handleLinkClick}
      >
        設定
      </Link>
      <form action={logout}>
        <SoundButton
          type="submit"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          ログアウト
        </SoundButton>
      </form>
    </div>
  )
} 