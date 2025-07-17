'use client'

import { useSoundManager, SoundButton } from './SoundManager'

export default function SoundSettings() {
  const { settings, updateSettings, playClickSound, playSuccessSound, playDamageSound, playProgressSound, isLoading } = useSoundManager()

  const handleEnabledChange = (enabled: boolean) => {
    updateSettings({ enabled })
  }

  const handleVolumeChange = (volume: 'low' | 'medium' | 'high') => {
    updateSettings({ volume })
  }

  const testSound = (type: 'click' | 'success' | 'damage' | 'progress') => {
    switch (type) {
      case 'click':
        playClickSound()
        break
      case 'success':
        playSuccessSound()
        break
      case 'damage':
        playDamageSound()
        break
      case 'progress':
        playProgressSound()
        break
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">🔊 音響効果設定</h3>
      
      <div className="space-y-4">
        {/* 音響効果のON/OFF */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">音響効果</p>
            <p className="text-xs text-gray-600">ボタンクリック音や効果音を再生</p>
          </div>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={settings.enabled}
                onChange={(e) => handleEnabledChange(e.target.checked)}
              />
              <div className={`w-11 h-6 bg-gray-200 rounded-full peer ${settings.enabled ? 'peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600' : ''}`}>
                <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${settings.enabled ? 'translate-x-full bg-white' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>

        {/* 音量設定 */}
        {settings.enabled && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-3">音量</p>
            <div className="space-y-2">
              {(['low', 'medium', 'high'] as const).map((volume) => (
                <label key={volume} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="volume"
                    value={volume}
                    checked={settings.volume === volume}
                    onChange={() => handleVolumeChange(volume)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {volume === 'low' ? '小' : volume === 'medium' ? '中' : '大'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* サウンドテスト */}
        {settings.enabled && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-3">効果音テスト</p>
            <div className="grid grid-cols-2 gap-2">
              <SoundButton
                onClick={() => testSound('click')}
                className="text-xs bg-blue-100 text-blue-800 px-3 py-2 rounded hover:bg-blue-200"
              >
                🔘 クリック音
              </SoundButton>
              <SoundButton
                onClick={() => testSound('success')}
                className="text-xs bg-green-100 text-green-800 px-3 py-2 rounded hover:bg-green-200"
              >
                ✅ 成功音
              </SoundButton>
              <SoundButton
                onClick={() => testSound('damage')}
                className="text-xs bg-red-100 text-red-800 px-3 py-2 rounded hover:bg-red-200"
              >
                ⚔️ ダメージ音
              </SoundButton>
              <SoundButton
                onClick={() => testSound('progress')}
                className="text-xs bg-yellow-100 text-yellow-800 px-3 py-2 rounded hover:bg-yellow-200"
              >
                💰 進捗音
              </SoundButton>
            </div>
          </div>
        )}

        {/* 音声ファイル状況 */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">音声ファイル状況</p>
          {isLoading ? (
            <div className="flex items-center text-sm text-gray-600">
              <span className="animate-spin mr-2">⏳</span>
              音声ファイルを読み込み中...
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p>✅ 音声ファイルの読み込み完了</p>
              <p className="text-xs mt-1">
                MP3ファイルが利用可能な場合は高品質な音響効果を使用し、
                <br />ファイルがない場合は自動的にフォールバック音を使用します。
              </p>
            </div>
          )}
        </div>

        {/* 音響効果について */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 音響効果は禁煙チャレンジのゲーム体験を向上させ、モチベーションアップに役立ちます。
            公共の場ではデバイスのサイレントモードをご活用ください。
          </p>
          <p className="text-xs text-blue-700 mt-2">
            🎵 カスタム音声ファイル（click.mp3, success.mp3, damage.mp3, progress.mp3）を
            public/sounds/フォルダに配置すると、より高品質な音響効果を使用できます。
          </p>
        </div>
      </div>
    </div>
  )
} 