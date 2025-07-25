'use client'

import { useState } from 'react'
import { submitContactForm } from '@/app/settings/actions'

interface ContactFormProps {
  userEmail: string
}

export default function ContactForm({ userEmail }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setMessage('')
    
    try {
      const result = await submitContactForm(formData)
      
      if (result.success) {
        setIsSuccess(true)
        setMessage('お問い合わせを送信しました。ご連絡ありがとうございます。')
        // フォームをリセット
        const form = document.getElementById('contact-form') as HTMLFormElement
        if (form) form.reset()
      } else {
        setMessage(result.error || 'エラーが発生しました。もう一度お試しください。')
      }
    } catch {
      setMessage('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">📧 お問い合わせ</h3>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          isSuccess 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      <form id="contact-form" action={handleSubmit} className="space-y-4">
        <input type="hidden" name="userEmail" value={userEmail} />
        
        {/* 件名選択 */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
            件名 <span className="text-red-500">*</span>
          </label>
          <select
            id="subject"
            name="subject"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">件名を選択してください</option>
            <option value="使い方について">使い方について</option>
            <option value="技術的な問題">技術的な問題</option>
            <option value="決済・返金について">決済・返金について</option>
            <option value="その他">その他</option>
          </select>
        </div>

        {/* 問い合わせ内容 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-900 mb-2">
            お問い合わせ内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={6}
            placeholder="お困りのことやご質問をお聞かせください..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* 送信ボタン */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '送信中...' : 'お問い合わせを送信'}
          </button>
        </div>

        {/* 注意事項 */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-700 mb-1">📝 お問い合わせについて</p>
          <ul className="space-y-1">
            <li>• 通常1-2営業日以内にご返信いたします</li>
            <li>• 緊急の技術的問題の場合は、できるだけ早急に対応いたします</li>
            <li>• お送りいただいた情報は適切に管理し、サポート目的のみに使用します</li>
          </ul>
        </div>
      </form>
    </div>
  )
} 