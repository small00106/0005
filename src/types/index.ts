export type SceneType = 'neon_city' | 'coastal_highway' | 'mountain_road' | 'desert_sunset'

export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'fog'

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  drift: boolean
  nitro: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: 'smoke' | 'flame' | 'trail' | 'spark' | 'rain'
}

export interface SceneConfig {
  id: SceneType
  name: string
  duration: number
  roadColor: string
  roadEdgeColor: string
  roadsideColor: string
  skyColors: [string, string]
  buildingColors: string[]
  neonColors: string[]
  decorations: {
    type: 'building' | 'tree' | 'palm' | 'cactus' | 'mountain'
    color: string
    secondaryColor: string
  }[]
}

export interface GameSave {
  id: string
  timestamp: number
  playTime: number
  currentScene: SceneType
  currentSpeed: number
  nitro: number
  timeOfDay: number
  weather: WeatherType
  totalDistance: number
  highScore: number
  sceneProgress: number
}

export interface GameState {
  running: boolean
  paused: boolean
  speed: number
  nitro: number
  maxNitro: number
  currentScene: SceneType
  sceneName: string
  sceneProgress: number
  timeOfDay: number
  weather: WeatherType
  playTime: number
  totalDistance: number
  highScore: number
  drifting: boolean
  usingNitro: boolean
}
