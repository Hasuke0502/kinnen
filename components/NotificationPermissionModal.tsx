'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  getNotificationPermission, 
  requestNotificationPermission,
  sendLocalNotification
} from '@/lib/notifications'

export default function NotificationPermissionModal() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const primaryButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const checkPermissionStatus = () => {
      // ブラウザが通知をサポートしているかチェック
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return
      }

      // 特定のページでは表示しない
      const currentPath = window.location.pathname
      const excludePaths = ['/auth/login', '/onboarding', '/auth/confirm']
      if (excludePaths.some(path => currentPath.startsWith(path))) {
        return
      }

      const permission = getNotificationPermission()
      
      // 既に許可済みまたは拒否済みの場合は表示しない
      if (permission.granted || permission.denied) {
        return
      }

      // 以前にモーダルを閉じた記録があるかチェック
      const hasSeenModal = localStorage.getItem('notification-modal-seen')
      if (hasSeenModal) {
        return
      }

      // デフォルト状態（未設定）の場合のみ表示
      if (permission.default) {
        setIsVisible(true)
        // アニメーション開始のために少し遅延
        setTimeout(() => setIsAnimating(true), 50)
      }
    }

    // 少し遅延させてから実行（レンダリング完了後）
    const timer = setTimeout(checkPermissionStatus, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleRequestPermission = async () => {
    setIsLoading(true)
    try {
      const granted = await requestNotificationPermission()
      
      if (granted) {
        // 許可された場合はウェルカム通知を送信
        sendLocalNotification('🎉 通知が有効になりました！', {
          body: '禁煙チャレンジの記録時間になったらお知らせします。30日間、一緒に頑張りましょう！',
          tag: 'permission-granted',
          icon: '/favicon.ico'
        })
      }
      
      // モーダルを閉じる
      closeModal()
    } catch (error) {
      console.error('Failed to request permission:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // モーダルを見たことを記録
    localStorage.setItem('notification-modal-seen', 'true')
    closeModal()
  }

  const handleLater = useCallback(() => {
    setIsVisible(false)
    setIsAnimating(false)
    
    // 24時間後に再表示するためのタイムスタンプを保存
    const tomorrow = new Date()
    tomorrow.setHours(tomorrow.getHours() + 24)
    localStorage.setItem('notification_reminder_time', tomorrow.getTime().toString())
  }, [])

  const closeModal = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
    }, 200) // アニメーション時間と合わせる
  }

  // キーボードイベントの処理
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleLater()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, handleLater])

  // フォーカス管理
  useEffect(() => {
    if (isVisible && isAnimating && primaryButtonRef.current) {
      primaryButtonRef.current.focus()
    }
  }, [isVisible, isAnimating])

  if (!isVisible) {
    return null
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* 背景オーバーレイ */}
      <div 
        className={`absolute inset-0 bg-black backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleLater}
      />
      
      {/* モーダルコンテンツ */}
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-6 transform transition-all duration-200 ${
        isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔔</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            記録リマインダーを有効にしませんか？
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            毎日の記録を忘れないよう、設定した時間にお知らせします。<br />
            継続的な記録が禁煙成功の鍵です！
          </p>
        </div>

        {/* 利点の説明 */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-indigo-900 mb-2">📈 通知のメリット</h3>
          <ul className="space-y-1 text-sm text-indigo-800">
            <li>• 記録し忘れを防げます</li>
            <li>• 継続的な習慣づくりをサポート</li>
            <li>• マネーモンスターとの戦いを有利に</li>
            <li>• 30日間のチャレンジ成功率アップ</li>
          </ul>
        </div>

        {/* ボタン */}
        <div className="space-y-3">
          <button
            ref={primaryButtonRef}
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isLoading ? '設定中...' : '🚀 通知を有効にする'}
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleLater}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              後で
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              使わない
            </button>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800">
            <span className="font-medium">💡 ヒント:</span> 
            後から設定画面でいつでも変更できます
          </p>
        </div>
      </div>
    </div>
  )
} 