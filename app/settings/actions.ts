'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

interface ContactFormResult {
  success: boolean
  error?: string
}

export async function submitContactForm(formData: FormData): Promise<ContactFormResult> {
  try {
    const supabase = await createClient()
    
    // ユーザー認証確認
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return { success: false, error: '認証エラーが発生しました。' }
    }

    // フォームデータの取得と検証
    const subject = formData.get('subject') as string
    const content = formData.get('content') as string
    const userEmail = formData.get('userEmail') as string

    if (!subject || !content) {
      return { success: false, error: '件名と内容は必須項目です。' }
    }

    if (content.length < 10) {
      return { success: false, error: 'お問い合わせ内容は10文字以上で入力してください。' }
    }

    if (content.length > 2000) {
      return { success: false, error: 'お問い合わせ内容は2000文字以内で入力してください。' }
    }

    // メール送信処理（Resend API使用）
    const emailData = {
      from: 'onboarding@resend.dev', // Resendの共有ドメインを使用
      to: 'yabaichemistryteacher@gmail.com',
      subject: `禁煙30日チャレンジ - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">禁煙30日チャレンジ - お問い合わせ</h2>
          
          <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>件名:</strong> ${subject}</p>
            <p><strong>送信者:</strong> ${userEmail}</p>
            <p><strong>ユーザーID:</strong> ${user.id}</p>
            <p><strong>送信日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h3 style="margin-top: 0;">お問い合わせ内容:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${content}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #FEF3C7; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #92400E;">
              <strong>注意:</strong> このメールは禁煙30日チャレンジアプリから自動送信されています。
              返信する際は上記の送信者メールアドレス（${userEmail}）宛にお送りください。
            </p>
          </div>
        </div>
      `
    }

    // 環境変数からResend APIキーを取得
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      // APIキーが設定されていない場合は、ログに記録してモック成功を返す
      console.log('お問い合わせメール（モック送信）:', emailData)
      return { success: true }
    }

    // Resend APIを使用してメール送信
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('メール送信エラー:', errorData)
      return { success: false, error: 'メール送信に失敗しました。しばらく時間をおいて再度お試しください。' }
    }

    const result = await response.json()
    console.log('メール送信成功:', result.id)

    return { success: true }

  } catch (error) {
    console.error('お問い合わせフォーム送信エラー:', error)
    return { success: false, error: 'システムエラーが発生しました。しばらく時間をおいて再度お試しください。' }
  }
} 