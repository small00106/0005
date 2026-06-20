import { useEffect, useState } from 'react'
import { X, Save, Trash2, Clock, MapPin, Trophy } from 'lucide-react'
import type { GameSave } from '../types'
import { getAllSaves, deleteSave, formatTime, formatDateTime } from '../utils/storage'
import { SCENE_CONFIGS, WEATHER_CONFIGS } from '../data/scenes'

interface SaveModalProps {
  isOpen: boolean
  onClose: () => void
  currentSavePreview?: Omit<GameSave, 'id' | 'timestamp'> | null
  onSaveCurrent?: () => void
  onLoadSave?: (save: GameSave) => void
}

export default function SaveModal({
  isOpen,
  onClose,
  currentSavePreview,
  onSaveCurrent,
  onLoadSave,
}: SaveModalProps) {
  const [saves, setSaves] = useState<GameSave[]>([])

  useEffect(() => {
    if (isOpen) {
      refreshSaves()
    }
  }, [isOpen])

  const refreshSaves = () => {
    setSaves(getAllSaves())
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个存档吗？')) {
      deleteSave(id)
      refreshSaves()
    }
  }

  const getSceneName = (sceneId: string) => {
    const scene = SCENE_CONFIGS.find(s => s.id === sceneId)
    return scene?.name || sceneId
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-black/90 backdrop-blur-sm">
      <div className="hud-panel w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neon-blue/30">
          <h2
            className="font-pixel text-xl neon-text"
            style={{ color: '#FFE600' }}
          >
            存档管理
          </h2>
          <button
            onClick={onClose}
            className="text-neon-blue hover:text-neon-pink transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {currentSavePreview && onSaveCurrent && (
          <div className="p-4 border-b border-neon-blue/20 bg-cyber-deep/30">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-pixel text-xs text-neon-purple mb-2">当前游戏进度</p>
                <div className="flex flex-wrap gap-4 text-sm text-white">
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-neon-blue" />
                    {formatTime(currentSavePreview.playTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-neon-pink" />
                    {getSceneName(currentSavePreview.currentScene)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy size={14} className="text-neon-yellow" />
                    {Math.round(currentSavePreview.totalDistance / 10)}m
                  </span>
                  <span>
                    {WEATHER_CONFIGS[currentSavePreview.weather].icon} {WEATHER_CONFIGS[currentSavePreview.weather].name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onSaveCurrent()
                  refreshSaves()
                }}
                className="pixel-btn-yellow flex items-center gap-2"
              >
                <Save size={16} />
                保存
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {saves.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-pixel text-sm text-neon-blue/60">暂无存档</p>
            </div>
          ) : (
            <div className="space-y-3">
              {saves
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((save) => (
                  <div
                    key={save.id}
                    className="p-4 bg-cyber-deep/50 border border-neon-blue/20 rounded hover:border-neon-blue/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span
                            className="font-pixel text-sm neon-text"
                            style={{ color: '#00D4FF' }}
                          >
                            {getSceneName(save.currentScene)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(save.timestamp)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-neon-blue/70" />
                            {formatTime(save.playTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy size={12} className="text-neon-yellow/70" />
                            {Math.round(save.totalDistance / 10)}m
                          </span>
                          <span>
                            {WEATHER_CONFIGS[save.weather].icon} {WEATHER_CONFIGS[save.weather].name}
                          </span>
                          <span>
                            氮气: {Math.round(save.nitro)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {onLoadSave && (
                          <button
                            onClick={() => onLoadSave(save)}
                            className="pixel-btn-blue text-xs px-3 py-2"
                          >
                            读取
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(save.id)}
                          className="p-2 text-neon-pink/70 hover:text-neon-pink transition-colors border border-neon-pink/30 hover:border-neon-pink/60 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neon-blue/30 flex justify-end">
          <button onClick={onClose} className="pixel-btn-purple">
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
