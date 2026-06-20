import type { GameSave } from '../types'

const STORAGE_KEY = 'pixel_racer_saves'
const SETTINGS_KEY = 'pixel_racer_settings'

export function getAllSaves(): GameSave[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function getLatestSave(): GameSave | null {
  const saves = getAllSaves()
  if (saves.length === 0) return null
  return saves.sort((a, b) => b.timestamp - a.timestamp)[0]
}

export function saveGame(save: Omit<GameSave, 'id' | 'timestamp'>): GameSave {
  const saves = getAllSaves()
  const newSave: GameSave = {
    ...save,
    id: `save_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  }
  
  saves.push(newSave)
  
  if (saves.length > 10) {
    saves.sort((a, b) => b.timestamp - a.timestamp)
    saves.splice(10)
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
  return newSave
}

export function deleteSave(id: string): void {
  const saves = getAllSaves().filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
}

export function clearAllSaves(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

export function getSettings<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(`${SETTINGS_KEY}_${key}`)
    if (!data) return defaultValue
    return JSON.parse(data)
  } catch {
    return defaultValue
  }
}

export function setSettings<T>(key: string, value: T): void {
  localStorage.setItem(`${SETTINGS_KEY}_${key}`, JSON.stringify(value))
}
