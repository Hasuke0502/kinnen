// 通知機能のユーティリティ
// 実際の実装では、Web Push API やプッシュ通知サービス（Firebase Cloud Messaging等）を使用

export interface NotificationSettings {
  recordTime: string
  enabled: boolean
}

export interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

// ブラウザの通知許可状態を取得
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, denied: true, default: false }
  }

  const permission = Notification.permission
  return {
    granted: permission === 'granted',
    denied: permission === 'denied',
    default: permission === 'default'
  }
}

// 通知許可をリクエスト
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// ローカル通知を送信（テスト用）
export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Notifications not supported')
    return
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted')
    return
  }

  const defaultOptions: NotificationOptions = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options
  }

  try {
    new Notification(title, defaultOptions)
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}

// 記録リマインダーのスケジュール設定（基本版）
export function scheduleRecordReminder(recordTime: string): void {
  if (typeof window === 'undefined') return

  // 既存のリマインダーをクリア
  clearRecordReminder()

  const [hours, minutes] = recordTime.split(':').map(Number)
  const now = new Date()
  const reminderTime = new Date()
  reminderTime.setHours(hours, minutes, 0, 0)

  // 今日の時刻が過ぎている場合は明日に設定
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1)
  }

  const timeUntilReminder = reminderTime.getTime() - now.getTime()

  const timeoutId = setTimeout(() => {
    sendLocalNotification('📝 記録の時間です', {
      body: '今日の禁煙チャレンジの記録をつけましょう！',
      tag: 'record-reminder',
      requireInteraction: true
    })

    // 翌日のリマインダーも設定
    scheduleRecordReminder(recordTime)
  }, timeUntilReminder)

  // タイムアウトIDを保存
  localStorage.setItem('recordReminderTimeoutId', timeoutId.toString())
}

// 記録リマインダーをクリア
export function clearRecordReminder(): void {
  if (typeof window === 'undefined') return

  const timeoutId = localStorage.getItem('recordReminderTimeoutId')
  if (timeoutId) {
    clearTimeout(Number(timeoutId))
    localStorage.removeItem('recordReminderTimeoutId')
  }
}

// 通知設定を保存
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('notificationSettings', JSON.stringify(settings))
  
  if (settings.enabled) {
    scheduleRecordReminder(settings.recordTime)
  } else {
    clearRecordReminder()
  }
}

// 通知設定を取得
export function getNotificationSettings(): NotificationSettings | null {
  if (typeof window === 'undefined') return null

  const settings = localStorage.getItem('notificationSettings')
  return settings ? JSON.parse(settings) : null
}

// 通知許可モーダルの表示状態をリセット
export function resetNotificationModalState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('notification-modal-seen')
}

// 達成マイルストーン通知
export function sendAchievementNotification(achievementRate: number, successDays: number): void {
  const milestones = [25, 50, 75, 100]
  const currentMilestone = milestones.find(milestone => 
    achievementRate >= milestone && achievementRate < milestone + (100 / 30)
  )

  if (!currentMilestone) return

  let title = ''
  let body = ''

  switch (currentMilestone) {
    case 25:
      title = '🎉 25%達成！'
      body = `${successDays}日間の禁煙成功！マネーモンスターにダメージを与えています！`
      break
    case 50:
      title = '🔥 50%達成！'
      body = `${successDays}日間の禁煙成功！マネーモンスターが弱ってきました！`
      break
    case 75:
      title = '⚡ 75%達成！'
      body = `${successDays}日間の禁煙成功！マネーモンスターが瀕死状態です！`
      break
    case 100:
      title = '👑 完全勝利！'
      body = `30日間の禁煙チャレンジ完了！マネーモンスターを完全に撃破しました！`
      break
  }

  sendLocalNotification(title, {
    body,
    tag: `achievement-${currentMilestone}`,
    requireInteraction: true
  })
} 