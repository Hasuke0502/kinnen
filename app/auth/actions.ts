'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  try {
    const supabase = await createClient()

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    if (!data.email || !data.password) {
      redirect('/auth/login?error=' + encodeURIComponent('メールアドレスとパスワードを入力してください'))
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      redirect('/auth/login?error=' + encodeURIComponent('ログインに失敗しました: ' + error.message))
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    redirect('/auth/login?error=' + encodeURIComponent('予期しないエラーが発生しました'))
  }
}

export async function signup(formData: FormData) {
  try {
    const supabase = await createClient()

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    if (!data.email || !data.password) {
      redirect('/auth/login?error=' + encodeURIComponent('メールアドレスとパスワードを入力してください'))
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
      redirect('/auth/login?error=' + encodeURIComponent('アカウント作成に失敗しました: ' + error.message))
    }

    revalidatePath('/', 'layout')
    redirect('/auth/login?message=' + encodeURIComponent('確認メールを送信しました。メールをご確認ください。'))
  } catch (error) {
    console.error('Signup error:', error)
    redirect('/auth/login?error=' + encodeURIComponent('予期しないエラーが発生しました'))
  }
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/login')
  } catch (error) {
    console.error('Logout error:', error)
    redirect('/auth/login?error=' + encodeURIComponent('ログアウトに失敗しました'))
  }
} 