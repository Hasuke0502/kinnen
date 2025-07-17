'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'

interface SoundSettings {
  enabled: boolean
  volume: 'low' | 'medium' | 'high'
}

interface SoundContextType {
  settings: SoundSettings
  updateSettings: (settings: Partial<SoundSettings>) => void
  playClickSound: () => void
  playSuccessSound: () => void
  playDamageSound: () => void
  playProgressSound: () => void
  isLoading: boolean
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function useSoundManager() {
  const context = useContext(SoundContext)
  if (!context) {
    throw new Error('useSoundManager must be used within a SoundProvider')
  }
  return context
}

interface SoundProviderProps {
  children: ReactNode
}

export function SoundProvider({ children }: SoundProviderProps) {
  const [settings, setSettings] = useState<SoundSettings>({
    enabled: true,
    volume: 'medium'
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // 音声ファイルの参照を保持
  const audioRefs = useRef<{
    click?: HTMLAudioElement
    success?: HTMLAudioElement
    damage?: HTMLAudioElement
    progress?: HTMLAudioElement
  }>({})

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const saved = localStorage.getItem('soundSettings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse sound settings:', error)
      }
    }
  }, [])

  // 音声ファイルのプリロード
  useEffect(() => {
    const loadAudio = async () => {
      const soundFiles = [
        { key: 'click', src: '/sounds/click.mp3' },
        { key: 'success', src: '/sounds/success.mp3' },
        { key: 'damage', src: '/sounds/damage.mp3' },
        { key: 'progress', src: '/sounds/progress.mp3' }
      ]

      const loadPromises = soundFiles.map(({ key, src }) => {
        return new Promise<void>((resolve) => {
          const audio = new Audio(src)
          audio.preload = 'auto'
          
          const handleLoad = () => {
            audioRefs.current[key as keyof typeof audioRefs.current] = audio
            resolve()
          }
          
          const handleError = () => {
            console.warn(`Failed to load sound file: ${src}`)
            resolve()
          }
          
          audio.addEventListener('canplaythrough', handleLoad, { once: true })
          audio.addEventListener('error', handleError, { once: true })
          
          // タイムアウトも設定
          setTimeout(() => {
            handleError()
          }, 3000)
        })
      })

      await Promise.all(loadPromises)
      setIsLoading(false)
    }

    loadAudio()
  }, [])

  const updateSettings = (newSettings: Partial<SoundSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('soundSettings', JSON.stringify(updated))
  }

  const getVolume = () => {
    switch (settings.volume) {
      case 'low': return 0.3
      case 'medium': return 0.6
      case 'high': return 1.0
      default: return 0.6
    }
  }

  // フォールバック用のプログラム生成音
  const playFallbackSound = (frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = type

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(getVolume(), audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)
    } catch (error) {
      console.warn('Fallback audio playback failed:', error)
    }
  }

  // MP3ファイルまたはフォールバック音を再生
  const playAudioFile = (audioKey: keyof typeof audioRefs.current, fallbackFn: () => void) => {
    if (!settings.enabled) return

    const audio = audioRefs.current[audioKey]
    if (audio) {
      try {
        audio.volume = getVolume()
        audio.currentTime = 0
        audio.play().catch(() => {
          // MP3再生に失敗した場合はフォールバック
          fallbackFn()
        })
      } catch (error) {
        // エラーの場合はフォールバック
        fallbackFn()
      }
    } else {
      // ファイルが読み込まれていない場合はフォールバック
      fallbackFn()
    }
  }

  const playClickSound = () => {
    playAudioFile('click', () => {
      playFallbackSound(800, 0.1, 'sine')
    })
  }

  const playSuccessSound = () => {
    playAudioFile('success', () => {
      // フォールバック：成功時の明るい音階
      playFallbackSound(523, 0.15, 'sine') // C
      setTimeout(() => playFallbackSound(659, 0.15, 'sine'), 100) // E
      setTimeout(() => playFallbackSound(784, 0.2, 'sine'), 200) // G
    })
  }

  const playDamageSound = () => {
    playAudioFile('damage', () => {
      // フォールバック：ダメージ音（低音から高音へ）
      playFallbackSound(200, 0.1, 'square')
      setTimeout(() => playFallbackSound(300, 0.1, 'square'), 50)
      setTimeout(() => playFallbackSound(400, 0.15, 'square'), 100)
    })
  }

  const playProgressSound = () => {
    playAudioFile('progress', () => {
      // フォールバック：進捗更新音（コイン音風）
      playFallbackSound(800, 0.1, 'sine')
      setTimeout(() => playFallbackSound(1000, 0.08, 'sine'), 80)
      setTimeout(() => playFallbackSound(1200, 0.06, 'sine'), 140)
    })
  }

  return (
    <SoundContext.Provider 
      value={{
        settings,
        updateSettings,
        playClickSound,
        playSuccessSound,
        playDamageSound,
        playProgressSound,
        isLoading
      }}
    >
      {children}
    </SoundContext.Provider>
  )
}

interface SoundButtonProps {
  onClick?: () => void
  children: ReactNode
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}

export function SoundButton({ onClick, children, className = '', type = 'button', disabled = false }: SoundButtonProps) {
  const { playClickSound } = useSoundManager()

  const handleClick = () => {
    playClickSound()
    onClick?.()
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  )
} 