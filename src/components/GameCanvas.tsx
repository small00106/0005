import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GameEngine } from '../game/engine/GameEngine'
import type { GameState, GameSave, InputState } from '../types'
import HUD from './HUD'
import SaveModal from './SaveModal'
import { saveGame, getLatestSave } from '../utils/storage'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const virtualInputRef = useRef<{ setInput: (action: keyof InputState, value: boolean) => void } | null>(null)

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new GameEngine(canvasRef.current, {
      onStateChange: handleStateChange,
    })
    engineRef.current = engine
    virtualInputRef.current = engine.getVirtualInput()

    const state = location.state as { loadSave?: boolean } | null
    if (state?.loadSave) {
      const save = getLatestSave()
      if (save) {
        engine.start(save)
      } else {
        engine.start()
      }
    } else {
      engine.start()
    }

    const handleVirtualControl = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: keyof InputState; value: boolean }>
      if (virtualInputRef.current) {
        virtualInputRef.current.setInput(customEvent.detail.action, customEvent.detail.value)
      }
    }

    window.addEventListener('virtual-control', handleVirtualControl)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        setShowExitConfirm(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('virtual-control', handleVirtualControl)
      window.removeEventListener('keydown', handleKeyDown)
      engine.destroy()
    }
  }, [location.state, handleStateChange])

  const handleExit = () => {
    setShowExitConfirm(true)
  }

  const confirmExit = (shouldSave: boolean) => {
    if (shouldSave && engineRef.current) {
      const saveData = engineRef.current.createSave()
      saveGame(saveData)
    }
    engineRef.current?.stop()
    navigate('/')
  }

  const handleSave = () => {
    setShowSaveModal(true)
  }

  const handleSaveCurrent = () => {
    if (engineRef.current) {
      const saveData = engineRef.current.createSave()
      saveGame(saveData)
      alert('游戏已保存！')
    }
  }

  const handleLoadSave = (save: GameSave) => {
    if (engineRef.current) {
      engineRef.current.stop()
      setShowSaveModal(false)
      engineRef.current.start(save)
    }
  }

  const getCurrentSavePreview = () => {
    if (!engineRef.current) return null
    return engineRef.current.createSave()
  }

  return (
    <div className="w-full h-full relative bg-cyber-black flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="block max-w-full max-h-full"
        style={{ imageRendering: 'pixelated' }}
      />

      <HUD
        gameState={gameState}
        onExit={handleExit}
        onSave={handleSave}
      />

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        currentSavePreview={getCurrentSavePreview()}
        onSaveCurrent={handleSaveCurrent}
        onLoadSave={handleLoadSave}
      />

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-black/90 backdrop-blur-sm">
          <div className="hud-panel p-6 max-w-md w-full mx-4">
            <h3
              className="font-pixel text-lg mb-6 text-center neon-text"
              style={{ color: '#FF2D95' }}
            >
              退出游戏
            </h3>
            <p className="text-gray-300 text-center mb-6">
              是否保存当前游戏进度？
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => confirmExit(true)}
                className="pixel-btn-yellow w-full"
              >
                保存并退出
              </button>
              <button
                onClick={() => confirmExit(false)}
                className="pixel-btn-pink w-full"
              >
                不保存退出
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="pixel-btn-blue w-full"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none md:hidden">
        <p className="font-pixel text-xs text-neon-blue/50">按 ESC 或点击左上角退出</p>
      </div>
    </div>
  )
}
