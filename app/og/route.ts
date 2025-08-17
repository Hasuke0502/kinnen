export const runtime = 'edge'

import { ImageResponse } from 'next/og'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || '禁煙30日チャレンジ'
  const subtitle = searchParams.get('subtitle') || 'マネーモンスターと戦い、お金と健康を取り戻そう'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #6d28d9 60%, #be185d 100%)',
          color: 'white',
          fontFamily: 'Noto Sans JP, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: 80,
          }}
        >
          <div style={{ fontSize: 80, lineHeight: 1, fontWeight: 800 }}>🏰 {title}</div>
          <div style={{ fontSize: 36, marginTop: 20, opacity: 0.95 }}>{subtitle}</div>
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              gap: 24,
              opacity: 0.9,
              fontSize: 28,
            }}
          >
            <div>💰 インセンティブ</div>
            <div>🎮 ゲーム性</div>
            <div>📊 毎日記録</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}


