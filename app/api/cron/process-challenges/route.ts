import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron Job専用の認証チェック
function validateCronRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
  
  if (!expectedAuth || authHeader !== expectedAuth) {
    return false
  }
  return true
}

export async function GET(request: NextRequest) {
  console.log('🕒 Cron job: Proxying to Supabase Edge Function...')

  try {
    // Cron Jobの認証確認
    if (!validateCronRequest(request)) {
      console.error('❌ Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase config for proxy call')
      return NextResponse.json(
        { error: 'Server not configured for cron proxy' },
        { status: 500 }
      )
    }

    const functionsUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/process-completed-challenges`

    const res = await fetch(functionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({})
    })

    const body = await res.text()
    const json = (() => { try { return JSON.parse(body) } catch { return { raw: body } } })()

    if (!res.ok) {
      console.error('❌ Edge Function returned error:', json)
      return NextResponse.json({ error: 'Edge Function invocation failed', details: json }, { status: 500 })
    }

    console.log('✅ Edge Function completed via proxy')
    return NextResponse.json(json)

  } catch (error) {
    console.error('💥 Cron proxy fatal error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}