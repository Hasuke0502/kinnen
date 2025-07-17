'use client'

import { useState, useEffect } from 'react'
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  saveNotificationSettings,
  getNotificationSettings,
  sendLocalNotification,
  resetNotificationModalState
} from '@/lib/notifications'

interface NotificationSettingsProps {
  defaultRecordTime?: string
}

export default function NotificationSettings({ defaultRecordTime = '20:00' }: NotificationSettingsProps) {
  const [permission, setPermission] = useState({ granted: false, denied: false, default: true })
  const [enabled, setEnabled] = useState(false)
  const [recordTime, setRecordTime] = useState(defaultRecordTime)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 初期状態を読み込み
    const currentPermission = getNotificationPermission()
    setPermission(currentPermission)

    const settings = getNotificationSettings()
    if (settings) {
      setEnabled(settings.enabled && currentPermission.granted)
      setRecordTime(settings.recordTime)
    }
  }, [])

  const handleRequestPermission = async () => {
    setLoading(true)
    try {
      const granted = await requestNotificationPermission()
      const newPermission = getNotificationPermission()
      setPermission(newPermission)
      
      if (granted) {
        setEnabled(true)
        // テスト通知を送信
        sendLocalNotification('🎉 通知が有効になりました！', {
          body: '禁煙チャレンジの記録時間になったらお知らせします。30日間、一緒に頑張りましょう！',
          tag: 'permission-granted',
          icon: '/favicon.ico'
        })
        
        // モーダルの表示状態をリセット（次回拒否した場合に再表示可能にするため）
        resetNotificationModalState()
      }
    } catch (error) {
      console.error('Failed to request permission:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = (newEnabled: boolean) => {
    if (newEnabled && !permission.granted) {
      handleRequestPermission()
      return
    }

    setEnabled(newEnabled)
    saveNotificationSettings({
      enabled: newEnabled,
      recordTime
    })
  }

  const handleTimeChange = (newTime: string) => {
    setRecordTime(newTime)
    saveNotificationSettings({
      enabled,
      recordTime: newTime
    })
  }

  const sendTestNotification = () => {
    sendLocalNotification('📝 テスト通知', {
      body: 'これは通知のテストです。記録の時間になったらこのような通知が届きます。',
      tag: 'test-notification'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">🔔 通知設定</h3>
      
      <div className="space-y-4">
        {/* 通知許可状態 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">通知許可状態</p>
            <p className="text-xs text-gray-600">
              {permission.granted ? '✅ 許可済み' : 
               permission.denied ? '❌ 拒否済み' : 
               '⏳ 未設定'}
            </p>
          </div>
          {!permission.granted && (
            <button
              onClick={handleRequestPermission}
              disabled={loading || permission.denied}
              className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '設定中...' : '許可する'}
            </button>
          )}
        </div>

        {/* 通知有効/無効 */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">記録リマインダー</label>
            <p className="text-xs text-gray-600">設定した時間に記録を促す通知を送信</p>
          </div>
          <button
            onClick={() => handleToggleEnabled(!enabled)}
            disabled={!permission.granted}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-indigo-600' : 'bg-gray-200'
            } ${!permission.granted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* 記録時間設定 */}
        {enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">記録時間</label>
            <input
              type="time"
              value={recordTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              毎日この時間に記録を促す通知が届きます
            </p>
          </div>
        )}

        {/* テスト通知ボタン */}
        {permission.granted && (
          <button
            onClick={sendTestNotification}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md text-sm hover:bg-gray-700"
          >
            テスト通知を送信
          </button>
        )}

        {/* 注意事項 */}
        <div className="text-xs text-gray-500 p-3 bg-yellow-50 rounded-lg">
          <p className="font-medium text-yellow-800 mb-1">⚠️ 注意事項</p>
          <ul className="space-y-1">
            <li>• ブラウザを閉じると通知は停止します</li>
            <li>• スマートフォンの場合、ブラウザアプリがバックグラウンドで動作している必要があります</li>
            <li>• より確実な通知には、PWA（Progressive Web App）機能をご利用ください</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 