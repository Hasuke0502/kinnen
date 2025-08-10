import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(_request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // アクティブなチャレンジ
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

    const testPaymentIntentId = `test_pi_${Date.now()}`

    const { error: updateError } = await supabase
      .from('challenges')
      .update({
        payment_intent_id: testPaymentIntentId,
        payment_completed: true,
        payment_completed_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', challenge.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update challenge' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '支払い完了をテスト用にマークしました',
      payment_intent_id: testPaymentIntentId,
      challenge_id: challenge.id
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

