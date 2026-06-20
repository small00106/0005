import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../types'
import { WEATHER_CONFIGS } from '../data/scenes'
import { formatTime } from '../utils/storage'

interface HUDProps {
  gameState: GameState | null
  onExit: () => void
  onSave: () => void
}

export default function HUD({ gameState, onExit, onSave }: HUDProps) {
  const [sceneAnim, setSceneAnim] = useState(false)
  const prevSceneRef = useRef<string>('')

  useEffect(() => {
    if (gameState && gameState.sceneName !== prevSceneRef.current) {
      prevSceneRef.current = gameState.sceneName
      setSceneAnim(true)
      const timer = setTimeout(() => setSceneAnim(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [gameState?.sceneName])

  if (!gameState) return null

  const weatherInfo = WEATHER_CONFIGS[gameState.weather]
  const speedPercent = Math.min(gameState.speed / 300, 1)
  const nitroPercent = gameState.nitro / gameState.maxNitro
  const hours = Math.floor(gameState.timeOfDay)
  const minutes = Math.floor((gameState.timeOfDay - hours) * 60)
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute top-4 left-4 flex gap-3 pointer-events-auto">
        <button
          onClick={onExit}
          className="hud-panel px-4 py-2 font-pixel text-xs text-neon-pink hover:text-white transition-colors"
        >
          退出
        </button>
        <button
          onClick={onSave}
          className="hud-panel px-4 py-2 font-pixel text-xs text-neon-yellow hover:text-white transition-colors"
        >
          保存
        </button>
      </div>

      <div className="absolute top-4 right-4 hud-panel px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{weatherInfo.icon}</span>
          <span className="font-pixel text-xs text-neon-blue">{weatherInfo.name}</span>
        </div>
        <div className="w-px h-4 bg-neon-blue/30" />
        <div className="flex items-center gap-2">
          <span className="text-lg">{gameState.timeOfDay >= 6 && gameState.timeOfDay < 18 ? '☀️' : '🌙'}</span>
          <span className="font-pixel text-xs text-neon-green">{timeStr}</span>
        </div>
        <div className="w-px h-4 bg-neon-blue/30" />
        <div className="font-pixel text-xs text-neon-purple">
          {formatTime(gameState.playTime)}
        </div>
      </div>

      {sceneAnim && (
        <div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            animation: 'fadeInOut 2.5s ease-in-out',
          }}
        >
          <div
            className="font-pixel text-3xl md:text-5xl neon-text"
            style={{ color: '#00D4FF' }}
          >
            {gameState.sceneName}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <div className="flex justify-between items-end">
          <div className="hud-panel p-4 w-48 md:w-64">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-pixel text-xs text-neon-blue">速度</span>
              <span className="font-pixel text-xs text-neon-blue">KM/H</span>
            </div>
            <div
              className="font-pixel text-3xl md:text-4xl neon-text mb-3"
              style={{ color: speedPercent > 0.8 ? '#FF2D95' : '#00FF88' }}
            >
              {Math.round(gameState.speed)}
            </div>
            <div className="h-2 bg-cyber-deep rounded overflow-hidden">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${speedPercent * 100}%`,
                  background: `linear-gradient(90deg, #00FF88, #00D4FF, #FF2D95)`,
                  boxShadow: '0 0 10px currentColor',
                }}
              />
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {gameState.drifting && (
                <span className="px-2 py-1 bg-neon-pink/30 text-neon-pink font-pixel text-xs border border-neon-pink/50 animate-pulse">
                  DRIFT
                </span>
              )}
              {gameState.usingNitro && (
                <span className="px-2 py-1 bg-neon-blue/30 text-neon-blue font-pixel text-xs border border-neon-blue/50 animate-pulse">
                  NITRO
                </span>
              )}
            </div>
          </div>

          <div className="hud-panel p-4 w-48 md:w-64">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-xs text-neon-blue">氮气</span>
              <span className="font-pixel text-xs text-neon-blue">
                {Math.round(gameState.nitro)}/{gameState.maxNitro}
              </span>
            </div>
            <div className="relative h-4 bg-cyber-deep rounded overflow-hidden">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${nitroPercent * 100}%`,
                  background: 'linear-gradient(90deg, #00D4FF, #00FF88)',
                  boxShadow: '0 0 15px #00D4FF',
                }}
              />
              {gameState.usingNitro && (
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-pixel text-xs text-neon-purple">总里程</span>
                <span className="font-pixel text-sm text-neon-yellow">
                  {Math.round(gameState.totalDistance / 10)}m
                </span>
              </div>
              <div className="h-1 bg-cyber-deep rounded overflow-hidden">
                <div
                  className="h-full bg-neon-purple"
                  style={{
                    width: `${(gameState.sceneProgress * 100)}%`,
                    boxShadow: '0 0 5px #8B5CF6',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto md:hidden">
        <TouchControls />
      </div>

      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  )
}

function TouchControls() {
  const handleTouch = (e: React.TouchEvent | React.MouseEvent, action: string, isStart: boolean) => {
    e.preventDefault()
    const event = new CustomEvent('virtual-control', {
      detail: { action, value: isStart }
    })
    window.dispatchEvent(event)
  }

  const buttonClass = "w-14 h-14 rounded-full flex items-center justify-center font-pixel text-lg active:scale-90 transition-transform select-none"

  return (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <button
          className={`${buttonClass} bg-neon-pink/40 text-neon-pink border-2 border-neon-pink/60`}
          onTouchStart={(e) => handleTouch(e, 'up', true)}
          onTouchEnd={(e) => handleTouch(e, 'up', false)}
          onMouseDown={(e) => handleTouch(e, 'up', true)}
          onMouseUp={(e) => handleTouch(e, 'up', false)}
        >
          W
        </button>
        <div className="flex gap-2">
          <button
            className={`${buttonClass} bg-neon-blue/40 text-neon-blue border-2 border-neon-blue/60`}
            onTouchStart={(e) => handleTouch(e, 'left', true)}
            onTouchEnd={(e) => handleTouch(e, 'left', false)}
            onMouseDown={(e) => handleTouch(e, 'left', true)}
            onMouseUp={(e) => handleTouch(e, 'left', false)}
          >
            A
          </button>
          <button
            className={`${buttonClass} bg-neon-blue/40 text-neon-blue border-2 border-neon-blue/60`}
            onTouchStart={(e) => handleTouch(e, 'right', true)}
            onTouchEnd={(e) => handleTouch(e, 'right', false)}
            onMouseDown={(e) => handleTouch(e, 'right', true)}
            onMouseUp={(e) => handleTouch(e, 'right', false)}
          >
            D
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button
          className={`${buttonClass} bg-neon-purple/40 text-neon-purple border-2 border-neon-purple/60`}
          onTouchStart={(e) => handleTouch(e, 'drift', true)}
          onTouchEnd={(e) => handleTouch(e, 'drift', false)}
          onMouseDown={(e) => handleTouch(e, 'drift', true)}
          onMouseUp={(e) => handleTouch(e, 'drift', false)}
        >
          漂
        </button>
        <button
          className={`${buttonClass} bg-neon-yellow/40 text-neon-yellow border-2 border-neon-yellow/60`}
          onTouchStart={(e) => handleTouch(e, 'nitro', true)}
          onTouchEnd={(e) => handleTouch(e, 'nitro', false)}
          onMouseDown={(e) => handleTouch(e, 'nitro', true)}
          onMouseUp={(e) => handleTouch(e, 'nitro', false)}
        >
          N
        </button>
      </div>
    </div>
  )
}
