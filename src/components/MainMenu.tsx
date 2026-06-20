import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Save, Gamepad2, X } from 'lucide-react'
import { getLatestSave } from '../utils/storage'

export default function MainMenu() {
  const navigate = useNavigate()
  const [showControls, setShowControls] = useState(false)
  const latestSave = getLatestSave()

  const handleStartNew = () => {
    navigate('/game')
  }

  const handleContinue = () => {
    navigate('/game', { state: { loadSave: true } })
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-cyber-black">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-deep via-cyber-dark to-cyber-black" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-neon-blue/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              animation: `pulse-neon ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.1)_0%,_transparent_70%)]" />

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4">
        <div className="text-center mb-16 animate-float">
          <h1
            className="font-pixel text-5xl md:text-7xl mb-4 neon-text"
            style={{ color: '#FF2D95' }}
          >
            像素飞车
          </h1>
          <h2
            className="font-pixel text-xl md:text-2xl neon-text"
            style={{ color: '#00D4FF' }}
          >
            PIXEL RACER
          </h2>
          <div className="mt-6 flex justify-center gap-3">
            <div className="w-3 h-3 bg-neon-pink animate-pulse" />
            <div className="w-3 h-3 bg-neon-blue animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-neon-purple animate-pulse" style={{ animationDelay: '0.4s' }} />
            <div className="w-3 h-3 bg-neon-yellow animate-pulse" style={{ animationDelay: '0.6s' }} />
            <div className="w-3 h-3 bg-neon-green animate-pulse" style={{ animationDelay: '0.8s' }} />
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={handleStartNew}
            className="pixel-btn-pink flex items-center justify-center gap-3 w-full"
          >
            <Play size={20} />
            开始游戏
          </button>

          {latestSave && (
            <button
              onClick={handleContinue}
              className="pixel-btn-blue flex items-center justify-center gap-3 w-full"
            >
              <Save size={20} />
              继续游戏
            </button>
          )}

          <button
            onClick={() => setShowControls(true)}
            className="pixel-btn-purple flex items-center justify-center gap-3 w-full"
          >
            <Gamepad2 size={20} />
            操作说明
          </button>
        </div>

        <div className="absolute bottom-6 text-center">
          <p className="font-pixel text-xs text-neon-blue/60">
            © 2026 PIXEL RACER
          </p>
        </div>
      </div>

      {showControls && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-cyber-black/80 backdrop-blur-sm">
          <div className="hud-panel p-8 max-w-lg w-full mx-4 relative">
            <button
              onClick={() => setShowControls(false)}
              className="absolute top-4 right-4 text-neon-blue hover:text-neon-pink transition-colors"
            >
              <X size={24} />
            </button>
            
            <h3 className="font-pixel text-xl mb-6 neon-text text-center" style={{ color: '#00D4FF' }}>
              操作说明
            </h3>

            <div className="space-y-4 text-white">
              <div className="grid grid-cols-2 gap-4">
                <ControlKey label="加速" keys={['W', '↑']} />
                <ControlKey label="刹车" keys={['S', '↓']} />
                <ControlKey label="左转" keys={['A', '←']} />
                <ControlKey label="右转" keys={['D', '→']} />
                <ControlKey label="漂移" keys={['Space']} />
                <ControlKey label="氮气加速" keys={['Shift']} />
              </div>

              <div className="mt-6 p-4 bg-cyber-deep/50 border border-neon-purple/30 rounded">
                <p className="font-pixel text-xs text-neon-purple mb-2">提示</p>
                <ul className="text-sm space-y-1 text-gray-300">
                  <li>• 漂移时转向更灵敏，但速度会减慢</li>
                  <li>• 氮气可以大幅提升速度，但会消耗能量</li>
                  <li>• 离开赛道会减速，请保持在赛道内</li>
                  <li>• 场景会自动切换，享受不同风景</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ControlKey({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between p-3 bg-cyber-deep/50 border border-neon-blue/20 rounded">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 bg-cyber-black border border-neon-blue/50 text-neon-blue font-pixel text-xs rounded"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}
