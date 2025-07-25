'use client'

import { useEffect, useState } from 'react'

interface MoneyMonsterProps {
  totalAmount: number
  remainingAmount: number
  achievementRate: number
  totalSuccessDays: number
  totalFailedDays: number
  showDamageAnimation?: boolean
  lastDamage?: number
  isSuccess?: boolean
  isGameCompleted?: boolean
  onRestartChallenge?: () => Promise<void>
  onFinishChallenge?: () => Promise<void>
}

export default function MoneyMonster({
  totalAmount,
  remainingAmount,
  achievementRate,
  totalSuccessDays,
  totalFailedDays,
  showDamageAnimation = false,
  lastDamage = 0,
  isSuccess = false,
  isGameCompleted = false,
  onRestartChallenge,
  onFinishChallenge
}: MoneyMonsterProps) {
  const [animatingDamage, setAnimatingDamage] = useState(false)
  const [currentMonsterState, setCurrentMonsterState] = useState('healthy')
  
  // モンスターの状態を決定
  useEffect(() => {
    if (achievementRate >= 100) {
      setCurrentMonsterState('defeated')
    } else if (achievementRate >= 75) {
      setCurrentMonsterState('critical')
    } else if (achievementRate >= 50) {
      setCurrentMonsterState('damaged')
    } else if (achievementRate >= 25) {
      setCurrentMonsterState('injured')
    } else {
      setCurrentMonsterState('healthy')
    }
  }, [achievementRate])

  // ダメージアニメーション
  useEffect(() => {
    if (showDamageAnimation) {
      setAnimatingDamage(true)
      const timer = setTimeout(() => setAnimatingDamage(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showDamageAnimation])

  const getMonsterEmoji = () => {
    switch (currentMonsterState) {
      case 'defeated':
        return '💀'
      case 'critical':
        return '😵'
      case 'damaged':
        return '😰'
      case 'injured':
        return '😠'
      case 'healthy':
      default:
        return '🐉'
    }
  }

  const getMonsterSize = () => {
    const baseSize = 6
    const sizeReduction = Math.floor(achievementRate / 20)
    return Math.max(3, baseSize - sizeReduction)
  }

  const getMonsterMessage = () => {
    if (achievementRate >= 100) {
      return '完全勝利！マネーモンスターを倒しました！'
    } else if (achievementRate >= 75) {
      return 'あと少し！マネーモンスターが弱っています！'
    } else if (achievementRate >= 50) {
      return 'いい調子！大ダメージを与えています！'
    } else if (achievementRate >= 25) {
      return '順調にダメージを与えています！'
    } else {
      return 'マネーモンスターとの戦いが始まりました...'
    }
  }

  const getGameCompletionMessage = () => {
    if (achievementRate >= 100) {
      return '完全勝利！マネーモンスターを完全に倒しました！'
    } else if (achievementRate >= 75) {
      return '大勝利！マネーモンスターに大ダメージを与えました！'
    } else if (achievementRate >= 50) {
      return '勝利！マネーモンスターとの戦いに勝ちました！'
    } else if (achievementRate >= 25) {
      return '健闘！記録を続けた努力は素晴らしいです！'
    } else {
      return 'チャレンジ参加ありがとうございました。次回はきっと良い結果になります！'
    }
  }

  const getBackgroundGradient = () => {
    if (achievementRate >= 100) {
      return 'from-green-600 to-blue-600'
    } else if (achievementRate >= 75) {
      return 'from-yellow-600 to-orange-600'
    } else if (achievementRate >= 50) {
      return 'from-orange-600 to-red-600'
    } else {
      return 'from-purple-900 to-indigo-900'
    }
  }

  return (
    <div className={`bg-gradient-to-br ${getBackgroundGradient()} rounded-lg p-6 text-white relative overflow-hidden transition-all duration-1000`}>
      {/* 背景エフェクト */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white to-transparent animate-pulse"></div>
      </div>
      
      {/* ダメージアニメーション */}
      {animatingDamage && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold animate-bounce ${isSuccess ? 'text-yellow-300' : 'text-orange-300'}`}>
            {isSuccess ? `⚡ 大ダメージ！¥${lastDamage.toLocaleString()}取り戻し` : '💥 ダメージ！'}
          </div>
          {isSuccess && (
            <>
              <div className="absolute top-1/4 left-1/4 text-2xl animate-ping">✨</div>
              <div className="absolute top-1/3 right-1/4 text-2xl animate-ping" style={{ animationDelay: '0.2s' }}>⭐</div>
              <div className="absolute bottom-1/4 left-1/3 text-2xl animate-ping" style={{ animationDelay: '0.4s' }}>💫</div>
            </>
          )}
        </div>
      )}

      <div className="relative z-10">
        <div className="text-center">
          {/* モンスター表示 */}
          <div className={`transition-all duration-500 ${animatingDamage ? 'animate-pulse' : ''}`}>
            <span 
              className={`block mb-4 transition-all duration-300 text-${getMonsterSize()}xl`}
              style={{ 
                filter: currentMonsterState === 'defeated' ? 'grayscale(100%)' : 'none',
                transform: animatingDamage ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {getMonsterEmoji()}
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {achievementRate >= 100 ? '👑 勝利！' : 'マネーモンスター'}
          </h2>
          
          <p className="text-purple-200 mb-4">
            {achievementRate >= 100 
              ? 'すべてのお金を取り戻しました！' 
              : `体力: ¥${remainingAmount.toLocaleString()} / ¥${totalAmount.toLocaleString()}`
            }
          </p>
          
          {/* 体力ゲージ */}
          <div className="w-full bg-purple-800 rounded-full h-4 mb-4 relative overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ${
                achievementRate >= 100 
                  ? 'bg-gradient-to-r from-green-400 to-blue-400' 
                  : 'bg-gradient-to-r from-red-500 to-yellow-500'
              }`}
              style={{ width: `${Math.max(0, 100 - achievementRate)}%` }}
            />
            {/* ゲージのキラキラエフェクト */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
          
          <p className="text-sm text-purple-200 mb-2">
            {getMonsterMessage()}
          </p>
          
          {/* あなたが取り戻した金額の表示（コメントアウトを解除） */}
          <p className="text-sm text-purple-200 mb-4">
            あなたが取り戻した金額: ¥{(totalAmount - remainingAmount).toLocaleString()}
          </p>

          {/* 戦闘統計 */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div className="bg-white/10 rounded-lg p-2">
              <div className="text-green-300 font-bold text-lg">{totalSuccessDays}</div>
              <div>記録成功日数</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <div className="text-orange-300 font-bold text-lg">{totalFailedDays}</div>
              <div>未記録日数</div>
            </div>
          </div>

          {/* 特別メッセージ */}
          {achievementRate >= 100 && (
            <div className="mt-4 p-3 bg-yellow-400/20 rounded-lg border border-yellow-400/30">
              <p className="text-yellow-200 text-sm font-medium">
                🎉 完全勝利！あなたは禁煙チャレンジの勝者です！
                <br />
                マネーモンスターを倒し、お金と健康を取り戻しました！
              </p>
            </div>
          )}
          
          {achievementRate >= 75 && achievementRate < 100 && (
            <div className="mt-4 p-3 bg-orange-400/20 rounded-lg border border-orange-400/30">
              <p className="text-orange-200 text-sm">
                🔥 あと少し！この調子でマネーモンスターを倒しましょう！
              </p>
            </div>
          )}

          {/* ゲーム完了時の結果発表 */}
          {isGameCompleted && (
            <div className="mt-6 p-6 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-lg border border-yellow-400/30">
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-200 mb-3">
                  🎉 30日間のチャレンジが完了しました！
                </h3>
                <p className="text-yellow-100 text-sm mb-4">
                  {getGameCompletionMessage()}
                </p>
                
                <div className="grid grid-cols-1 gap-3 mb-6 text-sm">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-yellow-200">
                      <span className="font-bold">記録成功日数:</span> 30日中{totalSuccessDays}日記録を続けました
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-yellow-200">
                      <span className="font-bold">達成率:</span> {achievementRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-yellow-200">
                      <span className="font-bold">取り戻した金額:</span> ¥{(totalAmount - remainingAmount).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <form action={onRestartChallenge}>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      🔄 もう一度チャレンジする
                    </button>
                  </form>
                  
                  <form action={onFinishChallenge}>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      ✨ 今回は終了する
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 