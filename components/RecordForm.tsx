'use client'

import { useState } from 'react'
import { SoundButton, useSoundManager } from './SoundManager'
import { submitRecord } from '@/app/record/actions'

interface RecordFormProps {
  dailyDamage: number
}

export default function RecordForm({ dailyDamage }: RecordFormProps) {
  const [selectedValue, setSelectedValue] = useState<string>('')
  const [showCountermeasure, setShowCountermeasure] = useState(false)
  const { playClickSound } = useSoundManager()

  const handleRadioChange = (value: string) => {
    playClickSound()
    setSelectedValue(value)
    setShowCountermeasure(value === 'true')
  }

  return (
    <form action={submitRecord} className="space-y-6">
      {/* 喫煙質問 */}
      <div className="text-center">
        <span className="text-6xl block mb-6">🐉</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          今日煙草を吸いましたか？
        </h2>
        <p className="text-gray-600 mb-8">
          正直な記録がマネーモンスターへの最も効果的な攻撃となります
        </p>
      </div>

      {/* 選択肢 */}
      <div className="space-y-4">
        <label 
          className={`flex items-center p-6 border-2 rounded-lg cursor-pointer hover:border-green-300 transition-colors ${
            selectedValue === 'false' ? 'border-green-500 bg-green-50' : 'border-gray-300'
          }`}
          onClick={() => handleRadioChange('false')}
        >
          <input
            type="radio"
            name="smoked"
            value="false"
            required
            className="sr-only"
            checked={selectedValue === 'false'}
            onChange={() => {}} // ハンドリングはonClickで行う
          />
          <div className="flex flex-col items-center w-full">
            <span className="text-4xl block mb-2">🚭</span>
            <span className="text-lg font-medium text-gray-900">いいえ</span>
            <p className="text-sm text-gray-600 mt-1">今日は禁煙できました！</p>
          </div>
        </label>

        <label 
          className={`flex items-center p-6 border-2 rounded-lg cursor-pointer hover:border-red-300 transition-colors ${
            selectedValue === 'true' ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          onClick={() => handleRadioChange('true')}
        >
          <input
            type="radio"
            name="smoked"
            value="true"
            required
            className="sr-only"
            checked={selectedValue === 'true'}
            onChange={() => {}} // ハンドリングはonClickで行う
          />
          <div className="flex flex-col items-center w-full">
            <span className="text-4xl block mb-2">🚬</span>
            <span className="text-lg font-medium text-gray-900">はい</span>
            <p className="text-sm text-gray-600 mt-1">今日は吸ってしまいました</p>
          </div>
        </label>
      </div>

      {/* 対策入力エリア */}
      {showCountermeasure && (
        <div className="animate-slide-down">
          <div className="text-center mb-4">
            <span className="text-4xl block mb-4">💭</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              明日の禁煙のための対策
            </h3>
            <p className="text-gray-600">
              今日の経験を活かして、明日はマネーモンスターに大ダメージを与えましょう
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              明日の禁煙のためにどのような対策を取るつもりですか？
            </label>
            <textarea
              name="countermeasure"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例：ストレス発散のために散歩をする、ガムを噛む、禁煙アプリを使う など"
            />
          </div>
        </div>
      )}

      {/* 送信ボタン */}
      <div className="text-center">
        <SoundButton
          type="submit"
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          記録する
        </SoundButton>
      </div>

      {/* 想定されるダメージ表示 */}
      <div className="text-center text-sm text-gray-600">
        <p>記録をつけることで：マネーモンスターに <strong>¥{dailyDamage.toLocaleString()}</strong> のダメージ！</p>
        <p>禁煙できた日も、吸ってしまった日も、記録すれば同じダメージを与えられます</p>
      </div>
    </form>
  )
} 