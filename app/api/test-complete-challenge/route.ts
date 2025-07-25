import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(_request: NextRequest) {
  console.log('🧪 Test Challenge Completion API called')
  
  try {
    // 開発環境でのみ動作
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' }, 
        { status: 403 }
      )
    }

    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // アクティブなチャレンジを取得
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'No active challenge found' }, 
        { status: 404 }
      )
    }

    // チャレンジを30日経過したかのように強制更新
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    console.log('🧪 Forcing challenge completion for testing...')
    const { error: updateError } = await supabase
      .from('challenges')
      .update({
        start_date: thirtyDaysAgo.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', challenge.id)

    if (updateError) {
      console.error('❌ Failed to update challenge:', updateError)
      return NextResponse.json(
        { error: 'Failed to update challenge' }, 
        { status: 500 }
      )
    }

    console.log('✅ Challenge forced to completed state for testing')
    return NextResponse.json({
      success: true,
      message: 'チャレンジを強制完了状態にしました（テスト用）',
      challenge_id: challenge.id,
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('💥 Test completion error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 