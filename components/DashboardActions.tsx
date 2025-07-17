'use client'

import Link from 'next/link'
import { useSoundManager } from './SoundManager'

interface DashboardActionsProps {
  hasRecordToday: boolean
}

export default function DashboardActions({ hasRecordToday }: DashboardActionsProps) {
  const { playClickSound } = useSoundManager()

  const handleLinkClick = () => {
    playClickSound()
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">クイックアクション</h3>
      <div className="space-y-3">
        {!hasRecordToday ? (
          <Link
            href="/record"
            className="w-full bg-indigo-600 text-white text-center py-2 px-4 rounded-md font-medium hover:bg-indigo-700 block"
            onClick={handleLinkClick}
          >
            今日の記録をつける
          </Link>
        ) : (
          <div className="text-center text-gray-500">
            今日の記録は完了しています
          </div>
        )}
        <Link
          href="/progress"
          className="w-full bg-gray-600 text-white text-center py-2 px-4 rounded-md font-medium hover:bg-gray-700 block"
          onClick={handleLinkClick}
        >
          進捗詳細を見る
        </Link>
        <Link
          href="/donations"
          className="w-full bg-green-600 text-white text-center py-2 px-4 rounded-md font-medium hover:bg-green-700 block"
          onClick={handleLinkClick}
        >
          募金証明を見る
        </Link>
      </div>
    </div>
  )
}

interface RecordActionProps {
  hasRecordToday: boolean
}

export function RecordAction({ hasRecordToday }: RecordActionProps) {
  const { playClickSound } = useSoundManager()

  const handleLinkClick = () => {
    playClickSound()
  }

  if (hasRecordToday) {
    return null
  }

  return (
    <Link
      href="/record"
      className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 inline-block"
      onClick={handleLinkClick}
    >
      記録をつける
    </Link>
  )
} 