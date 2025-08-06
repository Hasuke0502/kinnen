'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import MoneyMonster from '@/components/MoneyMonster'
import Modal from '@/components/Modal'
import { getJSTDate, getJSTTime } from '@/lib/dateUtils'
import { restartChallenge, finishChallenge } from '@/app/auth/actions'
import type { Database } from '@/lib/database.types'

// 型定義
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type Challenge = Database['public']['Tables']['challenges']['Row']
type DailyRecord = Database['public']['Tables']['daily_records']['Row']
interface DashboardClientProps {
  profile: UserProfile;
  challenge: Challenge;
  todayRecord: DailyRecord | null;
  records: DailyRecord[];
  message?: string;
  isGameCompletedFromParams: boolean;
}

export default function DashboardClient({
  profile,
  challenge,
  todayRecord,
  records,
  message,
  isGameCompletedFromParams,
}: DashboardClientProps) {
  const [showGameCompletionModal, setShowGameCompletionModal] = useState(false)

  useEffect(() => {
    if (isGameCompletedFromParams) {
      setShowGameCompletionModal(true)
    }
  }, [isGameCompletedFromParams])

  const handleCloseGameCompletionModal = () => {
    setShowGameCompletionModal(false)
  }

  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  const currentDate = getJSTTime() // 日本時間での現在時刻を使用
  const totalDays = 30
  
  // 経過日数の計算を修正：日本時間基準
  const elapsedDays = Math.max(0, Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  
  // 現在何日目かを計算（1日目、2日目...）
  const currentDay = elapsedDays + 1
  const remainingDays = Math.max(0, totalDays - currentDay)
  
  // 実際の記録データから記録成功日数を計算（より正確）
  const actualSuccessDays = records ? records.length : 0
  
  // 未記録日数 = 経過日数（30日上限） - 記録成功日数
  const cappedElapsedDays = Math.min(currentDay, 30)
  const unrecordedDays = Math.max(0, cappedElapsedDays - actualSuccessDays)
  
  const achievementRate = totalDays > 0 ? (actualSuccessDays / totalDays) * 100 : 0
  const currentSuccessRate = cappedElapsedDays > 0 ? (actualSuccessDays / cappedElapsedDays) * 100 : 0
  
  // 返金額の計算
  // 手数料なしで計算：参加費 × (記録成功日数 / 30)
  const payoutAmount = Math.floor(profile.participation_fee * (actualSuccessDays / totalDays))
  
  const remainingAmount = profile.participation_fee - payoutAmount

  // カレンダー生成
  const generateCalendar = () => {
    const calendar = []
    const recordMap = new Map(records?.map(r => [r.record_date, r]) || [])
    const todayStr = getJSTDate() // 日本時間での今日の日付
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const record = recordMap.get(dateStr)
      
      // 日付文字列での比較で正確な判定
      const isPast = dateStr <= todayStr
      const isFuture = dateStr > todayStr
      
      calendar.push({
        date: date,
        dateStr: dateStr,
        formattedDate: date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }), // MM/DD 形式
        record: record,
        isPast: isPast,
        isFuture: isFuture
      })
    }
    
    return calendar
  }

  const calendar = generateCalendar()

  return (
    <>
      {message && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {decodeURIComponent(message)}
        </div>
      )}

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">達成率</p>
              <p className="text-2xl font-semibold text-gray-900">{achievementRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚭</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">記録成功日数</p>
              <p className="text-2xl font-semibold text-gray-900">{actualSuccessDays}日</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">残り日数</p>
              <p className="text-2xl font-semibold text-gray-900">{remainingDays}日</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                返金予定額
              </p>
              <p className="text-2xl font-semibold text-gray-900">¥{payoutAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* メインエリア */}
        <div className="lg:col-span-2 space-y-6">
          {/* マネーモンスター */}
          <MoneyMonster
            totalAmount={profile.participation_fee}
            remainingAmount={remainingAmount}
            achievementRate={achievementRate}
            totalSuccessDays={actualSuccessDays}
            totalFailedDays={unrecordedDays}
            isGameCompleted={isGameCompletedFromParams}
            onRestartChallenge={restartChallenge}
            onFinishChallenge={finishChallenge}
          />

          {/* 今日の記録 */}
          {!isGameCompletedFromParams && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">今日の記録</h3>
              
              {todayRecord ? (
                <div className="text-center">
                  <span className="text-4xl block mb-4">
                    {todayRecord.smoked ? '😔' : '🎉'}
                  </span>
                  <p className="text-lg font-medium">
                    {todayRecord.smoked ? '今日は喫煙してしまいました' : '今日は禁煙成功！'}
                  </p>
                  {todayRecord.smoked && todayRecord.countermeasure && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>明日への対策:</strong> {todayRecord.countermeasure}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-4">
                    記録済み: {new Date(todayRecord.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-4xl block mb-4">❓</span>
                  <p className="text-lg font-medium mb-4">今日の記録をつけましょう</p>
                  <Link
                    href="/record"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 inline-block"
                  >
                    記録をつける
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 30日間カレンダー */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">30日間カレンダー</h3>
            
            <div className="grid grid-cols-7 gap-2 mb-4">
              {calendar.map((day) => (
                <div
                  key={day.dateStr}
                  className={`
                    aspect-square flex items-center justify-center text-sm font-medium rounded-lg border-2 relative
                    ${day.isFuture 
                      ? 'border-gray-200 bg-gray-50 text-gray-400' 
                      : day.record 
                        ? day.record.smoked 
                          ? 'border-red-200 bg-red-50 text-red-700' 
                          : 'border-green-200 bg-green-50 text-green-700'
                        : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                    }
                  `}
                >
                  <span>{day.formattedDate}</span>
                  {day.record && (
                    <span className="absolute top-1 right-1 text-xs">
                      {day.record.smoked ? '🚬' : '🚭'}
                    </span>
                  )}
                  {!day.record && day.isPast && !day.isFuture && (
                    <span className="absolute top-1 right-1 text-xs">❓</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded mr-2"></div>
                <span>記録済み（禁煙）</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded mr-2"></div>
                <span>記録済み（喫煙）</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-50 border-2 border-yellow-200 rounded mr-2"></div>
                <span>未記録</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded mr-2"></div>
                <span>未来</span>
              </div>
            </div>
          </div>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 現在の成績 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">現在の成績</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>現在の成功率</span>
                  <span className="font-medium">{currentSuccessRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, currentSuccessRate)}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{actualSuccessDays}</p>
                  <p className="text-xs text-gray-600">記録成功日数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{unrecordedDays}</p>
                  <p className="text-xs text-gray-600">未記録日数</p>
                </div>
              </div>
            </div>
          </div>

          {/* 返金予定 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                返金状況
              </h3>
              <Link
                href="/settings"
                className="text-sm hover:underline text-blue-600 hover:text-blue-800"
              >
                設定 →
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  ¥{payoutAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  現在の返金予定額
                </p>
              </div>
              
              <div className="text-xs text-gray-500">
                参加費 × (記録成功日数 ÷ 30日) = 返金額
              </div>
            </div>
          </div>

          {/* 設定情報 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">設定情報</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>参加費</span>
                <span>¥{profile.participation_fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>記録時間</span>
                <span>{profile.record_time}</span>
              </div>
              <div className="flex justify-between">
                <span>開始日</span>
                <span>{startDate.toLocaleDateString('ja-JP')}</span>
              </div>
              <div className="flex justify-between">
                <span>終了日</span>
                <span>{endDate.toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 記録一覧 */}
      <div id="records-history" className="mt-8 scroll-mt-24">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">記録履歴</h3>
          </div>
          {records && records.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {records.slice().reverse().map((record) => (
                <div key={record.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {record.smoked ? '🚬' : '🚭'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(record.record_date).toLocaleDateString('ja-JP')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {record.smoked ? '喫煙' : '禁煙成功'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ¥{Math.floor(profile.participation_fee / 30).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        記録成功日数カウント
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.created_at).toLocaleTimeString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  {record.countermeasure && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>対策:</strong> {record.countermeasure}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <span className="text-4xl block mb-4">📝</span>
              <p className="text-lg font-medium text-gray-900 mb-2">記録履歴はまだありません</p>
              <p className="text-gray-600 mb-4">毎日の記録をつけると、ここに履歴が表示されます</p>
              <Link
                href="/record"
                className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 inline-block"
              >
                今日の記録をつける
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ゲーム終了モーダル */}
      <Modal
        isOpen={showGameCompletionModal}
        onClose={handleCloseGameCompletionModal}
        title="禁煙チャレンジ完了！"
        description="30日間の禁煙チャレンジが完了しました。お疲れ様でした！"
      >
        <div className="text-center">
          {/* 達成率に応じたメッセージ */}
          <p className="text-xl font-bold mb-4">
            {achievementRate >= 100 && "完全勝利！マネーモンスターを完全に倒しました！"}
            {achievementRate >= 75 && achievementRate < 100 && "大勝利！マネーモンスターに大ダメージを与えました！"}
            {achievementRate >= 50 && achievementRate < 75 && "勝利！マネーモンスターとの戦いに勝ちました！"}
            {achievementRate >= 25 && achievementRate < 50 && "健闘！記録を続けた努力は素晴らしいです！"}
            {achievementRate < 25 && "チャレンジ参加ありがとうございました。次回はきっと良い結果になります！"}
          </p>
          <p className="text-lg mb-2">30日中 <span className="font-bold">{actualSuccessDays}日</span> 記録を続けました</p>
          <p className="text-lg mb-2">達成率 <span className="font-bold">{achievementRate.toFixed(1)}%</span></p>
          <p className="text-lg mb-4">
            ¥{payoutAmount.toLocaleString()}を取り戻しました
          </p>
          
          <div className="mt-6 flex flex-col space-y-4">
            <form action={restartChallenge}>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                onClick={handleCloseGameCompletionModal} // モーダルを閉じる
              >
                もう一度チャレンジする
              </button>
            </form>
            <form action={finishChallenge}>
              <button
                type="submit"
                className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                onClick={handleCloseGameCompletionModal} // モーダルを閉じる
              >
                今回は終了する
              </button>
            </form>
          </div>
        </div>
      </Modal>
    </>
  )
} 